import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, Clock, Globe, Award } from "lucide-react";

const tutors = [
  {
    name: "Dr. Sarah Chen",
    subject: "Mathematics & Physics",
    rating: 4.9,
    reviews: 342,
    hourlyRate: 65,
    experience: "10+ years",
    languages: ["English", "Mandarin"],
    avatar: "SC",
    badges: ["Top Rated", "PhD"],
    available: true,
  },
  {
    name: "James Rodriguez",
    subject: "Spanish & Literature",
    rating: 4.8,
    reviews: 256,
    hourlyRate: 45,
    experience: "8 years",
    languages: ["English", "Spanish"],
    avatar: "JR",
    badges: ["Native Speaker"],
    available: true,
  },
  {
    name: "Prof. Emily Watson",
    subject: "Chemistry & Biology",
    rating: 5.0,
    reviews: 189,
    hourlyRate: 75,
    experience: "15+ years",
    languages: ["English"],
    avatar: "EW",
    badges: ["Top Rated", "Professor"],
    available: false,
  },
  {
    name: "Michael Kim",
    subject: "Computer Science",
    rating: 4.9,
    reviews: 412,
    hourlyRate: 55,
    experience: "6 years",
    languages: ["English", "Korean"],
    avatar: "MK",
    badges: ["Industry Expert"],
    available: true,
  },
];

const FeaturedTutors = () => {
  return (
    <section id="tutors" className="py-24">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-6">
            <Award className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium text-foreground">Featured Experts</span>
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            Meet Our Top Tutors
          </h2>
          <p className="text-muted-foreground text-lg">
            Handpicked experts with proven track records in helping students achieve their goals.
          </p>
        </div>

        {/* Tutor Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {tutors.map((tutor, index) => (
            <Card
              key={index}
              variant="tutor"
              className="overflow-hidden group"
            >
              <CardContent className="p-6">
                {/* Avatar */}
                <div className="relative mb-4">
                  <div className="w-20 h-20 mx-auto rounded-2xl gradient-secondary flex items-center justify-center text-secondary-foreground font-bold text-2xl shadow-medium">
                    {tutor.avatar}
                  </div>
                  {/* Availability Indicator */}
                  <div
                    className={`absolute bottom-0 right-1/2 translate-x-1/2 translate-y-1/2 px-3 py-1 rounded-full text-xs font-medium ${
                      tutor.available
                        ? "bg-green-100 text-green-700"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {tutor.available ? "Available" : "Busy"}
                  </div>
                </div>

                {/* Info */}
                <div className="text-center mb-4">
                  <h3 className="font-display font-bold text-lg text-foreground mb-1">
                    {tutor.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">{tutor.subject}</p>
                  
                  {/* Badges */}
                  <div className="flex flex-wrap justify-center gap-1 mb-3">
                    {tutor.badges.map((badge, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 text-xs font-medium rounded-full bg-primary/10 text-primary"
                      >
                        {badge}
                      </span>
                    ))}
                  </div>

                  {/* Rating */}
                  <div className="flex items-center justify-center gap-1 mb-3">
                    <Star className="w-4 h-4 text-primary fill-primary" />
                    <span className="font-semibold text-foreground">{tutor.rating}</span>
                    <span className="text-sm text-muted-foreground">
                      ({tutor.reviews} reviews)
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>{tutor.experience} experience</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Globe className="w-4 h-4" />
                    <span>{tutor.languages.join(", ")}</span>
                  </div>
                </div>

                {/* Price & CTA */}
                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div>
                    <span className="font-display font-bold text-xl text-foreground">
                      ${tutor.hourlyRate}
                    </span>
                    <span className="text-sm text-muted-foreground">/hr</span>
                  </div>
                  <Link to="/auth">
                    <Button variant="default" size="sm">
                      View Profile
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* View All CTA */}
        <div className="text-center mt-12">
          <Link to="/auth">
            <Button variant="outline" size="lg">
              Browse All Tutors
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturedTutors;
