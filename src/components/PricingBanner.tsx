import { DollarSign, UserPlus, Sparkles, CheckCircle } from "lucide-react";

const benefits = [
  {
    icon: UserPlus,
    title: "Free to Join",
    description: "Register as a student or tutor at absolutely no cost",
  },
  {
    icon: Sparkles,
    title: "Free AI Matching",
    description: "Our smart matching system is completely free to use",
  },
  {
    icon: DollarSign,
    title: "Pay Only When You Book",
    description: "Students only pay after confirming a session",
  },
  {
    icon: CheckCircle,
    title: "92% Goes to Tutors",
    description: "Tutors keep 92% of every session fee earned",
  },
];

const PricingBanner = () => {
  return (
    <section className="py-16 bg-gradient-to-r from-primary/5 via-accent/5 to-secondary/5">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 border border-secondary/20 mb-6">
            <DollarSign className="w-4 h-4 text-secondary" />
            <span className="text-sm font-medium text-foreground">Transparent Pricing</span>
          </div>
          <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-4">
            Start Learning Without the Price Tag
          </h2>
          <p className="text-muted-foreground text-lg">
            We believe education should be accessible. That's why we keep things simple and fair.
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="flex flex-col items-center text-center p-6 rounded-2xl bg-card border border-border shadow-soft hover:shadow-soft-lg transition-all duration-300 hover:-translate-y-1"
            >
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <benefit.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-display font-bold text-foreground mb-2">
                {benefit.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingBanner;
