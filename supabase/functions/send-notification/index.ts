import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationPayload {
  type: "new_message" | "session_booked" | "session_updated" | "session_cancelled" | "profile_viewed" | "class_joined" | "meeting_link_sent";
  recipientEmail: string;
  recipientName: string;
  recipientPhone?: string;
  senderName?: string;
  subject?: string;
  sessionDate?: string;
  messagePreview?: string;
  meetingLink?: string;
}

async function sendSMS(to: string, message: string): Promise<{ success: boolean; error?: string }> {
  const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
  const twilioPhone = Deno.env.get("TWILIO_PHONE_NUMBER");

  if (!accountSid || !authToken || !twilioPhone) {
    console.log("Twilio credentials not configured, skipping SMS");
    return { success: false, error: "SMS not configured" };
  }

  if (!to) {
    console.log("No phone number provided, skipping SMS");
    return { success: false, error: "No phone number" };
  }

  try {
    // Format phone number
    let formattedPhone = to.replace(/[^\d+]/g, "");
    if (!formattedPhone.startsWith("+")) {
      if (formattedPhone.length === 10) {
        formattedPhone = "+1" + formattedPhone;
      } else {
        formattedPhone = "+" + formattedPhone;
      }
    }

    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    
    const response = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        "Authorization": "Basic " + btoa(`${accountSid}:${authToken}`),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: formattedPhone,
        From: twilioPhone,
        Body: message,
      }),
    });

    const responseText = await response.text();
    
    if (!response.ok) {
      console.error("Twilio error:", responseText);
      return { success: false, error: responseText };
    }

    const data = JSON.parse(responseText);
    console.log("SMS sent successfully:", data.sid);
    return { success: true };
  } catch (error) {
    console.error("Error sending SMS:", error);
    return { success: false, error: String(error) };
  }
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
    let smsMessage = "";

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
        smsMessage = `BrightMinds: New message from ${payload.senderName || "a user"}. Log in to view and reply.`;
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
        smsMessage = `BrightMinds: New ${payload.subject || "tutoring"} session booked with ${payload.senderName || "a user"} for ${payload.sessionDate || "TBD"}.`;
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
        smsMessage = `BrightMinds: Your ${payload.subject || "tutoring"} session has been updated. New date: ${payload.sessionDate || "TBD"}.`;
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
        smsMessage = `BrightMinds: Your ${payload.subject || "tutoring"} session scheduled for ${payload.sessionDate || "N/A"} has been cancelled.`;
        break;

      case "profile_viewed":
        emailSubject = `Someone viewed your profile on BrightMinds`;
        emailBody = `
          <h2>Profile View!</h2>
          <p><strong>${payload.senderName || "A student"}</strong> viewed your tutor profile.</p>
          <p>This could be a potential new student interested in your services!</p>
          <p><a href="https://ai-mentor-finder.lovable.app/dashboard" style="background: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Dashboard</a></p>
        `;
        smsMessage = `BrightMinds: ${payload.senderName || "A student"} viewed your tutor profile. Log in to see more.`;
        break;

      case "class_joined":
        emailSubject = `New student joined your class on BrightMinds`;
        emailBody = `
          <h2>New Student!</h2>
          <p><strong>${payload.senderName || "A student"}</strong> has joined your class.</p>
          <p>You can now schedule sessions with them.</p>
          <p><a href="https://ai-mentor-finder.lovable.app/dashboard" style="background: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Students</a></p>
        `;
        smsMessage = `BrightMinds: ${payload.senderName || "A student"} joined your class! Log in to schedule a session.`;
        break;

      case "meeting_link_sent":
        emailSubject = `Meeting link for your session: ${payload.subject || "Tutoring Session"}`;
        emailBody = `
          <h2>Meeting Link Available!</h2>
          <p>Your tutor has sent a meeting link for your upcoming session:</p>
          <ul>
            <li><strong>Subject:</strong> ${payload.subject || "General"}</li>
            <li><strong>Date:</strong> ${payload.sessionDate || "TBD"}</li>
            <li><strong>With:</strong> ${payload.senderName || "Your tutor"}</li>
          </ul>
          ${payload.meetingLink ? `<p><a href="${payload.meetingLink}" style="background: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Join Meeting</a></p>` : ''}
          <p><a href="https://ai-mentor-finder.lovable.app/sessions" style="background: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Sessions</a></p>
        `;
        smsMessage = `BrightMinds: Meeting link ready for your ${payload.subject || "tutoring"} session on ${payload.sessionDate || "TBD"}. Log in to join.`;
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

    // Send SMS if phone number is provided
    let smsResult: { success: boolean; error?: string } = { success: false, error: "No phone provided" };
    if (payload.recipientPhone && smsMessage) {
      smsResult = await sendSMS(payload.recipientPhone, smsMessage);
      console.log("SMS result:", smsResult);
    }

    return new Response(JSON.stringify({ success: true, emailData: data, smsResult }), {
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
