// Edge function : import en masse d'étudiants + notes depuis le client.
// Le client envoie un payload JSON déjà parsé (matricule, nom, prenom, grades S5/S6).
// La fonction crée les comptes Auth manquants et upsert les évaluations (type "examen").

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type IncomingStudent = {
  matricule: string;
  nom: string;
  prenom: string;
  dateNaissance?: string;
  lieuNaissance?: string;
  bac?: string;
  etablissement?: string;
  s5?: Record<string, number>; // { matiereCode: note }
  s6?: Record<string, number>;
};

type Payload = { students: IncomingStudent[] };

const slug = (s: string) =>
  String(s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "");

// Recherche d'un user par email en paginant l'API Auth admin
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

    // Vérifier que l'appelant est admin/secretariat
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
      ["admin", "secretariat"].includes(r.role)
    );
    if (!allowed) {
      return new Response(JSON.stringify({ error: "Accès refusé" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: Payload = await req.json();
    if (!body?.students?.length) {
      return new Response(JSON.stringify({ error: "Aucun étudiant fourni" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1) Charger référentiel matières (code → id)
    const { data: matieres } = await admin
      .from("matieres")
      .select("id, code");
    const matiereByCode = new Map<string, string>(
      (matieres ?? []).map((m: any) => [m.code, m.id])
    );

    let createdAccounts = 0;
    let createdStudents = 0;
    let updatedStudents = 0;
    let createdEvaluations = 0;
    const errors: string[] = [];

    for (const s of body.students) {
      try {
        const matricule = String(s.matricule || "").trim();
        const nom = String(s.nom || "").trim();
        const prenom = String(s.prenom || "").trim();
        if (!matricule || !nom || !prenom) {
          errors.push(`Ligne ignorée (identité incomplète) : ${matricule || nom || prenom}`);
          continue;
        }

        const email = `${slug(prenom)}.${slug(nom)}@inptic.ga`;

        // 2) Upsert étudiant
        const { data: existing } = await admin
          .from("etudiants")
          .select("id, user_id")
          .eq("matricule", matricule)
          .maybeSingle();

        let etudiantId: string;
        if (existing) {
          await admin
            .from("etudiants")
            .update({ nom, prenom })
            .eq("id", existing.id);
          etudiantId = existing.id;
          updatedStudents++;
        } else {
          const { data: ins, error: insErr } = await admin
            .from("etudiants")
            .insert({ matricule, nom, prenom })
            .select("id")
            .single();
          if (insErr) {
            errors.push(`${matricule} : ${insErr.message}`);
            continue;
          }
          etudiantId = ins.id;
          createdStudents++;
        }

        // 3) Compte Auth (créer si inexistant, sinon récupérer)
        let userId: string | null = existing?.user_id ?? null;
        if (!userId) {
          const { data: created, error: cErr } =
            await admin.auth.admin.createUser({
              email,
              password: matricule,
              email_confirm: true,
              user_metadata: { nom, prenom, matricule, role: "etudiant" },
            });
          if (cErr) {
            // Probablement déjà existant : retrouver par email
            const found = await findUserByEmail(admin, email);
            if (found) {
              userId = found;
            } else {
              errors.push(`${matricule} (auth) : ${cErr.message}`);
            }
          } else if (created.user) {
            userId = created.user.id;
            createdAccounts++;
          }
          if (userId) {
            await admin
              .from("etudiants")
              .update({ user_id: userId })
              .eq("id", etudiantId);
          }
        }

        // 4) Notes : type "examen" (note finale issue du fichier Excel)
        const allGrades: Array<{ code: string; note: number }> = [];
        for (const [code, note] of Object.entries(s.s5 ?? {}))
          if (typeof note === "number" && !isNaN(note))
            allGrades.push({ code, note });
        for (const [code, note] of Object.entries(s.s6 ?? {}))
          if (typeof note === "number" && !isNaN(note))
            allGrades.push({ code, note });

        for (const g of allGrades) {
          const matId = matiereByCode.get(g.code);
          if (!matId) {
            errors.push(`${matricule}/${g.code} : matière inconnue`);
            continue;
          }
          const noteClamped = Math.max(0, Math.min(20, Number(g.note)));
          const { error: upErr } = await admin
            .from("evaluations")
            .upsert(
              {
                etudiant_id: etudiantId,
                matiere_id: matId,
                type: "examen",
                note: noteClamped,
              },
              { onConflict: "etudiant_id,matiere_id,type" }
            );
          if (upErr) {
            errors.push(`${matricule}/${g.code} : ${upErr.message}`);
          } else {
            createdEvaluations++;
          }
        }
      } catch (e: any) {
        errors.push(`${s.matricule} : ${e?.message || e}`);
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        createdAccounts,
        createdStudents,
        updatedStudents,
        createdEvaluations,
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
