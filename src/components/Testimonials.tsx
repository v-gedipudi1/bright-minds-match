import { Star, Quote } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const testimonials = [
  {
    name: "Alex Thompson",
    role: "High School Student",
    avatar: "AT",
    rating: 5,
    text: "Bright Minds Match helped me find the perfect math tutor. My grades went from C's to A's in just one semester. The AI matching is incredible!",
  },
  {
    name: "Maria Santos",
    role: "College Junior",
    avatar: "MS",
    rating: 5,
    text: "I was struggling with organic chemistry until I found Dr. Watson through this platform. Her teaching style matched exactly what I needed.",
  },
  {
    name: "David Park",
    role: "Working Professional",
    avatar: "DP",
    rating: 5,
    text: "Learning Spanish as an adult seemed impossible, but my tutor James made it fun and practical. Now I can hold conversations with confidence!",
  },
];

const Testimonials = () => {
  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 border border-secondary/20 mb-6">
            <Quote className="w-4 h-4 text-secondary" />
            <span className="text-sm font-medium text-foreground">Success Stories</span>
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            Loved by Students Worldwide
          </h2>
          <p className="text-muted-foreground text-lg">
            See how Bright Minds Match has transformed learning journeys.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <Card key={index} variant="elevated" className="overflow-hidden">
              <CardContent className="p-6">
                {/* Rating */}
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-5 h-5 text-primary fill-primary"
                    />
                  ))}
                </div>

                {/* Quote */}
                <p className="text-foreground leading-relaxed mb-6">
                  "{testimonial.text}"
                </p>

                {/* Author */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center text-primary-foreground font-bold">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
