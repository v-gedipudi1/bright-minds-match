import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Search, Star, Users, Lock } from "lucide-react";
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
            Connecting struggling students with working professionals and advanced 
            college students. Our AI matches you with the perfect mentor based on 
            learning styles, personalities, and goals.
          </p>

          {/* Search Bar */}
          <div className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto mb-12 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="What subject do you need help with?"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-14 pl-12 pr-4 rounded-xl border-2 border-border bg-card text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors shadow-soft"
              />
            </div>
            <Button variant="hero" size="lg" onClick={handleSearch}>
              Find My Tutor
            </Button>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap justify-center gap-4 mb-12 animate-fade-in" style={{ animationDelay: '0.35s' }}>
            <Link to="/find-tutors">
              <Button variant="outline" size="lg" className="gap-2">
                <Users className="w-5 h-5" />
                Browse All Tutors
              </Button>
            </Link>
            <Button 
              variant="outline" 
              size="lg" 
              className="gap-2"
              onClick={() => setTutorDialogOpen(true)}
            >
              <Lock className="w-5 h-5" />
              Tutor Portal
            </Button>
            <Link to="/auth?role=student">
              <Button variant="outline" size="lg" className="gap-2">
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
          <div className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <div className="inline-flex items-center gap-3 px-6 py-4 rounded-2xl bg-card/80 border border-border backdrop-blur-sm shadow-soft">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                <Star className="w-6 h-6 text-primary fill-primary" />
              </div>
              <div className="text-left">
                <p className="font-display font-bold text-lg text-foreground">
                  Where Bright Minds Meet
                </p>
                <p className="text-sm text-muted-foreground">
                  Personalized learning. Real results.
                </p>
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
