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
  sexe?: string;
  etablissement?: string;
  classeKey?: string; // e.g. "GI-L3"
  s5?: Record<string, number>; // { matiereCode: note }
  s6?: Record<string, number>;
};

type Payload = { students: IncomingStudent[]; defaultClasseKey?: string };

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

    // 1) Charger référentiel matières et classes
    const { data: matieres } = await admin.from("matieres").select("id, code, classe_id");
    const matiereByCode = new Map<string, string>((matieres ?? []).map((m: any) => [m.code, m.id]));
    
    const { data: classes } = await admin.from("classes").select("id, code");
    const classeByCode = new Map<string, string>((classes ?? []).map((c: any) => [c.code, c.id]));
    const defaultClasseId = body.defaultClasseKey ? classeByCode.get(body.defaultClasseKey) : undefined;

    let createdAccounts = 0;
    let createdEvaluations = 0;
    const errors: string[] = [];

    // 2) Préparer les données pour Bulk Upsert
    const validStudents = body.students.filter((s) => s.matricule && s.nom && s.prenom);
    const matricules = validStudents.map((s) => String(s.matricule).trim());

    // Récupérer les étudiants existants pour ne pas écraser leurs champs à NULL
    const { data: existingEtudiants } = await admin
      .from("etudiants")
      .select("id, matricule, user_id, date_naissance, lieu_naissance, sexe, etablissement, classe_id")
      .in("matricule", matricules);

    const existingMap = new Map((existingEtudiants ?? []).map((e: any) => [e.matricule, e]));

    const studentsToUpsert = validStudents.map((s) => {
      const matricule = String(s.matricule).trim();
      const nom = String(s.nom).trim();
      const prenom = String(s.prenom).trim();
      const ex = existingMap.get(matricule);
      
      let classe_id = defaultClasseId;
      if (s.classeKey && classeByCode.has(s.classeKey)) {
        classe_id = classeByCode.get(s.classeKey);
      }
      
      return {
        ...(ex && { id: ex.id }), // Indique l'ID pour forcer l'upsert correct
        matricule,
        nom,
        prenom,
        date_naissance: s.dateNaissance || ex?.date_naissance || null,
        lieu_naissance: s.lieuNaissance || ex?.lieu_naissance || null,
        sexe: s.sexe || ex?.sexe || null,
        etablissement: s.etablissement || ex?.etablissement || null,
        classe_id: classe_id || ex?.classe_id || null
      };
    });

    // 3) Bulk Upsert Étudiants
    const { data: upsertedEtudiants, error: etudErr } = await admin
      .from("etudiants")
      .upsert(studentsToUpsert, { onConflict: "matricule" })
      .select("id, matricule, user_id");

    if (etudErr) {
      throw new Error(`Erreur lors de l'insertion des étudiants: ${etudErr.message}`);
    }

    const etudiantIdMap = new Map((upsertedEtudiants ?? []).map((e: any) => [e.matricule, e.id]));
    const userIdMap = new Map((upsertedEtudiants ?? []).map((e: any) => [e.matricule, e.user_id]));

    // 4) Création des comptes Auth manquants (séquentiel pour éviter les limites de rate-limit Auth)
    for (const s of validStudents) {
      const matricule = String(s.matricule).trim();
      const etudiantId = etudiantIdMap.get(matricule);
      if (!etudiantId) continue;
      
      let userId = userIdMap.get(matricule);
      if (!userId) {
        const nom = String(s.nom).trim();
        const prenom = String(s.prenom).trim();
        const email = `${slug(prenom)}.${slug(nom)}@inptic.ga`;

        const { data: created, error: cErr } = await admin.auth.admin.createUser({
          email,
          password: matricule,
          email_confirm: true,
          user_metadata: { nom, prenom, matricule, role: "etudiant" },
        });

        if (cErr) {
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
          await admin.from("etudiants").update({ user_id: userId }).eq("id", etudiantId);
          userIdMap.set(matricule, userId); // Update local cache
        }
      }
    }

    // 5) Bulk Upsert Notes
    const evaluationsToUpsert: any[] = [];
    
    for (const s of validStudents) {
      const matricule = String(s.matricule).trim();
      const etudiantId = etudiantIdMap.get(matricule);
      if (!etudiantId) continue;

      const allGrades = [];
      for (const [code, note] of Object.entries(s.s5 ?? {})) {
        if (typeof note === "number" && !isNaN(note)) allGrades.push({ code, note });
      }
      for (const [code, note] of Object.entries(s.s6 ?? {})) {
        if (typeof note === "number" && !isNaN(note)) allGrades.push({ code, note });
      }

      for (const g of allGrades) {
        let matId = matiereByCode.get(g.code);
        if (!matId) {
          // Création de la matière manquante à la volée
          const classe_id = defaultClasseId || (s.classeKey ? classeByCode.get(s.classeKey) : null);
          if (classe_id) {
            const { data: newMat, error: errNewMat } = await admin
              .from("matieres")
              .insert({ code: g.code, libelle: g.code, coef: 1, credits: 1, classe_id })
              .select("id")
              .single();
            if (!errNewMat && newMat) {
              matiereByCode.set(g.code, newMat.id);
              matId = newMat.id;
            } else {
              errors.push(`${matricule}/${g.code} : impossible de créer la matière`);
              continue;
            }
          } else {
            errors.push(`${matricule}/${g.code} : matière inconnue`);
            continue;
          }
        }
        
        const noteClamped = Math.max(0, Math.min(20, Number(g.note)));
        evaluationsToUpsert.push({
          etudiant_id: etudiantId,
          matiere_id: matId,
          type: "examen",
          note: noteClamped,
        });
      }
    }

    if (evaluationsToUpsert.length > 0) {
      const { error: evalErr } = await admin
        .from("evaluations")
        .upsert(evaluationsToUpsert, { onConflict: "etudiant_id,matiere_id,type" });
      if (evalErr) {
        throw new Error(`Erreur lors de l'insertion des notes: ${evalErr.message}`);
      }
      createdEvaluations = evaluationsToUpsert.length;
    }

    return new Response(
      JSON.stringify({
        ok: true,
        createdAccounts,
        createdStudents: existingEtudiants?.length === 0 ? studentsToUpsert.length : 0, // Approx
        updatedStudents: studentsToUpsert.length,
        createdEvaluations,
        errors: errors.slice(0, 50),
        totalErrors: errors.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || String(e), stack: e?.stack }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
