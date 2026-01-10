import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Calendar, BookOpen, Star, Clock, LogOut, User, Brain, Loader2, MessageSquare, Settings, Trophy, Users, Shield } from "lucide-react";
import { toast } from "sonner";
import MyClasses from "@/components/MyClasses";
import MyStudents from "@/components/MyStudents";

interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: "student" | "tutor";
  avatar_url: string | null;
  bio: string | null;
}

interface Session {
  id: string;
  subject: string;
  scheduled_at: string;
  status: string;
  tutor_id: string;
  student_id: string;
}

interface NotificationCounts {
  unreadMessages: number;
  unpaidSessions: number;
}

const Dashboard = () => {
  const { user, loading, signOut } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminCheck();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [notifications, setNotifications] = useState<NotificationCounts>({
    unreadMessages: 0,
    unpaidSessions: 0,
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        // Fetch profile
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (profileError) throw profileError;
        setProfile(profileData);

        // Fetch sessions
        const { data: sessionsData, error: sessionsError } = await supabase
          .from("sessions")
          .select("*")
          .or(`student_id.eq.${user.id},tutor_id.eq.${user.id}`)
          .order("scheduled_at", { ascending: true })
          .limit(5);

        if (sessionsError) throw sessionsError;
        setSessions(sessionsData || []);

        // Fetch notification counts
        // Unread messages
        const { count: unreadCount } = await supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .eq("recipient_id", user.id)
          .is("read_at", null);

        // Unpaid sessions (for students) - only count future sessions
        const { count: unpaidCount } = await supabase
          .from("sessions")
          .select("*", { count: "exact", head: true })
          .eq("student_id", user.id)
          .eq("status", "awaiting_payment")
          .gte("scheduled_at", new Date().toISOString());

        setNotifications({
          unreadMessages: unreadCount || 0,
          unpaidSessions: unpaidCount || 0,
        });
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load dashboard data");
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out successfully");
    navigate("/");
  };

  if (loading || loadingData || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const isStudent = profile?.role === "student";
  const isTutor = profile?.role === "tutor";

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
          <div className="flex items-center gap-4">
            <Link to="/profile">
              <Button variant="ghost" size="sm">
                <User className="w-4 h-4 mr-2" />
                Profile
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">
            Welcome back, {profile?.full_name || "User"}!
          </h1>
          <p className="text-muted-foreground">
            {isStudent
              ? "Ready to continue your learning journey?"
              : "Here's your tutoring overview"}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Admin Monitoring Card */}
          {isAdmin && (
            <Link to="/monitoring">
              <Card className="hover:shadow-medium transition-shadow cursor-pointer group border-2 border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-amber-600/10">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center group-hover:bg-amber-500/30 transition-colors">
                    <Shield className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Monitoring</p>
                    <p className="text-sm text-muted-foreground">Admin panel</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )}
          {isStudent && (
            <>
              <Link to="/leaderboard">
                <Card className="hover:shadow-medium transition-shadow cursor-pointer group">
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
                      <Trophy className="w-6 h-6 text-amber-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Leaderboard</p>
                      <p className="text-sm text-muted-foreground">Top tutors</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
              <Link to="/ai-matching">
                <Card className="hover:shadow-medium transition-shadow cursor-pointer group">
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                      <Brain className="w-6 h-6 text-accent" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">AI Match</p>
                      <p className="text-sm text-muted-foreground">Find perfect tutor</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </>
          )}
          {isTutor && (
            <Link to="/profile">
              <Card className="hover:shadow-medium transition-shadow cursor-pointer group border-2 border-primary/20">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Settings className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Set Availability</p>
                    <p className="text-sm text-muted-foreground">Manage schedule</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )}
          <Link to="/sessions" className="relative">
            <Card className="hover:shadow-medium transition-shadow cursor-pointer group">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="relative w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center group-hover:bg-secondary/20 transition-colors">
                  <Calendar className="w-6 h-6 text-secondary" />
                  {isStudent && notifications.unpaidSessions > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs font-bold rounded-full flex items-center justify-center">
                      {notifications.unpaidSessions}
                    </span>
                  )}
                </div>
                <div>
                  <p className="font-semibold text-foreground">My Sessions</p>
                  <p className="text-sm text-muted-foreground">View schedule</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link to="/messages" className="relative">
            <Card className="hover:shadow-medium transition-shadow cursor-pointer group">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="relative w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                  <MessageSquare className="w-6 h-6 text-accent" />
                  {notifications.unreadMessages > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs font-bold rounded-full flex items-center justify-center">
                      {notifications.unreadMessages > 9 ? "9+" : notifications.unreadMessages}
                    </span>
                  )}
                </div>
                <div>
                  <p className="font-semibold text-foreground">Messages</p>
                  <p className="text-sm text-muted-foreground">Chat with users</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link to="/profile">
            <Card className="hover:shadow-medium transition-shadow cursor-pointer group">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">My Profile</p>
                  <p className="text-sm text-muted-foreground">Edit details</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Stats and Upcoming Sessions */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Stats Cards */}
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-lg">Sessions</CardTitle>
              <CardDescription>Your tutoring activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Upcoming</span>
                  <span className="font-bold text-foreground">
                    {sessions.filter(s => s.status === "confirmed" || s.status === "pending").length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Completed</span>
                  <span className="font-bold text-foreground">
                    {sessions.filter(s => s.status === "completed").length}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Sessions */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="font-display text-lg">Upcoming Sessions</CardTitle>
                <CardDescription>Your next tutoring sessions</CardDescription>
              </div>
              <Link to="/sessions">
                <Button variant="outline" size="sm">View All</Button>
              </Link>
            </CardHeader>
            <CardContent>
              {sessions.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">No upcoming sessions</p>
                  {isStudent && (
                    <Link to="/find-tutors">
                      <Button>Book Your First Session</Button>
                    </Link>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {sessions.slice(0, 3).map((session) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border border-border"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                          <BookOpen className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{session.subject}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(session.scheduled_at).toLocaleDateString("en-US", {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          session.status === "confirmed"
                            ? "bg-green-100 text-green-700"
                            : session.status === "pending"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* My Classes (for students) or My Students (for tutors) */}
        <div className="mt-8">
          {isStudent && <MyClasses />}
          {isTutor && <MyStudents />}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
