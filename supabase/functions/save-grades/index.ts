// Edge function : enregistre la saisie manuelle d'un étudiant (identité + notes CC/Examen/Rattrapage + absences).
// Crée le compte Auth si nécessaire (mot de passe = matricule).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type SubjectNotes = {
  cc?: number | null;
  examen?: number | null;
  rattrapage?: number | null;
};

type Payload = {
  identity: {
    matricule: string;
    nom: string;
    prenom: string;
    dateNaissance?: string;
    lieuNaissance?: string;
    bac?: string;
    etablissement?: string;
  };
  semestre: "s5" | "s6";
  absenceHeures?: number;
  // Map<matiere_code, {cc, examen, rattrapage}>
  notes: Record<string, SubjectNotes>;
};

const slug = (s: string) =>
  String(s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "");

async function findUserByEmail(admin: any, email: string): Promise<string | null> {
  const target = email.toLowerCase();
  let page = 1;
  while (page <= 20) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error || !data?.users?.length) return null;
    const found = data.users.find(
      (u: any) => (u.email || "").toLowerCase() === target
    );
    if (found) return found.id;
    if (data.users.length < 200) return null;
    page++;
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
    } = await userClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Non authentifié" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: roles } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);
    const allowed = (roles ?? []).some((r: any) =>
      ["admin", "secretariat", "enseignant"].includes(r.role)
    );
    if (!allowed) {
      return new Response(JSON.stringify({ error: "Accès refusé" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: Payload = await req.json();
    const { identity, semestre, absenceHeures, notes } = body || ({} as Payload);

    const matricule = String(identity?.matricule || "").trim();
    const nom = String(identity?.nom || "").trim();
    const prenom = String(identity?.prenom || "").trim();

    if (!matricule || !nom || !prenom) {
      return new Response(
        JSON.stringify({ error: "Identité incomplète (matricule, nom, prénom requis)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (semestre !== "s5" && semestre !== "s6") {
      return new Response(JSON.stringify({ error: "Semestre invalide" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1) Upsert étudiant
    const { data: existing } = await admin
      .from("etudiants")
      .select("id, user_id")
      .eq("matricule", matricule)
      .maybeSingle();

    const identityFields = {
      nom,
      prenom,
      date_naissance: identity.dateNaissance || null,
      lieu_naissance: identity.lieuNaissance || null,
      bac: identity.bac || null,
      etablissement: identity.etablissement || null,
    };

    let etudiantId: string;
    let accountCreated = false;
    if (existing) {
      await admin.from("etudiants").update(identityFields).eq("id", existing.id);
      etudiantId = existing.id;
    } else {
      const { data: ins, error: insErr } = await admin
        .from("etudiants")
        .insert({ matricule, ...identityFields })
        .select("id")
        .single();
      if (insErr) {
        return new Response(JSON.stringify({ error: insErr.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      etudiantId = ins.id;
    }

    // 2) Auth account
    const email = `${slug(prenom)}.${slug(nom)}@inptic.ga`;
    let userId: string | null = existing?.user_id ?? null;
    if (!userId) {
      const { data: created, error: cErr } = await admin.auth.admin.createUser({
        email,
        password: matricule,
        email_confirm: true,
        user_metadata: { nom, prenom, matricule, role: "etudiant" },
      });
      if (cErr) {
        const found = await findUserByEmail(admin, email);
        if (found) userId = found;
      } else if (created.user) {
        userId = created.user.id;
        accountCreated = true;
      }
      if (userId) {
        await admin.from("etudiants").update({ user_id: userId }).eq("id", etudiantId);
      }
    }

    // 3) Charger référentiel matières
    const { data: matieres } = await admin.from("matieres").select("id, code");
    const matiereByCode = new Map<string, string>(
      (matieres ?? []).map((m: any) => [m.code, m.id])
    );

    let savedNotes = 0;
    const errors: string[] = [];

    for (const [code, vals] of Object.entries(notes || {})) {
      const matId = matiereByCode.get(code);
      if (!matId) {
        errors.push(`Matière inconnue: ${code}`);
        continue;
      }
      const triplets: Array<["cc" | "examen" | "rattrapage", number | null | undefined]> = [
        ["cc", vals.cc],
        ["examen", vals.examen],
        ["rattrapage", vals.rattrapage],
      ];
      for (const [type, raw] of triplets) {
        if (raw === null || raw === undefined || (raw as any) === "") continue;
        const n = Number(raw);
        if (isNaN(n)) continue;
        const noteClamped = Math.max(0, Math.min(20, n));
        const { error: upErr } = await admin.from("evaluations").upsert(
          {
            etudiant_id: etudiantId,
            matiere_id: matId,
            type,
            note: noteClamped,
          },
          { onConflict: "etudiant_id,matiere_id,type" }
        );
        if (upErr) errors.push(`${code}/${type}: ${upErr.message}`);
        else savedNotes++;
      }
    }

    // 4) Absences (cumulées sur l'ensemble du semestre — on stocke côté "matiere fictive" ?
    //    Le schéma absences attend matiere_id. On enregistre sur la 1ère matière du semestre
    //    pour conserver une trace globale. Le calcul du malus reste côté client.
    if (typeof absenceHeures === "number" && absenceHeures > 0) {
      const semCodes = semestre === "s5"
        ? ["anglais", "management", "communication", "droit", "gestionProjets", "veille",
           "programmation", "bdd", "ios", "lan", "scripts", "virtualisation",
           "clientServeur", "telephonie", "svaa"]
        : ["windows", "linux", "interop", "cryptage", "prevention",
           "accesDistant", "ccna3", "methodologie", "soutenance"];
      const firstMat = semCodes.map((c) => matiereByCode.get(c)).find(Boolean);
      if (firstMat) {
        // upsert manuel : delete + insert
        await admin
          .from("absences")
          .delete()
          .eq("etudiant_id", etudiantId)
          .eq("matiere_id", firstMat);
        await admin.from("absences").insert({
          etudiant_id: etudiantId,
          matiere_id: firstMat,
          heures: absenceHeures,
        });
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        etudiantId,
        accountCreated,
        savedNotes,
        errors: errors.slice(0, 50),
        totalErrors: errors.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
