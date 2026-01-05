import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-SESSION-PAYMENT] ${step}${detailsStr}`);
};

// Input validation schema (manual validation for Deno edge function)
const validateSessionId = (sessionId: unknown): string => {
  if (typeof sessionId !== 'string') {
    throw new Error('sessionId must be a string');
  }
  // UUID v4 format validation
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(sessionId)) {
    throw new Error('sessionId must be a valid UUID');
  }
  return sessionId;
};

// Get PayPal access token
const getPayPalAccessToken = async (): Promise<string> => {
  const clientId = Deno.env.get("PAYPAL_CLIENT_ID");
  const clientSecret = Deno.env.get("PAYPAL_SECRET");
  
  if (!clientId || !clientSecret) {
    throw new Error("PayPal credentials not configured");
  }

  const auth = btoa(`${clientId}:${clientSecret}`);
  
  // Use sandbox for testing, change to api.paypal.com for production
  const response = await fetch("https://api-m.sandbox.paypal.com/v1/oauth2/token", {
    method: "POST",
    headers: {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    const error = await response.text();
    logStep("PayPal auth failed", { error });
    throw new Error("Failed to authenticate with PayPal");
  }

  const data = await response.json();
  return data.access_token;
};

// Create PayPal order
const createPayPalOrder = async (
  accessToken: string,
  amount: number,
  sessionId: string,
  description: string,
  origin: string
): Promise<{ id: string; approvalUrl: string }> => {
  const response = await fetch("https://api-m.sandbox.paypal.com/v2/checkout/orders", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: sessionId,
          description: description,
          amount: {
            currency_code: "USD",
            value: amount.toFixed(2),
          },
        },
      ],
      application_context: {
        return_url: `${origin}/sessions?payment=success&session_id=${sessionId}`,
        cancel_url: `${origin}/sessions?payment=cancelled`,
        brand_name: "BrightMinds Tutoring",
        user_action: "PAY_NOW",
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    logStep("PayPal order creation failed", { error });
    throw new Error("Failed to create PayPal order");
  }

  const order = await response.json();
  const approvalLink = order.links.find((link: any) => link.rel === "approve");
  
  if (!approvalLink) {
    throw new Error("No approval URL in PayPal response");
  }

  return { id: order.id, approvalUrl: approvalLink.href };
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Use service role key to bypass RLS for session verification
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  // Use anon key for auth verification
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
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Parse and validate input - only accept sessionId from client
    let requestBody;
    try {
      requestBody = await req.json();
    } catch {
      throw new Error("Invalid JSON body");
    }

    const sessionId = validateSessionId(requestBody.sessionId);
    logStep("Input validated", { sessionId });

    // SECURITY: Fetch session from database and verify ownership
    const { data: session, error: sessionError } = await supabaseClient
      .from('sessions')
      .select('id, student_id, tutor_id, price, subject, duration_minutes, status')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      logStep("Session not found", { sessionId, error: sessionError?.message });
      throw new Error("Session not found");
    }

    // SECURITY: Verify the authenticated user is the student for this session
    if (session.student_id !== user.id) {
      logStep("Unauthorized access attempt", { userId: user.id, sessionStudentId: session.student_id });
      throw new Error("Unauthorized: You can only pay for your own sessions");
    }

    // SECURITY: Verify session status is appropriate for payment
    if (session.status !== 'awaiting_payment' && session.status !== 'confirmed') {
      logStep("Invalid session status for payment", { status: session.status });
      throw new Error(`Session is not available for payment. Current status: ${session.status}`);
    }

    // SECURITY: Use database values, not client-provided values
    const amount = session.price;
    const duration = session.duration_minutes;
    const subject = session.subject;

    if (!amount || amount <= 0) {
      throw new Error("Session does not have a valid price set");
    }

    // Get tutor name from profiles table (don't trust client)
    const { data: tutorProfile } = await supabaseClient
      .from('profiles')
      .select('full_name')
      .eq('user_id', session.tutor_id)
      .single();

    const tutorName = tutorProfile?.full_name || 'Tutor';

    logStep("Session verified", { 
      sessionId, 
      amount, 
      subject, 
      duration,
      tutorName,
      status: session.status 
    });

    // Get PayPal access token
    const accessToken = await getPayPalAccessToken();
    logStep("PayPal access token obtained");

    // Create PayPal order
    const origin = req.headers.get("origin") || "http://localhost:5173";
    const description = `${duration} minute ${subject} session with ${tutorName}`;
    const { id: orderId, approvalUrl } = await createPayPalOrder(
      accessToken,
      amount,
      sessionId,
      description,
      origin
    );

    logStep("PayPal order created", { orderId });

    return new Response(JSON.stringify({ url: approvalUrl, orderId }), {
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
