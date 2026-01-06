import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Lock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const TUTOR_ACCESS_CODE = "7904";

const CTASection = () => {
  const [tutorDialogOpen, setTutorDialogOpen] = useState(false);
  const [tutorPassword, setTutorPassword] = useState("");
  const navigate = useNavigate();

  const handleTutorPortalSubmit = () => {
    if (tutorPassword === TUTOR_ACCESS_CODE) {
      setTutorDialogOpen(false);
      setTutorPassword("");
      navigate("/auth?role=tutor");
    } else {
      toast.error("Incorrect password. Please try again.");
    }
  };

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 gradient-secondary" />
      <div className="absolute top-0 left-0 w-full h-full opacity-10">
        <div className="absolute top-20 left-20 w-40 h-40 rounded-full bg-primary blur-3xl" />
        <div className="absolute bottom-20 right-20 w-60 h-60 rounded-full bg-accent blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary-foreground/10 border border-secondary-foreground/20 mb-8">
            <Sparkles className="w-4 h-4 text-secondary-foreground" />
            <span className="text-sm font-medium text-secondary-foreground">Start Today</span>
          </div>

          <h2 className="font-display text-3xl md:text-5xl font-bold text-secondary-foreground mb-6">
            Ready to Transform Your Learning Journey?
          </h2>

          <p className="text-lg text-secondary-foreground/80 mb-10 max-w-xl mx-auto">
            Join thousands of students who've found their perfect tutor match. 
            Your first session consultation is free, no strings attached.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth">
              <Button
                variant="hero"
                size="xl"
                className="shadow-glow"
              >
                Find My Tutor Now
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Button
              variant="outline"
              size="xl"
              className="border-secondary-foreground/30 text-secondary-foreground hover:bg-secondary-foreground/10 hover:text-secondary-foreground gap-2"
              onClick={() => setTutorDialogOpen(true)}
            >
              <Lock className="w-5 h-5" />
              Become a Tutor
            </Button>
          </div>

          {/* Trust Badges */}
          <div className="flex flex-wrap justify-center gap-6 mt-12 text-secondary-foreground/60 text-sm">
            <span>✓ Free first consultation</span>
            <span>✓ 100% satisfaction guarantee</span>
            <span>✓ Cancel anytime</span>
          </div>
        </div>
      </div>

      {/* Tutor Portal Password Dialog */}
      <Dialog open={tutorDialogOpen} onOpenChange={setTutorDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tutor Access Required</DialogTitle>
            <DialogDescription>
              Please enter the tutor access code to continue.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <Input
              type="password"
              placeholder="Enter access code"
              value={tutorPassword}
              onChange={(e) => setTutorPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleTutorPortalSubmit();
                }
              }}
            />
            <Button onClick={handleTutorPortalSubmit}>
              Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default CTASection;
