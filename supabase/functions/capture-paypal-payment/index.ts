import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CAPTURE-PAYPAL-PAYMENT] ${step}${detailsStr}`);
};

// Get PayPal access token
const getPayPalAccessToken = async (): Promise<string> => {
  const clientId = Deno.env.get("PAYPAL_CLIENT_ID");
  const clientSecret = Deno.env.get("PAYPAL_SECRET");
  
  if (!clientId || !clientSecret) {
    throw new Error("PayPal credentials not configured");
  }

  const auth = btoa(`${clientId}:${clientSecret}`);
  
  const response = await fetch("https://api-m.sandbox.paypal.com/v1/oauth2/token", {
    method: "POST",
    headers: {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    throw new Error("Failed to authenticate with PayPal");
  }

  const data = await response.json();
  return data.access_token;
};

// Capture PayPal order
const capturePayPalOrder = async (accessToken: string, orderId: string): Promise<any> => {
  const response = await fetch(`https://api-m.sandbox.paypal.com/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.text();
    logStep("PayPal capture failed", { error });
    throw new Error("Failed to capture PayPal payment");
  }

  return await response.json();
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  const supabaseAuth = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    logStep("Function started");

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header provided");
    }
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseAuth.auth.getUser(token);
    const user = data.user;
    if (!user) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    // Parse request
    const { orderId, sessionId } = await req.json();
    if (!orderId || !sessionId) {
      throw new Error("Missing orderId or sessionId");
    }
    logStep("Input received", { orderId, sessionId });

    // Verify session belongs to user
    const { data: session, error: sessionError } = await supabaseClient
      .from('sessions')
      .select('id, student_id, status')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      throw new Error("Session not found");
    }

    if (session.student_id !== user.id) {
      throw new Error("Unauthorized");
    }

    // Get PayPal access token and capture payment
    const accessToken = await getPayPalAccessToken();
    logStep("PayPal access token obtained");

    const captureResult = await capturePayPalOrder(accessToken, orderId);
    logStep("Payment captured", { status: captureResult.status });

    if (captureResult.status === "COMPLETED") {
      // Update session status to confirmed
      const { error: updateError } = await supabaseClient
        .from('sessions')
        .update({ status: 'confirmed' })
        .eq('id', sessionId);

      if (updateError) {
        logStep("Failed to update session status", { error: updateError.message });
        throw new Error("Payment captured but failed to update session");
      }

      logStep("Session status updated to confirmed");
    }

    return new Response(JSON.stringify({ 
      success: true, 
      status: captureResult.status,
      captureId: captureResult.id 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
