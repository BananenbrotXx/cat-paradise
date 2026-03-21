import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  // Verify caller is admin
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

  const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
  const { data: { user }, error: authError } = await anonClient.auth.getUser(authHeader.replace("Bearer ", ""));
  if (authError || !user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

  const adminClient = createClient(supabaseUrl, serviceKey);

  // Check if caller is admin
  const { data: roleData } = await adminClient.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
  if (!roleData) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders });

  const { action, ...params } = await req.json();

  // LOOKUP EMAIL by display_name
  if (action === "lookup_email") {
    const { display_name } = params;
    const { data: profile } = await adminClient.from("profiles").select("user_id, display_name").eq("display_name", display_name).maybeSingle();
    if (!profile) return new Response(JSON.stringify({ error: "User not found" }), { status: 404, headers: corsHeaders });
    
    const { data: { user: targetUser } } = await adminClient.auth.admin.getUserById(profile.user_id);
    return new Response(JSON.stringify({ email: targetUser?.email, display_name: profile.display_name, user_id: profile.user_id }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  // BAN user by display_name
  if (action === "ban_user") {
    const { display_name } = params;
    const { data: profile } = await adminClient.from("profiles").select("user_id").eq("display_name", display_name).maybeSingle();
    if (!profile) return new Response(JSON.stringify({ error: "User not found" }), { status: 404, headers: corsHeaders });

    // Don't allow banning yourself
    if (profile.user_id === user.id) return new Response(JSON.stringify({ error: "Cannot ban yourself" }), { status: 400, headers: corsHeaders });

    await adminClient.from("banned_users").upsert({ user_id: profile.user_id, banned_by: user.id }, { onConflict: "user_id" });
    // Disable the user in auth
    await adminClient.auth.admin.updateUserById(profile.user_id, { ban_duration: "876000h" });
    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  // UNBAN user by display_name
  if (action === "unban_user") {
    const { display_name } = params;
    const { data: profile } = await adminClient.from("profiles").select("user_id").eq("display_name", display_name).maybeSingle();
    if (!profile) return new Response(JSON.stringify({ error: "User not found" }), { status: 404, headers: corsHeaders });

    await adminClient.from("banned_users").delete().eq("user_id", profile.user_id);
    await adminClient.auth.admin.updateUserById(profile.user_id, { ban_duration: "none" });
    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  // LIST BANNED
  if (action === "list_banned") {
    const { data } = await adminClient.from("banned_users").select("user_id, created_at");
    const results = [];
    for (const b of data || []) {
      const { data: p } = await adminClient.from("profiles").select("display_name").eq("user_id", b.user_id).maybeSingle();
      results.push({ user_id: b.user_id, display_name: p?.display_name || "Unknown", banned_at: b.created_at });
    }
    return new Response(JSON.stringify(results), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400, headers: corsHeaders });
});
