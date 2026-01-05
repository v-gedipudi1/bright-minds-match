import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Users, Search, Plus, LogOut, Loader2, User, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface Enrollment {
  id: string;
  tutor_id: string;
  tutor_name: string;
  tutor_avatar: string | null;
  created_at: string;
}

interface TutorSearchResult {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  subjects: string[];
  rating: number;
}

const MyClasses = () => {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<TutorSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [joining, setJoining] = useState<string | null>(null);
  const [successDialog, setSuccessDialog] = useState<{ open: boolean; tutorName: string }>({
    open: false,
    tutorName: "",
  });
  const [leaving, setLeaving] = useState<string | null>(null);

  useEffect(() => {
    fetchEnrollments();
  }, [user]);

  const fetchEnrollments = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("class_enrollments")
        .select("*")
        .eq("student_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Enrich with tutor profile data
      const enriched = await Promise.all(
        (data || []).map(async (enrollment) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, avatar_url")
            .eq("user_id", enrollment.tutor_id)
            .maybeSingle();

          return {
            ...enrollment,
            tutor_name: profile?.full_name || "Unknown Tutor",
            tutor_avatar: profile?.avatar_url || null,
          };
        })
      );

      setEnrollments(enriched);
    } catch (error) {
      console.error("Error fetching enrollments:", error);
      toast.error("Failed to load your classes");
    } finally {
      setLoading(false);
    }
  };

  const searchTutors = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      // Search profiles for tutors
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .eq("role", "tutor")
        .ilike("full_name", `%${searchQuery}%`);

      if (profilesError) throw profilesError;

      // Get tutor profile details
      const results = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { data: tutorProfile } = await supabase
            .from("tutor_profiles")
            .select("subjects, rating")
            .eq("user_id", profile.user_id)
            .maybeSingle();

          return {
            user_id: profile.user_id,
            full_name: profile.full_name,
            avatar_url: profile.avatar_url,
            subjects: tutorProfile?.subjects || [],
            rating: tutorProfile?.rating || 0,
          };
        })
      );

      // Filter out tutors already enrolled with
      const enrolledTutorIds = enrollments.map((e) => e.tutor_id);
      const filteredResults = results.filter((r) => !enrolledTutorIds.includes(r.user_id));

      setSearchResults(filteredResults);
    } catch (error) {
      console.error("Error searching tutors:", error);
      toast.error("Failed to search tutors");
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchOpen && searchQuery) {
        searchTutors();
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, searchOpen]);

  const joinClass = async (tutor: TutorSearchResult) => {
    if (!user) return;

    setJoining(tutor.user_id);
    try {
      const { error } = await supabase.from("class_enrollments").insert({
        student_id: user.id,
        tutor_id: tutor.user_id,
      });

      if (error) throw error;

      setSuccessDialog({ open: true, tutorName: tutor.full_name });
      setSearchOpen(false);
      setSearchQuery("");
      setSearchResults([]);
      fetchEnrollments();
    } catch (error) {
      console.error("Error joining class:", error);
      toast.error("Failed to join class");
    } finally {
      setJoining(null);
    }
  };

  const leaveClass = async (enrollmentId: string, tutorName: string) => {
    setLeaving(enrollmentId);
    try {
      const { error } = await supabase
        .from("class_enrollments")
        .delete()
        .eq("id", enrollmentId);

      if (error) throw error;

      setEnrollments((prev) => prev.filter((e) => e.id !== enrollmentId));
      toast.success(`Left ${tutorName}'s class`);
    } catch (error) {
      console.error("Error leaving class:", error);
      toast.error("Failed to leave class");
    } finally {
      setLeaving(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              My Classes
            </CardTitle>
            <CardDescription>Tutors you're enrolled with</CardDescription>
          </div>
          <Button onClick={() => setSearchOpen(true)} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Join a Class
          </Button>
        </CardHeader>
        <CardContent>
          {enrollments.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                You haven't joined any classes yet
              </p>
              <Button onClick={() => setSearchOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Join Your First Class
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {enrollments.map((enrollment) => (
                <div
                  key={enrollment.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border border-border"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center overflow-hidden">
                      {enrollment.tutor_avatar ? (
                        <img
                          src={enrollment.tutor_avatar}
                          alt={enrollment.tutor_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-6 h-6 text-primary" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {enrollment.tutor_name}'s Class
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Joined {new Date(enrollment.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => leaveClass(enrollment.id, enrollment.tutor_name)}
                    disabled={leaving === enrollment.id}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    {leaving === enrollment.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <LogOut className="w-4 h-4 mr-2" />
                        Leave
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Join Class Search Dialog */}
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Join a Class</DialogTitle>
            <DialogDescription>
              Search for a tutor by name to join their class
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search tutors by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {searching ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : searchResults.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {searchResults.map((tutor) => (
                  <div
                    key={tutor.user_id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center overflow-hidden">
                        {tutor.avatar_url ? (
                          <img
                            src={tutor.avatar_url}
                            alt={tutor.full_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-5 h-5 text-primary" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm text-foreground">
                          {tutor.full_name}
                        </p>
                        {tutor.subjects.length > 0 && (
                          <p className="text-xs text-muted-foreground">
                            {tutor.subjects.slice(0, 2).join(", ")}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => joinClass(tutor)}
                      disabled={joining === tutor.user_id}
                    >
                      {joining === tutor.user_id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Join Class"
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            ) : searchQuery ? (
              <p className="text-center text-muted-foreground py-4">
                No tutors found matching "{searchQuery}"
              </p>
            ) : (
              <p className="text-center text-muted-foreground py-4">
                Start typing to search for tutors
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={successDialog.open} onOpenChange={(open) => setSuccessDialog({ ...successDialog, open })}>
        <DialogContent className="sm:max-w-sm text-center">
          <div className="py-6">
            <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <DialogTitle className="text-xl mb-2">Congratulations!</DialogTitle>
            <DialogDescription className="text-base">
              You have joined {successDialog.tutorName}'s class!
            </DialogDescription>
            <Button
              className="mt-6"
              onClick={() => setSuccessDialog({ open: false, tutorName: "" })}
            >
              Got it!
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MyClasses;
