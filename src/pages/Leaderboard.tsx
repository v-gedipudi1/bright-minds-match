import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, ArrowLeft, Trophy, Medal, Star, User, Loader2 } from "lucide-react";

interface LeaderboardTutor {
  user_id: string;
  total_sessions: number;
  rating: number;
  subjects: string[];
  profile: {
    full_name: string;
    avatar_url: string | null;
  } | null;
}

const Leaderboard = () => {
  const [tutors, setTutors] = useState<LeaderboardTutor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        // Get tutors with paid session counts along with their profile info
        const { data: tutorData, error: tutorError } = await supabase
          .from("tutor_profiles")
          .select("user_id, total_sessions, rating, subjects")
          .order("total_sessions", { ascending: false })
          .limit(50);

        if (tutorError) throw tutorError;

        // Get all tutor user_ids
        const tutorUserIds = (tutorData || []).map(t => t.user_id);
        
        // Fetch profiles - try profiles table first (for authenticated users)
        let profilesData: { user_id: string; full_name: string | null; avatar_url: string | null }[] = [];
        
        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("user_id, full_name, avatar_url")
          .in("user_id", tutorUserIds);
        
        if (!profilesError && profiles) {
          profilesData = profiles;
        } else {
          // Fallback to public_profiles view
          const { data: publicProfiles } = await supabase
            .from("public_profiles")
            .select("user_id, full_name, avatar_url")
            .in("user_id", tutorUserIds);
          profilesData = publicProfiles || [];
        }

        // Create a map for quick lookup
        const profilesMap = new Map(
          profilesData.map(p => [p.user_id, { full_name: p.full_name, avatar_url: p.avatar_url }])
        );

        // Combine tutor data with profiles
        const tutorsWithProfiles = (tutorData || []).map(tutor => ({
          ...tutor,
          profile: profilesMap.get(tutor.user_id) || null,
        }));

        setTutors(tutorsWithProfiles);
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="w-6 h-6 text-yellow-500" />;
    if (index === 1) return <Medal className="w-6 h-6 text-gray-400" />;
    if (index === 2) return <Medal className="w-6 h-6 text-amber-600" />;
    return <span className="w-6 h-6 flex items-center justify-center font-bold text-muted-foreground">#{index + 1}</span>;
  };

  const getRankStyle = (index: number) => {
    if (index === 0) return "bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-950/30 dark:to-yellow-900/20 border-yellow-300 dark:border-yellow-700";
    if (index === 1) return "bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/30 dark:to-gray-700/20 border-gray-300 dark:border-gray-600";
    if (index === 2) return "bg-gradient-to-r from-amber-50 to-orange-100 dark:from-amber-950/30 dark:to-orange-900/20 border-amber-300 dark:border-amber-700";
    return "";
  };

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
              Dashboard
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary mb-4">
            <Trophy className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">
            Tutor Leaderboard
          </h1>
          <p className="text-muted-foreground">
            Top tutors ranked by completed paid sessions
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : tutors.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No tutors on the leaderboard yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {tutors.map((tutor, index) => (
              <Card key={tutor.user_id} className={`overflow-hidden ${getRankStyle(index)}`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="shrink-0">
                      {getRankIcon(index)}
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center overflow-hidden shrink-0">
                      {tutor.profile?.avatar_url ? (
                        <img
                          src={tutor.profile.avatar_url}
                          alt={tutor.profile.full_name || "Tutor"}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-6 h-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display font-bold text-foreground truncate">
                        {tutor.profile?.full_name || "Anonymous Tutor"}
                      </h3>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(tutor.subjects || []).slice(0, 2).map((subject, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 text-xs font-medium rounded-full bg-primary/10 text-primary"
                          >
                            {subject}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-display font-bold text-xl text-foreground">
                        {tutor.total_sessions || 0}
                      </div>
                      <div className="text-xs text-muted-foreground">sessions</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-primary fill-primary" />
                        <span className="font-semibold text-foreground">{tutor.rating || 0}</span>
                      </div>
                    </div>
                    <Link to={`/book/${tutor.user_id}`}>
                      <Button size="sm" variant="outline">
                        View
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Leaderboard;