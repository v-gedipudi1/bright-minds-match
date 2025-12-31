import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, ArrowLeft, Search, Star, Clock, Globe, Loader2, User } from "lucide-react";
import { toast } from "sonner";

interface Tutor {
  user_id: string;
  subjects: string[];
  hourly_rate: number;
  experience_years: number;
  rating: number;
  total_reviews: number;
  is_verified: boolean;
  profile: {
    full_name: string;
    avatar_url: string | null;
    bio: string | null;
  } | null;
}

const FindTutors = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [loadingTutors, setLoadingTutors] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchTutors = async () => {
      try {
        const { data, error } = await supabase
          .from("tutor_profiles")
          .select(`
            user_id,
            subjects,
            hourly_rate,
            experience_years,
            rating,
            total_reviews,
            is_verified
          `);

        if (error) throw error;

        // Fetch profile info for each tutor
        const tutorsWithProfiles = await Promise.all(
          (data || []).map(async (tutor) => {
            const { data: profileData } = await supabase
              .from("profiles")
              .select("full_name, avatar_url, bio")
              .eq("user_id", tutor.user_id)
              .maybeSingle();

            return {
              ...tutor,
              profile: profileData,
            };
          })
        );

        setTutors(tutorsWithProfiles);
      } catch (error) {
        console.error("Error fetching tutors:", error);
        toast.error("Failed to load tutors");
      } finally {
        setLoadingTutors(false);
      }
    };

    fetchTutors();
  }, []);

  const filteredTutors = tutors.filter((tutor) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      tutor.profile?.full_name?.toLowerCase().includes(query) ||
      tutor.subjects?.some((s) => s.toLowerCase().includes(query))
    );
  });

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

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">
            Find Your Perfect Tutor
          </h1>
          <p className="text-muted-foreground mb-8">
            Browse our expert tutors and book a session
          </p>

          {/* Search */}
          <div className="relative mb-8">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search by name or subject..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12"
            />
          </div>

          {/* Tutors Grid */}
          {loadingTutors ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredTutors.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No tutors found</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {filteredTutors.map((tutor) => (
                <Card key={tutor.user_id} className="overflow-hidden hover:shadow-medium transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center overflow-hidden shrink-0">
                        {tutor.profile?.avatar_url ? (
                          <img
                            src={tutor.profile.avatar_url}
                            alt={tutor.profile.full_name || "Tutor"}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-10 h-10 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-display font-bold text-lg text-foreground truncate">
                              {tutor.profile?.full_name || "Anonymous Tutor"}
                            </h3>
                            {tutor.is_verified && (
                              <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700 mt-1">
                                Verified
                              </span>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            <span className="font-display font-bold text-xl text-foreground">
                              ${tutor.hourly_rate}
                            </span>
                            <span className="text-sm text-muted-foreground">/hr</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1 mt-3">
                          {(tutor.subjects || []).slice(0, 3).map((subject, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 text-xs font-medium rounded-full bg-primary/10 text-primary"
                            >
                              {subject}
                            </span>
                          ))}
                          {(tutor.subjects || []).length > 3 && (
                            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-muted text-muted-foreground">
                              +{tutor.subjects.length - 3} more
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-primary fill-primary" />
                            <span>{tutor.rating || 0}</span>
                            <span>({tutor.total_reviews || 0})</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{tutor.experience_years || 0}+ years</span>
                          </div>
                        </div>

                        <Link to={`/book/${tutor.user_id}`}>
                          <Button className="w-full mt-4" size="sm">
                            View Profile & Book
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default FindTutors;
