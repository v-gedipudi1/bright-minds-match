import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Phone, X } from "lucide-react";
import { toast } from "sonner";

export function PhoneNumberPrompt() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    const checkPhoneNumber = async () => {
      if (!user || hasChecked) return;

      try {
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("phone_number, phone_notification_dismissed")
          .eq("user_id", user.id)
          .single();

        if (error) {
          console.error("Error checking phone number:", error);
          return;
        }

        // Show prompt if no phone number and hasn't dismissed
        if (!profile?.phone_number && !profile?.phone_notification_dismissed) {
          setIsOpen(true);
        }
        
        setHasChecked(true);
      } catch (error) {
        console.error("Error:", error);
      }
    };

    checkPhoneNumber();
  }, [user, hasChecked]);

  const handleSubmit = async () => {
    if (!user || !phoneNumber.trim()) {
      toast.error("Please enter a valid phone number");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ 
          phone_number: phoneNumber.trim(),
          phone_notification_dismissed: true 
        })
        .eq("user_id", user.id);

      if (error) throw error;

      toast.success("Phone number saved! You'll now receive SMS notifications.");
      setIsOpen(false);
    } catch (error) {
      console.error("Error saving phone number:", error);
      toast.error("Failed to save phone number. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = async () => {
    if (!user) return;

    try {
      await supabase
        .from("profiles")
        .update({ phone_notification_dismissed: true })
        .eq("user_id", user.id);
    } catch (error) {
      console.error("Error dismissing prompt:", error);
    }
    
    setIsOpen(false);
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleDismiss()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Phone className="w-5 h-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Add Your Phone Number</DialogTitle>
              <DialogDescription className="mt-1">
                Get instant SMS notifications for messages and session updates
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+1 (555) 123-4567"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Include your country code for international numbers
            </p>
          </div>

          <div className="bg-muted/50 p-3 rounded-lg text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-1">You'll receive SMS for:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>New messages from students/tutors</li>
              <li>Session bookings and updates</li>
              <li>Class enrollments</li>
              <li>Meeting link notifications</li>
            </ul>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="ghost"
            onClick={handleDismiss}
            disabled={isLoading}
          >
            Maybe Later
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading || !phoneNumber.trim()}
          >
            {isLoading ? "Saving..." : "Save Phone Number"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
