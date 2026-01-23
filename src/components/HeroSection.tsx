import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Search, Star, Users, Lock, Brain, Sparkles, Target, Zap } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import heroBg from "@/assets/hero-bg.jpg";

const HeroSection = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [tutorDialogOpen, setTutorDialogOpen] = useState(false);
  const [tutorPassword, setTutorPassword] = useState("");
  const navigate = useNavigate();

  const handleSearch = () => {
    navigate("/auth");
  };

  const handleTutorPortalSubmit = () => {
    if (tutorPassword === "7904") {
      setTutorDialogOpen(false);
      setTutorPassword("");
      navigate("/auth?role=tutor");
    } else {
      toast.error("Incorrect password. Please try again.");
    }
  };

  return (
    <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
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
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-5 animate-fade-in">
            <Star className="w-3 h-3 text-primary fill-primary" />
            <span className="text-xs font-medium text-foreground">
              AI-Powered Tutor Matching
            </span>
          </div>

          {/* Headline */}
          <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight mb-4 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            Find Your Perfect Tutor,
            <br />
            <span className="text-gradient-primary">Unlock Your Potential</span>
          </h1>

          {/* Subheadline */}
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto mb-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            Connecting struggling students with working professionals and advanced 
            college students. Our AI matches you with the perfect mentor.
          </p>

          {/* Search Bar */}
          <div className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto mb-6 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="What subject do you need help with?"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-12 pl-10 pr-4 rounded-xl border-2 border-border bg-card text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors shadow-soft text-sm"
              />
            </div>
            <Button variant="hero" size="default" onClick={handleSearch}>
              Find My Tutor
            </Button>
          </div>

          {/* AI Matching CTA - Prominent Section */}
          <div className="animate-fade-in mb-6" style={{ animationDelay: '0.35s' }}>
            <div className="relative overflow-hidden rounded-2xl bg-card border border-primary/30 shadow-medium p-5 md:p-6 max-w-2xl mx-auto">
              {/* Background decoration */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-primary/10 to-accent/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-secondary/10 to-primary/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
              
              <div className="relative z-10 flex flex-col sm:flex-row items-center gap-4">
                {/* Icon */}
                <div className="shrink-0">
                  <div className="w-14 h-14 rounded-xl gradient-primary flex items-center justify-center shadow-glow animate-pulse-soft">
                    <Brain className="w-7 h-7 text-primary-foreground" />
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 text-center sm:text-left">
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-accent/10 border border-accent/20 mb-2">
                    <Sparkles className="w-3 h-3 text-accent" />
                    <span className="text-xs font-semibold text-accent">AI-Powered</span>
                  </div>
                  
                  <h2 className="font-display text-lg md:text-xl font-bold text-foreground mb-1">
                    Let AI Find Your Perfect Match
                  </h2>
                  
                  <p className="text-xs text-muted-foreground mb-3">
                    Answer a few questions and get matched with tutors who fit your learning style perfectly.
                  </p>

                  {/* Features */}
                  <div className="flex flex-wrap gap-3 mb-3 justify-center sm:justify-start">
                    <div className="flex items-center gap-1.5 text-xs text-foreground">
                      <Target className="w-3 h-3 text-primary" />
                      <span>Personalized</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-foreground">
                      <Zap className="w-3 h-3 text-accent" />
                      <span>Instant Results</span>
                    </div>
                  </div>

                  <Link to="/ai-matching">
                    <Button variant="hero" size="sm" className="group">
                      <Brain className="w-4 h-4 mr-1.5 group-hover:animate-pulse" />
                      Start AI Matching
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap justify-center gap-3 mb-6 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <Link to="/find-tutors">
              <Button variant="outline" size="sm" className="gap-2">
                <Users className="w-4 h-4" />
                Browse All Tutors
              </Button>
            </Link>
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2"
              onClick={() => setTutorDialogOpen(true)}
            >
              <Lock className="w-4 h-4" />
              Tutor Portal
            </Button>
            <Link to="/auth?role=student">
              <Button variant="outline" size="sm" className="gap-2">
                Book Your First Session
              </Button>
            </Link>
          </div>

          {/* Tutor Portal Password Dialog */}
          <Dialog open={tutorDialogOpen} onOpenChange={setTutorDialogOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Tutor Portal Access</DialogTitle>
                <DialogDescription>
                  Please enter the tutor password to continue.
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-4 py-4">
                <Input
                  type="password"
                  placeholder="Enter password"
                  value={tutorPassword}
                  onChange={(e) => setTutorPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleTutorPortalSubmit();
                    }
                  }}
                />
                <Button onClick={handleTutorPortalSubmit}>
                  Access Portal
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Slogan */}
          <div className="animate-fade-in" style={{ animationDelay: '0.45s' }}>
            <div className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-card/80 border border-border backdrop-blur-sm shadow-soft">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                <Star className="w-5 h-5 text-primary fill-primary" />
              </div>
              <div className="text-left">
                <p className="font-display font-bold text-base text-foreground">
                  Where Bright Minds Meet
                </p>
                <p className="text-xs text-muted-foreground">
                  Personalized learning. Real results.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Elements */}
      <div className="absolute bottom-20 left-10 w-16 h-16 rounded-full bg-primary/20 blur-2xl animate-float" />
      <div className="absolute top-40 right-20 w-24 h-24 rounded-full bg-accent/20 blur-3xl animate-float-delayed" />
    </section>
  );
};

export default HeroSection;
