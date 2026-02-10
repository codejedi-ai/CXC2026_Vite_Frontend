import { createClient } from "npm:@supabase/supabase-js@2.95.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ProfileData {
  user_id: string;
  display_name: string;
  age: number;
  gender: string;
  bio: string;
  avatar_url: string;
  banner_url: string;
  location: string;
  looking_for: string;
  interests: string[];
  type: string;
  online_status: boolean;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const url = new URL(req.url);
    const path = url.pathname.split("/").pop();

    if (req.method === "GET") {
      const userId = url.searchParams.get("user_id") || user.id;
      
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      return new Response(
        JSON.stringify({ data }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (req.method === "POST" || req.method === "PUT") {
      const body: ProfileData = await req.json();

      if (body.user_id !== user.id) {
        return new Response(
          JSON.stringify({ error: "Cannot modify another user's profile" }),
          {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();

      let result;
      if (existingProfile) {
        result = await supabase
          .from("profiles")
          .update({
            display_name: body.display_name,
            age: body.age,
            gender: body.gender,
            bio: body.bio,
            avatar_url: body.avatar_url,
            banner_url: body.banner_url,
            location: body.location,
            looking_for: body.looking_for,
            interests: body.interests,
            online_status: body.online_status,
          })
          .eq("user_id", user.id)
          .select()
          .single();
      } else {
        result = await supabase
          .from("profiles")
          .insert({
            user_id: body.user_id,
            display_name: body.display_name,
            age: body.age,
            gender: body.gender,
            bio: body.bio,
            avatar_url: body.avatar_url,
            banner_url: body.banner_url,
            location: body.location,
            looking_for: body.looking_for,
            interests: body.interests,
            type: body.type || "human",
            online_status: body.online_status,
          })
          .select()
          .single();
      }

      if (result.error) {
        return new Response(
          JSON.stringify({ error: result.error.message }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      return new Response(
        JSON.stringify({ data: result.data }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
