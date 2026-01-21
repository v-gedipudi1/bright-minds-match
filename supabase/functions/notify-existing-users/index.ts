import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!resendApiKey || !supabaseUrl || !supabaseServiceKey) {
      console.error("Missing required environment variables");
      return new Response(
        JSON.stringify({ error: "Service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const resend = new Resend(resendApiKey);

    // Get all users without phone numbers who haven't been notified
    const { data: profiles, error: fetchError } = await supabase
      .from("profiles")
      .select("user_id, full_name, email")
      .is("phone_number", null)
      .eq("phone_notification_dismissed", false);

    if (fetchError) {
      console.error("Error fetching profiles:", fetchError);
      throw fetchError;
    }

    console.log(`Found ${profiles?.length || 0} users to notify`);

    const results = [];
    for (const profile of profiles || []) {
      try {
        const { data, error } = await resend.emails.send({
          from: "BrightMinds <notifications@brightmindsmatch.org>",
          to: profile.email,
          subject: "Add Your Phone Number for SMS Notifications",
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #333;">Hi ${profile.full_name || "there"}! 👋</h2>
              
              <p style="color: #555; line-height: 1.6;">
                We've added SMS notifications to BrightMinds so you never miss an important update!
              </p>
              
              <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0 0 10px 0; font-weight: bold; color: #333;">With SMS notifications, you'll receive texts for:</p>
                <ul style="color: #555; margin: 0; padding-left: 20px;">
                  <li>New messages from students or tutors</li>
                  <li>Session bookings and confirmations</li>
                  <li>Class enrollment updates</li>
                  <li>Meeting links and reminders</li>
                </ul>
              </div>
              
              <p style="color: #555; line-height: 1.6;">
                Simply log in to your account and add your phone number when prompted, or update it in your profile settings.
              </p>
              
              <a href="https://ai-mentor-finder.lovable.app/dashboard" 
                 style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 10px;">
                Log In & Add Phone Number
              </a>
              
              <p style="color: #888; font-size: 14px; margin-top: 30px;">
                Best regards,<br>
                The BrightMinds Team
              </p>
            </div>
          `,
        });

        if (error) {
          console.error(`Error sending to ${profile.email}:`, error);
          results.push({ email: profile.email, success: false, error: error.message });
        } else {
          console.log(`Email sent to ${profile.email}`);
          results.push({ email: profile.email, success: true });
        }
      } catch (err) {
        console.error(`Error sending to ${profile.email}:`, err);
        results.push({ email: profile.email, success: false, error: String(err) });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        totalUsers: profiles?.length || 0,
        results 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
