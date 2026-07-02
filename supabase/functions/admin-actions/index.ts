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

  // GIVE COINS to user by display_name
  if (action === "give_coins") {
    const { display_name, amount } = params;
    const coinAmount = parseInt(amount, 10);
    if (!display_name || isNaN(coinAmount) || coinAmount === 0) {
      return new Response(JSON.stringify({ error: "Invalid display_name or amount" }), { status: 400, headers: corsHeaders });
    }
    const { data: profile } = await adminClient.from("profiles").select("user_id").eq("display_name", display_name).maybeSingle();
    if (!profile) return new Response(JSON.stringify({ error: "User not found" }), { status: 404, headers: corsHeaders });

    // Get current coins from game_saves
    const { data: save } = await adminClient.from("game_saves").select("coins").eq("user_id", profile.user_id).maybeSingle();
    if (!save) return new Response(JSON.stringify({ error: "No game save found for user" }), { status: 404, headers: corsHeaders });

    const newCoins = save.coins + coinAmount;
    await adminClient.from("game_saves").update({ coins: newCoins }).eq("user_id", profile.user_id);
    // Also update leaderboard
    await adminClient.from("leaderboard").update({ coins: newCoins }).eq("user_id", profile.user_id);
    return new Response(JSON.stringify({ success: true, new_coins: newCoins }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  // RENAME user
  if (action === "rename_user") {
    const { display_name, new_name } = params;
    const cleaned = (new_name || "").trim();
    if (!cleaned || cleaned.length < 2 || cleaned.length > 24) {
      return new Response(JSON.stringify({ error: "Name muss 2-24 Zeichen lang sein" }), { status: 400, headers: corsHeaders });
    }
    const { data: profile } = await adminClient.from("profiles").select("user_id").eq("display_name", display_name).maybeSingle();
    if (!profile) return new Response(JSON.stringify({ error: "User not found" }), { status: 404, headers: corsHeaders });

    // Check name not already taken
    const { data: existing } = await adminClient.from("profiles").select("user_id").eq("display_name", cleaned).maybeSingle();
    if (existing && existing.user_id !== profile.user_id) {
      return new Response(JSON.stringify({ error: "Name bereits vergeben" }), { status: 400, headers: corsHeaders });
    }

    await adminClient.from("profiles").update({ display_name: cleaned }).eq("user_id", profile.user_id);
    await adminClient.from("leaderboard").update({ display_name: cleaned }).eq("user_id", profile.user_id);
    await adminClient.auth.admin.updateUserById(profile.user_id, { user_metadata: { display_name: cleaned } });
    return new Response(JSON.stringify({ success: true, new_name: cleaned }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  // SET new password for user
  if (action === "set_password") {
    const { display_name, new_password } = params;
    if (!new_password || new_password.length < 6) {
      return new Response(JSON.stringify({ error: "Passwort muss mind. 6 Zeichen lang sein" }), { status: 400, headers: corsHeaders });
    }
    const { data: profile } = await adminClient.from("profiles").select("user_id").eq("display_name", display_name).maybeSingle();
    if (!profile) return new Response(JSON.stringify({ error: "User not found" }), { status: 404, headers: corsHeaders });

    const { error } = await adminClient.auth.admin.updateUserById(profile.user_id, { password: new_password });
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: corsHeaders });
    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  // LIST BROADCASTS with claim status per player
  if (action === "list_broadcasts") {
    const { data: broadcasts } = await adminClient
      .from("broadcasts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    const { data: profiles } = await adminClient.from("profiles").select("user_id, display_name");
    const totalPlayers = profiles?.length || 0;

    const results = [];
    for (const b of broadcasts || []) {
      const { data: claims } = await adminClient
        .from("broadcast_claims")
        .select("user_id, claimed_at")
        .eq("broadcast_id", b.id);
      const claimedIds = new Set((claims || []).map((c: any) => c.user_id));
      const players = (profiles || []).map((p: any) => ({
        display_name: p.display_name,
        claimed: claimedIds.has(p.user_id),
        claimed_at: (claims || []).find((c: any) => c.user_id === p.user_id)?.claimed_at || null,
      }));
      results.push({
        id: b.id,
        created_at: b.created_at,
        reward_type: b.reward_type,
        amount: b.amount,
        message: b.message,
        claimed_count: claimedIds.size,
        total_players: totalPlayers,
        players,
      });
    }
    return new Response(JSON.stringify(results), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400, headers: corsHeaders });
});
