import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Vérifier que l'appelant est authentifié
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

    // Vérifier que l'appelant est admin ou secretariat
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

    const body = await req.json();
    const matricule = String(body.matricule || "").trim();

    if (!matricule) {
      return new Response(JSON.stringify({ error: "Matricule manquant" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Récupérer l'étudiant pour avoir son user_id et son id
    const { data: etudiant, error: etudErr } = await admin
      .from("etudiants")
      .select("id, user_id")
      .eq("matricule", matricule)
      .single();

    if (etudErr || !etudiant) {
      return new Response(JSON.stringify({ error: "Étudiant introuvable" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const etudiantId = etudiant.id;
    const authUserId = etudiant.user_id;

    // 2. Supprimer les évaluations de cet étudiant (pour éviter les erreurs de foreign key si CASCADE n'est pas actif)
    await admin.from("evaluations").delete().eq("etudiant_id", etudiantId);

    // 3. Supprimer l'étudiant de la table etudiants
    const { error: delEtudErr } = await admin.from("etudiants").delete().eq("id", etudiantId);
    
    if (delEtudErr) {
      throw new Error(`Erreur lors de la suppression de l'étudiant: ${delEtudErr.message}`);
    }

    // 4. Supprimer le compte Auth associé s'il existe
    if (authUserId) {
      const { error: delAuthErr } = await admin.auth.admin.deleteUser(authUserId);
      if (delAuthErr) {
        console.warn(`Impossible de supprimer le compte Auth ${authUserId}:`, delAuthErr.message);
        // On continue même si la suppression du compte a échoué (peut-être déjà supprimé ou droits manquants)
      }
    }

    return new Response(JSON.stringify({ success: true, matricule }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Erreur fonction delete-student:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erreur interne" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
