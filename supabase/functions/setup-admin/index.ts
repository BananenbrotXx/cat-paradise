import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const adminClient = createClient(supabaseUrl, serviceKey);

  // Create the Bananenbrot admin user
  const email = "bananenbrot@catparadis.app";
  const password = "derkleinejunge1!";
  const displayName = "Bananenbrot";

  // Check if already exists
  const { data: existingProfile } = await adminClient
    .from("profiles")
    .select("user_id")
    .eq("display_name", displayName)
    .maybeSingle();

  let userId: string;

  if (existingProfile) {
    userId = existingProfile.user_id;
  } else {
    const { data: newUser, error } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { display_name: displayName },
    });
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: corsHeaders });
    userId = newUser.user.id;
  }

  // Assign admin role
  await adminClient.from("user_roles").upsert(
    { user_id: userId, role: "admin" },
    { onConflict: "user_id,role" }
  );

  // Mark as admin on leaderboard
  await adminClient.from("leaderboard").upsert(
    { user_id: userId, display_name: displayName, is_admin: true, coins: 0, level: 1 },
    { onConflict: "user_id" }
  );

  return new Response(JSON.stringify({ success: true, userId }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
