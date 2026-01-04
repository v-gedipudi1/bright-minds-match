import { Heart, Target, TrendingUp, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const AboutSection = () => {
  return (
    <section id="about" className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Heart className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Our Story</span>
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            About Bright Minds Match
          </h2>
          <p className="text-muted-foreground text-lg">
            From neighborhood tutoring to transforming how students learn
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Story */}
          <div className="space-y-6">
            <Card variant="elevated">
              <CardContent className="p-8">
                <h3 className="font-display text-2xl font-bold text-foreground mb-4">
                  How It All Started
                </h3>
                <div className="space-y-4 text-muted-foreground leading-relaxed">
                  <p>
                    Bright Minds Tutoring Service began as a simple mission: Venni Gedipudi 
                    tutoring neighborhood kids and relatives in high school. After starting 
                    college, word spread through referrals, and the student base grew rapidly.
                  </p>
                  <p>
                    To meet demand, Venni began recruiting working professionals and advanced 
                    college students, building a team of passionate educators. As the student base 
                    and tutor network grew, a pattern emerged, students thrived most when paired with 
                    the <span className="text-foreground font-medium">right</span> tutor.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card variant="elevated">
              <CardContent className="p-8">
                <h3 className="font-display text-2xl font-bold text-foreground mb-4">
                  The Discovery
                </h3>
                <div className="space-y-4 text-muted-foreground leading-relaxed">
                  <p>
                    After analyzing session data, tracking assessments, completion rates, and 
                    progress, a breakthrough emerged. The strongest predictor of student success 
                    wasn't tutor expertise or experience. It was the alignment between the 
                    student's learning style and the tutor's teaching approach.
                  </p>
                  <p>
                    Students who preferred structured explanations struggled with exploratory 
                    tutors, even highly qualified ones. The match mattered more than credentials.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Results & Vision */}
          <div className="space-y-6">
            <Card variant="elevated">
              <CardContent className="p-8">
                <h3 className="font-display text-2xl font-bold text-foreground mb-6">
                  The Results Speak
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-green-50 dark:bg-green-900/20">
                    <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="font-display font-bold text-2xl text-green-600">57%</p>
                      <p className="text-sm text-muted-foreground">Increase in student improvement</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20">
                    <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                      <Heart className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-display font-bold text-2xl text-blue-600">31%</p>
                      <p className="text-sm text-muted-foreground">Rise in parent satisfaction</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-purple-50 dark:bg-purple-900/20">
                    <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center">
                      <Target className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-display font-bold text-2xl text-purple-600">55%</p>
                      <p className="text-sm text-muted-foreground">Reduction in mismatched pairs</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card variant="elevated" className="border-primary/20">
              <CardContent className="p-8">
                <h3 className="font-display text-2xl font-bold text-foreground mb-4">
                  Our Mission Today
                </h3>
                <div className="space-y-4 text-muted-foreground leading-relaxed">
                  <p>
                    Bright Minds Match brings this data-driven matching approach online, 
                    connecting children and adult learners with the educators who can truly 
                    help them grow. We don't just find you a tutor, we find you 
                    <span className="text-foreground font-medium"> your</span> tutor.
                  </p>
                  <div className="flex items-center gap-3 pt-4 border-t border-border">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Venni Gedipudi</p>
                      <p className="text-sm text-muted-foreground">Founder, Bright Minds Tutoring Service</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
