import { Button } from "@/components/ui/button";
import { Sparkles, Brain, Target, Zap, ArrowRight } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "Learning Style Analysis",
    description: "Our AI understands how you learn best — visual, auditory, or hands-on.",
  },
  {
    icon: Target,
    title: "Goal-Oriented Matching",
    description: "Whether it's exam prep or skill building, we find tutors aligned with your goals.",
  },
  {
    icon: Zap,
    title: "Instant Recommendations",
    description: "Get personalized tutor suggestions in seconds, not hours.",
  },
];

const AIMatchingSection = () => {
  return (
    <section id="ai-matching" className="py-24 relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute inset-0 gradient-hero opacity-50" />
      <div className="absolute top-20 right-0 w-96 h-96 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute bottom-20 left-0 w-80 h-80 rounded-full bg-accent/10 blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
          {/* Left Content */}
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">AI-Powered</span>
            </div>

            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-6">
              Smart Matching for{" "}
              <span className="text-gradient-primary">Personalized Learning</span>
            </h2>

            <p className="text-lg text-muted-foreground mb-8">
              Our proprietary AI analyzes your learning preferences, goals, and schedule 
              to recommend tutors who are the perfect fit. No more guesswork — just 
              meaningful connections that accelerate your progress.
            </p>

            <div className="space-y-6 mb-8">
              {features.map((feature, index) => (
                <div key={index} className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-foreground mb-1">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <Button variant="hero" size="lg">
              Try AI Matching Free
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>

          {/* Right Visual */}
          <div className="relative">
            <div className="bg-card rounded-3xl p-8 shadow-medium border border-border">
              {/* Mock AI Interface */}
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">AI Matching Engine</p>
                    <p className="text-xs text-muted-foreground">Analyzing your profile...</p>
                  </div>
                </div>

                {/* Progress Steps */}
                <div className="space-y-4">
                  {[
                    { label: "Learning style detected", status: "complete" },
                    { label: "Goals analyzed", status: "complete" },
                    { label: "Finding best matches", status: "active" },
                  ].map((step, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          step.status === "complete"
                            ? "bg-green-100 text-green-700"
                            : "gradient-primary text-primary-foreground animate-pulse-soft"
                        }`}
                      >
                        {step.status === "complete" ? "✓" : index + 1}
                      </div>
                      <span
                        className={`text-sm ${
                          step.status === "complete"
                            ? "text-muted-foreground"
                            : "text-foreground font-medium"
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Match Preview */}
                <div className="p-4 rounded-xl bg-muted/50 border border-border">
                  <p className="text-xs text-muted-foreground mb-3">Top Match Found</p>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl gradient-secondary flex items-center justify-center text-secondary-foreground font-bold">
                      SC
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-foreground text-sm">Dr. Sarah Chen</p>
                      <p className="text-xs text-muted-foreground">98% Match Score</p>
                    </div>
                    <div className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                      Best Match
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Cards */}
            <div className="absolute -top-4 -right-4 px-4 py-2 rounded-xl bg-card shadow-medium border border-border animate-float">
              <p className="text-sm font-medium text-foreground">🎯 98% Match</p>
            </div>
            <div className="absolute -bottom-4 -left-4 px-4 py-2 rounded-xl bg-card shadow-medium border border-border animate-float-delayed">
              <p className="text-sm font-medium text-foreground">⚡ Instant Results</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AIMatchingSection;
