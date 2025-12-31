import { Search, Sparkles, Video, CheckCircle } from "lucide-react";

const steps = [
  {
    icon: Search,
    title: "Tell Us Your Goals",
    description: "Share what you want to learn and your preferred learning style. Our smart questionnaire takes just 2 minutes.",
    color: "primary",
  },
  {
    icon: Sparkles,
    title: "AI Finds Your Match",
    description: "Our AI analyzes thousands of tutors to find the perfect match based on expertise, teaching style, and availability.",
    color: "accent",
  },
  {
    icon: Video,
    title: "Start Learning",
    description: "Book your first session with a few clicks. Meet your tutor via video call and begin your personalized learning journey.",
    color: "secondary",
  },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 border border-secondary/20 mb-6">
            <CheckCircle className="w-4 h-4 text-secondary" />
            <span className="text-sm font-medium text-foreground">Simple Process</span>
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            How Bright Minds Match Works
          </h2>
          <p className="text-muted-foreground text-lg">
            Getting started is easy. Find your ideal tutor in three simple steps.
          </p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {steps.map((step, index) => (
            <div key={index} className="relative group">
              {/* Connector Line (hidden on mobile, visible on md+) */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-16 left-[calc(50%+40px)] w-[calc(100%-80px)] h-0.5 bg-gradient-to-r from-border via-primary/30 to-border" />
              )}

              <div className="flex flex-col items-center text-center">
                {/* Step Number */}
                <div className="relative mb-6">
                  <div
                    className={`w-32 h-32 rounded-3xl flex items-center justify-center transition-all duration-300 group-hover:scale-105 ${
                      step.color === "primary"
                        ? "bg-primary/10 group-hover:bg-primary/20"
                        : step.color === "accent"
                        ? "bg-accent/10 group-hover:bg-accent/20"
                        : "bg-secondary/10 group-hover:bg-secondary/20"
                    }`}
                  >
                    <step.icon
                      className={`w-12 h-12 ${
                        step.color === "primary"
                          ? "text-primary"
                          : step.color === "accent"
                          ? "text-accent"
                          : "text-secondary"
                      }`}
                    />
                  </div>
                  <div className="absolute -top-2 -right-2 w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-lg shadow-soft">
                    {index + 1}
                  </div>
                </div>

                {/* Content */}
                <h3 className="font-display text-xl font-bold text-foreground mb-3">
                  {step.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
