import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
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

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Check if customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing Stripe customer", { customerId });
    }

    // Create a checkout session with verified pricing from database
    const stripeSession = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Tutoring Session: ${subject}`,
              description: `${duration} minute session with ${tutorName}`,
            },
            unit_amount: Math.round(amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/sessions?payment=success&session_id=${sessionId}`,
      cancel_url: `${req.headers.get("origin")}/sessions?payment=cancelled`,
      metadata: {
        session_id: sessionId,
        user_id: user.id,
      },
    });

    logStep("Checkout session created", { checkoutSessionId: stripeSession.id });

    return new Response(JSON.stringify({ url: stripeSession.url }), {
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
