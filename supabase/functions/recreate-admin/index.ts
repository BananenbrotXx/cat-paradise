import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const adminClient = createClient(supabaseUrl, serviceKey);

  const oldUserId = "43a7d4cd-35b0-4c15-ad65-7f73ed2e1dad";

  // Clean up old user data
  await adminClient.from("user_roles").delete().eq("user_id", oldUserId);
  await adminClient.from("leaderboard").delete().eq("user_id", oldUserId);
  await adminClient.from("profiles").delete().eq("user_id", oldUserId);
  await adminClient.auth.admin.deleteUser(oldUserId);

  // Create new user
  const { data: newUser, error: createErr } = await adminClient.auth.admin.createUser({
    email: "bananenbrot@catparadis.app",
    password: "derkleinejunge1!",
    email_confirm: true,
    user_metadata: { display_name: "Bananenbrot" },
  });

  if (createErr) return new Response(JSON.stringify({ error: createErr.message }), { status: 400, headers: corsHeaders });

  const userId = newUser.user.id;

  // Create profile
  await adminClient.from("profiles").insert({ user_id: userId, display_name: "Bananenbrot" });
  
  // Assign admin role
  await adminClient.from("user_roles").insert({ user_id: userId, role: "admin" });

  return new Response(JSON.stringify({ success: true, user_id: userId }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
