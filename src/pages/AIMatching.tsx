import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, ArrowLeft, Brain, ArrowRight, Loader2, Star, User, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface StudentProfile {
  learning_goals: string | null;
  subjects_interested: string[];
  learning_style: string | null;
  personality: string | null;
  background: string | null;
  study_habits: string | null;
}

interface TutorMatch {
  tutor_id: string;
  match_score: number;
  match_reasons: string[];
  tutor_info?: {
    full_name: string;
    avatar_url: string | null;
    subjects: string[];
    hourly_rate: number;
    rating: number;
  };
}

const AIMatching = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [matches, setMatches] = useState<TutorMatch[]>([]);
  
  // Form state
  const [subjectsInterested, setSubjectsInterested] = useState("");
  const [learningGoals, setLearningGoals] = useState("");
  const [learningStyle, setLearningStyle] = useState("");
  const [background, setBackground] = useState("");
  const [personality, setPersonality] = useState("");
  const [studyHabits, setStudyHabits] = useState("");

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchExistingProfile = async () => {
      if (!user) return;

      const { data } = await supabase
        .from("student_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data) {
        setSubjectsInterested((data.subjects_interested || []).join(", "));
        setLearningGoals(data.learning_goals || "");
        setLearningStyle(data.learning_style || "");
        setBackground(data.background || "");
        setPersonality(data.personality || "");
        setStudyHabits(data.study_habits || "");
      }
    };

    fetchExistingProfile();
  }, [user]);

  const handleNextStep = () => {
    if (step === 1 && !subjectsInterested.trim()) {
      toast.error("Please enter at least one subject");
      return;
    }
    if (step === 2 && !learningGoals.trim()) {
      toast.error("Please describe your learning goals");
      return;
    }
    setStep(step + 1);
  };

  const handleFindMatches = async () => {
    if (!user) return;

    setIsAnalyzing(true);
    try {
      // Save the student profile first
      const { error: updateError } = await supabase
        .from("student_profiles")
        .update({
          subjects_interested: subjectsInterested.split(",").map((s) => s.trim()).filter(Boolean),
          learning_goals: learningGoals,
          learning_style: learningStyle,
          background,
          personality,
          study_habits: studyHabits,
          ai_matching_completed: true,
        })
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      // Fetch all tutors
      const { data: tutorsData, error: tutorsError } = await supabase
        .from("tutor_profiles")
        .select(`
          user_id,
          subjects,
          hourly_rate,
          experience_years,
          education,
          teaching_style,
          rating
        `);

      if (tutorsError) throw tutorsError;

      // Get tutor profiles
      const tutorsWithProfiles = await Promise.all(
        (tutorsData || []).map(async (tutor) => {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("full_name, avatar_url")
            .eq("user_id", tutor.user_id)
            .maybeSingle();

          return {
            ...tutor,
            full_name: profileData?.full_name || "Anonymous Tutor",
            avatar_url: profileData?.avatar_url,
          };
        })
      );

      if (tutorsWithProfiles.length === 0) {
        toast.info("No tutors available yet. Check back soon!");
        setStep(4);
        return;
      }

      // Call AI matching function
      const { data: matchData, error: matchError } = await supabase.functions.invoke("ai-match", {
        body: {
          studentProfile: {
            subjects_interested: subjectsInterested.split(",").map((s) => s.trim()),
            learning_goals: learningGoals,
            learning_style: learningStyle,
            background,
            personality,
            study_habits: studyHabits,
          },
          tutors: tutorsWithProfiles,
        },
      });

      if (matchError) throw matchError;

      const matchResults = matchData?.matches || [];
      
      // Enrich matches with tutor info
      const enrichedMatches = matchResults.map((match: any) => {
        const tutor = tutorsWithProfiles.find((t) => t.user_id === match.tutor_id);
        return {
          ...match,
          tutor_info: tutor
            ? {
                full_name: tutor.full_name,
                avatar_url: tutor.avatar_url,
                subjects: tutor.subjects || [],
                hourly_rate: tutor.hourly_rate,
                rating: tutor.rating,
              }
            : null,
        };
      });

      setMatches(enrichedMatches.sort((a: TutorMatch, b: TutorMatch) => b.match_score - a.match_score));
      setStep(4);
    } catch (error) {
      console.error("Error finding matches:", error);
      toast.error("Failed to find matches. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-soft">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-xl text-foreground">
              Bright<span className="text-gradient-primary">Minds</span>
            </span>
          </Link>
          <Link to="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Progress */}
        {step < 4 && (
          <div className="flex items-center justify-center gap-2 mb-8">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`w-3 h-3 rounded-full transition-colors ${
                  s <= step ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>
        )}

        {/* Step 1: Subjects */}
        {step === 1 && (
          <Card>
            <CardHeader className="text-center">
              <div className="w-16 h-16 mx-auto rounded-2xl gradient-primary flex items-center justify-center mb-4">
                <Brain className="w-8 h-8 text-primary-foreground" />
              </div>
              <CardTitle className="font-display text-2xl">
                Let's Find Your Perfect Tutor
              </CardTitle>
              <CardDescription>
                Answer a few questions so our AI can match you with the best tutors
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subjects">What subjects do you need help with?</Label>
                <Input
                  id="subjects"
                  value={subjectsInterested}
                  onChange={(e) => setSubjectsInterested(e.target.value)}
                  placeholder="e.g., Mathematics, Physics, Programming"
                />
                <p className="text-xs text-muted-foreground">Separate multiple subjects with commas</p>
              </div>
              <Button onClick={handleNextStep} className="w-full">
                Continue <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Goals & Background */}
        {step === 2 && (
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="font-display text-2xl">
                Your Learning Goals
              </CardTitle>
              <CardDescription>
                Tell us what you want to achieve
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="learningGoals">What are your learning goals?</Label>
                <Textarea
                  id="learningGoals"
                  value={learningGoals}
                  onChange={(e) => setLearningGoals(e.target.value)}
                  placeholder="e.g., Pass my calculus exam, prepare for SAT, learn programming basics..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="background">Educational Background</Label>
                <Textarea
                  id="background"
                  value={background}
                  onChange={(e) => setBackground(e.target.value)}
                  placeholder="e.g., High school junior, studying for AP courses..."
                  rows={3}
                />
              </div>
              <div className="flex gap-4">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                  Back
                </Button>
                <Button onClick={handleNextStep} className="flex-1">
                  Continue <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Learning Style & Personality */}
        {step === 3 && (
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="font-display text-2xl">
                How Do You Learn Best?
              </CardTitle>
              <CardDescription>
                Help us understand your learning style
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="learningStyle">Your Learning Style</Label>
                <Input
                  id="learningStyle"
                  value={learningStyle}
                  onChange={(e) => setLearningStyle(e.target.value)}
                  placeholder="e.g., Visual learner, prefer hands-on practice..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="personality">Your Personality</Label>
                <Textarea
                  id="personality"
                  value={personality}
                  onChange={(e) => setPersonality(e.target.value)}
                  placeholder="e.g., I'm shy at first but open up quickly, I like to ask lots of questions..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="studyHabits">Study Habits</Label>
                <Textarea
                  id="studyHabits"
                  value={studyHabits}
                  onChange={(e) => setStudyHabits(e.target.value)}
                  placeholder="e.g., I study best in the evenings, I prefer short 30-min sessions..."
                  rows={3}
                />
              </div>
              <div className="flex gap-4">
                <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                  Back
                </Button>
                <Button onClick={handleFindMatches} disabled={isAnalyzing} className="flex-1">
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Find My Matches
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Results */}
        {step === 4 && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-green-100 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h1 className="font-display text-2xl font-bold text-foreground mb-2">
                Your AI Matches
              </h1>
              <p className="text-muted-foreground">
                Based on your profile, here are your top tutor matches
              </p>
            </div>

            {matches.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground mb-4">
                    No tutors available at the moment. Check back soon!
                  </p>
                  <Link to="/dashboard">
                    <Button>Back to Dashboard</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              matches.map((match, index) => (
                <Card key={match.tutor_id} className="overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="relative">
                        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center overflow-hidden">
                          {match.tutor_info?.avatar_url ? (
                            <img
                              src={match.tutor_info.avatar_url}
                              alt={match.tutor_info.full_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="w-8 h-8 text-muted-foreground" />
                          )}
                        </div>
                        {index === 0 && (
                          <span className="absolute -top-2 -right-2 px-2 py-0.5 text-xs font-bold rounded-full bg-primary text-primary-foreground">
                            Best
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-display font-bold text-lg text-foreground">
                              {match.tutor_info?.full_name || "Tutor"}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-2xl font-bold text-primary">
                                {match.match_score}%
                              </span>
                              <span className="text-sm text-muted-foreground">match</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-display font-bold text-xl text-foreground">
                              ${match.tutor_info?.hourly_rate || 0}
                            </span>
                            <span className="text-sm text-muted-foreground">/hr</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1 mt-3">
                          {(match.tutor_info?.subjects || []).slice(0, 3).map((subject, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 text-xs font-medium rounded-full bg-primary/10 text-primary"
                            >
                              {subject}
                            </span>
                          ))}
                        </div>

                        <div className="mt-4 p-3 rounded-xl bg-muted/50">
                          <p className="text-xs font-medium text-muted-foreground mb-2">
                            Why this tutor is a great match:
                          </p>
                          <ul className="space-y-1">
                            {match.match_reasons.map((reason, i) => (
                              <li key={i} className="text-sm text-foreground flex items-start gap-2">
                                <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                                {reason}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <Link to={`/book/${match.tutor_id}`}>
                          <Button className="w-full mt-4">Book Session</Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default AIMatching;
