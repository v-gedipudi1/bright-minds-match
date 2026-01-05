import { UserPlus, Users, CalendarCheck, CreditCard, Video, CheckCircle } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    title: "Create Your Account",
    description: "Sign up as a student and tell us about your learning goals, subjects you need help with, and your preferred schedule.",
    color: "primary",
  },
  {
    icon: Users,
    title: "Join a Class",
    description: "Browse our verified tutors or use AI matching to find your perfect tutor. Join their class to get started.",
    color: "accent",
  },
  {
    icon: CalendarCheck,
    title: "Book a Session",
    description: "Choose a date and time that works for you from your tutor's availability. Select your subject and session duration.",
    color: "secondary",
  },
  {
    icon: CreditCard,
    title: "Complete Payment",
    description: "Securely pay for your session through our platform. Your tutor will be notified once payment is confirmed.",
    color: "primary",
  },
  {
    icon: Video,
    title: "Get Your Meeting Link",
    description: "Receive your personalized video meeting link. Connect with your tutor and start your learning journey!",
    color: "accent",
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
            How It Works
          </h2>
          <p className="text-muted-foreground text-lg">
            Getting started is easy. Book your first tutoring session in five simple steps.
          </p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-5 gap-6 max-w-6xl mx-auto">
          {steps.map((step, index) => (
            <div key={index} className="relative group">
              {/* Connector Line (hidden on mobile, visible on md+) */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-14 left-[calc(50%+32px)] w-[calc(100%-64px)] h-0.5 bg-gradient-to-r from-border via-primary/30 to-border" />
              )}

              <div className="flex flex-col items-center text-center">
                {/* Step Number */}
                <div className="relative mb-4">
                  <div
                    className={`w-24 h-24 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-105 ${
                      step.color === "primary"
                        ? "bg-primary/10 group-hover:bg-primary/20"
                        : step.color === "accent"
                        ? "bg-accent/10 group-hover:bg-accent/20"
                        : "bg-secondary/10 group-hover:bg-secondary/20"
                    }`}
                  >
                    <step.icon
                      className={`w-10 h-10 ${
                        step.color === "primary"
                          ? "text-primary"
                          : step.color === "accent"
                          ? "text-accent"
                          : "text-secondary"
                      }`}
                    />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-sm shadow-soft">
                    {index + 1}
                  </div>
                </div>

                {/* Content */}
                <h3 className="font-display text-lg font-bold text-foreground mb-2">
                  {step.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
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
