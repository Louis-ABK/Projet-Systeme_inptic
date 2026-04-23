// Edge function : crée le compte admin par défaut (admin@inptic.ga / admin2026)
// si aucun admin n'existe. Idempotente.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ADMIN_EMAIL = "admin@inptic.ga";
const ADMIN_PWD = "admin2026";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Existe-t-il déjà un admin ?
    const { data: existing } = await admin
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin")
      .limit(1);
    if (existing && existing.length > 0) {
      return new Response(
        JSON.stringify({ ok: true, message: "Admin déjà présent" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Créer le compte
    let userId: string | null = null;
    const { data: created, error } = await admin.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PWD,
      email_confirm: true,
      user_metadata: { role: "admin", nom: "Administration", prenom: "INPTIC" },
    });
    if (created?.user) userId = created.user.id;
    else {
      // user existant ? on le retrouve
      const { data: page } = await admin.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      });
      const found = page.users.find(
        (u: any) => (u.email || "").toLowerCase() === ADMIN_EMAIL
      );
      if (found) userId = found.id;
      else {
        return new Response(
          JSON.stringify({ error: error?.message || "Création impossible" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // Promouvoir admin
    await admin
      .from("user_roles")
      .upsert({ user_id: userId!, role: "admin" }, { onConflict: "user_id,role" });

    return new Response(
      JSON.stringify({
        ok: true,
        message: "Admin créé",
        email: ADMIN_EMAIL,
        password: ADMIN_PWD,
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
