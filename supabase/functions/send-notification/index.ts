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
  studentTimezoneView?: string; // The timezone the student was viewing when they booked (PST or EST)
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
    const payload: NotificationPayload = await req.json();
    console.log("Received notification request:", payload);

    let smsMessage = "";

    switch (payload.type) {
      case "new_message":
        smsMessage = `BrightMinds: New message from ${payload.senderName || "a user"}. Log in to view and reply.`;
        break;

      case "session_booked":
        const tzInfo = payload.studentTimezoneView ? ` (student viewed in ${payload.studentTimezoneView})` : "";
        smsMessage = `BrightMinds: New ${payload.subject || "tutoring"} session booked with ${payload.senderName || "a user"} for ${payload.sessionDate || "TBD"}${tzInfo}.`;
        break;

      case "session_updated":
        smsMessage = `BrightMinds: Your ${payload.subject || "tutoring"} session has been updated. New date: ${payload.sessionDate || "TBD"}.`;
        break;

      case "session_cancelled":
        smsMessage = `BrightMinds: Your ${payload.subject || "tutoring"} session scheduled for ${payload.sessionDate || "N/A"} has been cancelled.`;
        break;

      case "profile_viewed":
        smsMessage = `BrightMinds: ${payload.senderName || "A student"} viewed your tutor profile. Log in to see more.`;
        break;

      case "class_joined":
        smsMessage = `BrightMinds: ${payload.senderName || "A student"} joined your class! Log in to schedule a session.`;
        break;

      case "meeting_link_sent":
        smsMessage = `BrightMinds: Meeting link ready for your ${payload.subject || "tutoring"} session on ${payload.sessionDate || "TBD"}. Log in to join.`;
        break;

      default:
        console.error("Unknown notification type:", payload.type);
        return new Response(JSON.stringify({ error: "Unknown notification type" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    // Send SMS if phone number is provided
    let smsResult: { success: boolean; error?: string } = { success: false, error: "No phone provided" };
    if (payload.recipientPhone && smsMessage) {
      smsResult = await sendSMS(payload.recipientPhone, smsMessage);
      console.log("SMS result:", smsResult);
    } else {
      console.log("No phone number provided for recipient, skipping SMS");
    }

    return new Response(JSON.stringify({ success: true, smsResult }), {
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
