import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationPayload {
  type: "new_message" | "session_booked" | "session_updated" | "session_cancelled";
  recipientEmail: string;
  recipientName: string;
  senderName?: string;
  subject?: string;
  sessionDate?: string;
  messagePreview?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      return new Response(JSON.stringify({ error: "Email service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resend = new Resend(resendApiKey);
    const payload: NotificationPayload = await req.json();
    console.log("Received notification request:", payload);

    let emailSubject = "";
    let emailBody = "";

    switch (payload.type) {
      case "new_message":
        emailSubject = `New message from ${payload.senderName || "a user"} on BrightMinds`;
        emailBody = `
          <h2>You have a new message!</h2>
          <p><strong>${payload.senderName || "Someone"}</strong> sent you a message:</p>
          <blockquote style="background: #f5f5f5; padding: 15px; border-left: 4px solid #3b82f6;">
            ${payload.messagePreview || "Click to view the message"}
          </blockquote>
          <p><a href="https://ai-mentor-finder.lovable.app/messages" style="background: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Messages</a></p>
        `;
        break;

      case "session_booked":
        emailSubject = `New session booked: ${payload.subject || "Tutoring Session"}`;
        emailBody = `
          <h2>New Session Booked!</h2>
          <p>A new tutoring session has been scheduled:</p>
          <ul>
            <li><strong>Subject:</strong> ${payload.subject || "General"}</li>
            <li><strong>Date:</strong> ${payload.sessionDate || "TBD"}</li>
            <li><strong>With:</strong> ${payload.senderName || "Your tutor/student"}</li>
          </ul>
          <p><a href="https://ai-mentor-finder.lovable.app/sessions" style="background: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Sessions</a></p>
        `;
        break;

      case "session_updated":
        emailSubject = `Session updated: ${payload.subject || "Tutoring Session"}`;
        emailBody = `
          <h2>Session Updated</h2>
          <p>Your session has been updated:</p>
          <ul>
            <li><strong>Subject:</strong> ${payload.subject || "General"}</li>
            <li><strong>New Date:</strong> ${payload.sessionDate || "TBD"}</li>
          </ul>
          <p><a href="https://ai-mentor-finder.lovable.app/sessions" style="background: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Sessions</a></p>
        `;
        break;

      case "session_cancelled":
        emailSubject = `Session cancelled: ${payload.subject || "Tutoring Session"}`;
        emailBody = `
          <h2>Session Cancelled</h2>
          <p>A session has been cancelled:</p>
          <ul>
            <li><strong>Subject:</strong> ${payload.subject || "General"}</li>
            <li><strong>Was scheduled for:</strong> ${payload.sessionDate || "N/A"}</li>
          </ul>
          <p><a href="https://ai-mentor-finder.lovable.app/sessions" style="background: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Sessions</a></p>
        `;
        break;

      default:
        console.error("Unknown notification type:", payload.type);
        return new Response(JSON.stringify({ error: "Unknown notification type" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    console.log("Sending email to:", payload.recipientEmail);
    
    const { data, error } = await resend.emails.send({
      from: "BrightMinds <notifications@brightmindsmatch.org>",
      to: payload.recipientEmail,
      subject: emailSubject,
      html: emailBody,
    });

    if (error) {
      console.error("Resend error:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Email sent successfully:", data);
    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
