import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CreditCard, CheckCircle, AlertCircle, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface StripeConnectStatus {
  hasAccount: boolean;
  onboardingComplete: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted?: boolean;
}

const StripeConnectSection = () => {
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [status, setStatus] = useState<StripeConnectStatus | null>(null);

  const checkStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase.functions.invoke('check-connect-status', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      setStatus(data);
    } catch (error) {
      console.error('Error checking Stripe status:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();

    // Check for return from Stripe onboarding
    const urlParams = new URLSearchParams(window.location.search);
    const stripeParam = urlParams.get('stripe');
    if (stripeParam === 'success') {
      toast.success('Stripe account setup updated!');
      // Remove the query parameter
      window.history.replaceState({}, '', window.location.pathname);
      // Refresh status
      checkStatus();
    } else if (stripeParam === 'refresh') {
      toast.info('Please complete your Stripe onboarding');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please log in to connect your Stripe account');
        return;
      }

      const { data, error } = await supabase.functions.invoke('create-connect-account', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error creating Stripe account:', error);
      toast.error('Failed to connect Stripe account');
    } finally {
      setConnecting(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Payment Setup
        </CardTitle>
        <CardDescription>
          Connect your bank account to receive payments from students (92% of each payment)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {status?.onboardingComplete ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <div>
                <p className="font-medium text-green-800 dark:text-green-200">
                  Payment account connected
                </p>
                <p className="text-sm text-green-600 dark:text-green-400">
                  You'll receive 92% of each payment directly to your bank account
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Badge variant="secondary" className="gap-1">
                <CheckCircle className="w-3 h-3" />
                Charges enabled
              </Badge>
              <Badge variant="secondary" className="gap-1">
                <CheckCircle className="w-3 h-3" />
                Payouts enabled
              </Badge>
            </div>
            <Button variant="outline" onClick={handleConnect} disabled={connecting}>
              {connecting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <ExternalLink className="w-4 h-4 mr-2" />
              )}
              Update Payment Settings
            </Button>
          </div>
        ) : status?.hasAccount ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <AlertCircle className="w-6 h-6 text-yellow-600" />
              <div>
                <p className="font-medium text-yellow-800 dark:text-yellow-200">
                  Complete your account setup
                </p>
                <p className="text-sm text-yellow-600 dark:text-yellow-400">
                  Finish connecting your bank account to receive payments
                </p>
              </div>
            </div>
            <Button onClick={handleConnect} disabled={connecting}>
              {connecting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <ExternalLink className="w-4 h-4 mr-2" />
              )}
              Complete Setup
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">How it works</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Students pay for sessions through our secure checkout</li>
                <li>• You receive 92% of each payment</li>
                <li>• 8% platform fee covers payment processing and platform costs</li>
                <li>• Funds are deposited directly to your bank account</li>
              </ul>
            </div>
            <Button onClick={handleConnect} disabled={connecting} className="w-full">
              {connecting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <CreditCard className="w-4 h-4 mr-2" />
              )}
              Connect Bank Account
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StripeConnectSection;
