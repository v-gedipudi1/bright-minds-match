import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CONNECT-ACCOUNT] ${step}${detailsStr}`);
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
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Check if user is a tutor
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('role, full_name')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      throw new Error("Profile not found");
    }

    if (profile.role !== 'tutor') {
      throw new Error("Only tutors can create Stripe Connect accounts");
    }

    // Check if tutor already has a Stripe account
    const { data: tutorProfile, error: tutorError } = await supabaseClient
      .from('tutor_profiles')
      .select('stripe_account_id, stripe_onboarding_complete')
      .eq('user_id', user.id)
      .single();

    if (tutorError) {
      throw new Error("Tutor profile not found");
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    let accountId = tutorProfile.stripe_account_id;
    let isNewAccount = false;

    // If no account exists, create one
    if (!accountId) {
      logStep("Creating new Stripe Connect account");
      isNewAccount = true;
      
      const account = await stripe.accounts.create({
        type: 'express',
        email: user.email,
        metadata: {
          user_id: user.id,
        },
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_profile: {
          name: profile.full_name || 'Tutor',
          product_description: 'Online tutoring services',
        },
      });

      accountId = account.id;
      logStep("Stripe Connect account created", { accountId });

      // Save account ID to database
      const { error: updateError } = await supabaseClient
        .from('tutor_profiles')
        .update({ stripe_account_id: accountId })
        .eq('user_id', user.id);

      if (updateError) {
        throw new Error("Failed to save Stripe account ID");
      }
    } else {
      logStep("Existing Stripe Connect account found", { accountId });
      
      // Check account status to determine link type
      const account = await stripe.accounts.retrieve(accountId);
      logStep("Account status", { 
        chargesEnabled: account.charges_enabled, 
        detailsSubmitted: account.details_submitted 
      });
    }

    // Create an account link for onboarding
    const origin = req.headers.get("origin") || "http://localhost:5173";
    
    // Use account_onboarding for new/incomplete accounts, account_update for complete ones
    const linkType = tutorProfile.stripe_onboarding_complete ? 'account_update' : 'account_onboarding';
    logStep("Creating account link", { type: linkType, accountId });
    
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${origin}/profile?stripe=refresh`,
      return_url: `${origin}/profile?stripe=success`,
      type: linkType,
      collect: linkType === 'account_onboarding' ? 'eventually_due' : undefined,
    });

    logStep("Account link created successfully", { url: accountLink.url });

    return new Response(JSON.stringify({ 
      url: accountLink.url,
      accountId: accountId 
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
