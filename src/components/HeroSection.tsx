import { Button } from "@/components/ui/button";
import { Search, Star, Users, Award } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url(${heroBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-background/70 to-background" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8 animate-fade-in">
            <Star className="w-4 h-4 text-primary fill-primary" />
            <span className="text-sm font-medium text-foreground">
              AI-Powered Tutor Matching
            </span>
          </div>

          {/* Headline */}
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            Find Your Perfect Tutor,
            <br />
            <span className="text-gradient-primary">Unlock Your Potential</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            Connect with expert tutors personalized to your learning style. 
            Our AI matches you with the ideal mentor for one-on-one sessions 
            that transform the way you learn.
          </p>

          {/* Search Bar */}
          <div className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto mb-12 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="What subject do you need help with?"
                className="w-full h-14 pl-12 pr-4 rounded-xl border-2 border-border bg-card text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors shadow-soft"
              />
            </div>
            <Button variant="hero" size="lg">
              Find My Tutor
            </Button>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-8 md:gap-12 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div className="text-left">
                <p className="font-display font-bold text-2xl text-foreground">10K+</p>
                <p className="text-sm text-muted-foreground">Expert Tutors</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                <Star className="w-6 h-6 text-accent fill-accent" />
              </div>
              <div className="text-left">
                <p className="font-display font-bold text-2xl text-foreground">4.9/5</p>
                <p className="text-sm text-muted-foreground">Average Rating</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
                <Award className="w-6 h-6 text-secondary" />
              </div>
              <div className="text-left">
                <p className="font-display font-bold text-2xl text-foreground">500K+</p>
                <p className="text-sm text-muted-foreground">Sessions Completed</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Elements */}
      <div className="absolute bottom-20 left-10 w-20 h-20 rounded-full bg-primary/20 blur-2xl animate-float" />
      <div className="absolute top-40 right-20 w-32 h-32 rounded-full bg-accent/20 blur-3xl animate-float-delayed" />
    </section>
  );
};

export default HeroSection;
