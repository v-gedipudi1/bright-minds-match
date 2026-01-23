import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Brain, Sparkles, Target, Zap } from "lucide-react";

const AIMatchingCTA = () => {
  return (
    <section className="py-16 bg-gradient-to-br from-accent/5 via-primary/5 to-secondary/5">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl bg-card border border-border shadow-medium p-8 md:p-12">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/10 to-accent/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-secondary/10 to-primary/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
            
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
              {/* Icon */}
              <div className="shrink-0">
                <div className="w-24 h-24 rounded-2xl gradient-primary flex items-center justify-center shadow-glow animate-pulse-soft">
                  <Brain className="w-12 h-12 text-primary-foreground" />
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 text-center md:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 mb-4">
                  <Sparkles className="w-4 h-4 text-accent" />
                  <span className="text-sm font-semibold text-accent">AI-Powered</span>
                </div>
                
                <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-3">
                  Let AI Find Your Perfect Tutor Match
                </h2>
                
                <p className="text-muted-foreground mb-6 max-w-xl">
                  Answer a few questions about your learning style, goals, and preferences. 
                  Our AI will analyze and match you with tutors who fit your needs perfectly.
                </p>

                {/* Features */}
                <div className="flex flex-wrap gap-4 mb-6 justify-center md:justify-start">
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    <Target className="w-4 h-4 text-primary" />
                    <span>Personalized Matches</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    <Zap className="w-4 h-4 text-accent" />
                    <span>Instant Results</span>
                  </div>
                </div>

                <Link to="/auth">
                  <Button variant="hero" size="lg" className="group">
                    <Brain className="w-5 h-5 mr-2 group-hover:animate-pulse" />
                    Start AI Matching
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AIMatchingCTA;
