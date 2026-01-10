import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Sparkles, 
  ArrowLeft, 
  Users, 
  MessageSquare, 
  Calendar, 
  Loader2, 
  Shield,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle
} from "lucide-react";

interface Tutor {
  user_id: string;
  profile: {
    full_name: string;
    email: string;
    avatar_url: string | null;
  } | null;
  subjects: string[];
  total_sessions: number;
  rating: number;
}

interface Message {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  recipient_id: string;
  sender_profile?: {
    full_name: string;
    role: string;
  };
  recipient_profile?: {
    full_name: string;
    role: string;
  };
}

interface Session {
  id: string;
  subject: string;
  scheduled_at: string;
  status: string;
  duration_minutes: number;
  student_id: string;
  student_profile?: {
    full_name: string;
  };
}

const Monitoring = () => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminCheck();
  const navigate = useNavigate();
  
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [selectedTutor, setSelectedTutor] = useState<Tutor | null>(null);
  const [tutorMessages, setTutorMessages] = useState<Message[]>([]);
  const [tutorSessions, setTutorSessions] = useState<Session[]>([]);
  const [loadingTutors, setLoadingTutors] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!adminLoading && !isAdmin && user) {
      navigate("/dashboard");
    }
  }, [isAdmin, adminLoading, user, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchTutors();
    }
  }, [isAdmin]);

  const fetchTutors = async () => {
    try {
      const { data: tutorProfiles, error } = await supabase
        .from("tutor_profiles")
        .select("user_id, subjects, total_sessions, rating");

      if (error) throw error;

      // Fetch profile info for each tutor
      const tutorsWithProfiles = await Promise.all(
        (tutorProfiles || []).map(async (tutor) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, email, avatar_url")
            .eq("user_id", tutor.user_id)
            .single();

          return {
            ...tutor,
            profile,
          };
        })
      );

      setTutors(tutorsWithProfiles);
    } catch (error) {
      console.error("Error fetching tutors:", error);
    } finally {
      setLoadingTutors(false);
    }
  };

  const fetchTutorDetails = async (tutor: Tutor) => {
    setSelectedTutor(tutor);
    setLoadingDetails(true);

    try {
      // Fetch all messages where this tutor is sender or recipient
      const { data: messages, error: messagesError } = await supabase
        .from("messages")
        .select("*")
        .or(`sender_id.eq.${tutor.user_id},recipient_id.eq.${tutor.user_id}`)
        .order("created_at", { ascending: false })
        .limit(100);

      if (messagesError) throw messagesError;

      // Get unique user IDs from messages
      const userIds = new Set<string>();
      messages?.forEach((msg) => {
        userIds.add(msg.sender_id);
        userIds.add(msg.recipient_id);
      });

      // Fetch profiles for all users in messages
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, role")
        .in("user_id", Array.from(userIds));

      const profileMap = new Map(profiles?.map((p) => [p.user_id, p]));

      const messagesWithProfiles = messages?.map((msg) => ({
        ...msg,
        sender_profile: profileMap.get(msg.sender_id),
        recipient_profile: profileMap.get(msg.recipient_id),
      })) || [];

      setTutorMessages(messagesWithProfiles);

      // Fetch all sessions for this tutor
      const { data: sessions, error: sessionsError } = await supabase
        .from("sessions")
        .select("*")
        .eq("tutor_id", tutor.user_id)
        .order("scheduled_at", { ascending: false });

      if (sessionsError) throw sessionsError;

      // Get student profiles for sessions
      const studentIds = new Set(sessions?.map((s) => s.student_id) || []);
      const { data: studentProfiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", Array.from(studentIds));

      const studentMap = new Map(studentProfiles?.map((p) => [p.user_id, p]));

      const sessionsWithStudents = sessions?.map((session) => ({
        ...session,
        student_profile: studentMap.get(session.student_id),
      })) || [];

      setTutorSessions(sessionsWithStudents);
    } catch (error) {
      console.error("Error fetching tutor details:", error);
    } finally {
      setLoadingDetails(false);
    }
  };

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed":
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "pending":
      case "awaiting_payment":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case "cancelled":
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-display font-bold text-xl text-foreground">
                  Admin Monitoring
                </h1>
                <p className="text-xs text-muted-foreground">Monitor tutor activity</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Tutors List */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Registered Tutors
              </CardTitle>
              <CardDescription>
                {tutors.length} tutor{tutors.length !== 1 ? "s" : ""} registered
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingTutors ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : tutors.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No tutors registered yet
                </p>
              ) : (
                <ScrollArea className="h-[500px]">
                  <div className="space-y-2">
                    {tutors.map((tutor) => (
                      <button
                        key={tutor.user_id}
                        onClick={() => fetchTutorDetails(tutor)}
                        className={`w-full p-4 rounded-xl border transition-all text-left hover:bg-muted/50 ${
                          selectedTutor?.user_id === tutor.user_id
                            ? "border-primary bg-primary/5"
                            : "border-border"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={tutor.profile?.avatar_url || undefined} />
                            <AvatarFallback>
                              {tutor.profile?.full_name?.charAt(0) || "T"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground truncate">
                              {tutor.profile?.full_name || "Unknown Tutor"}
                            </p>
                            <p className="text-sm text-muted-foreground truncate">
                              {tutor.profile?.email}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary" className="text-xs">
                                {tutor.total_sessions || 0} sessions
                              </Badge>
                              {tutor.rating > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  ⭐ {tutor.rating.toFixed(1)}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-muted-foreground" />
                        </div>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          {/* Tutor Details */}
          <Card className="lg:col-span-2">
            {!selectedTutor ? (
              <div className="flex flex-col items-center justify-center h-full py-16">
                <Users className="w-16 h-16 text-muted-foreground mb-4" />
                <p className="text-lg font-medium text-muted-foreground">
                  Select a tutor to view details
                </p>
                <p className="text-sm text-muted-foreground">
                  Click on a tutor from the list to view their messages and sessions
                </p>
              </div>
            ) : loadingDetails ? (
              <div className="flex items-center justify-center h-full py-16">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <Avatar className="w-14 h-14">
                      <AvatarImage src={selectedTutor.profile?.avatar_url || undefined} />
                      <AvatarFallback className="text-lg">
                        {selectedTutor.profile?.full_name?.charAt(0) || "T"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle>{selectedTutor.profile?.full_name}</CardTitle>
                      <CardDescription>{selectedTutor.profile?.email}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="messages">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="messages" className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        Messages ({tutorMessages.length})
                      </TabsTrigger>
                      <TabsTrigger value="sessions" className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Sessions ({tutorSessions.length})
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="messages" className="mt-4">
                      <ScrollArea className="h-[400px]">
                        {tutorMessages.length === 0 ? (
                          <p className="text-center text-muted-foreground py-8">
                            No messages found
                          </p>
                        ) : (
                          <div className="space-y-3">
                            {tutorMessages.map((msg) => {
                              const isTutorSender = msg.sender_id === selectedTutor.user_id;
                              return (
                                <div
                                  key={msg.id}
                                  className="p-4 rounded-xl border border-border bg-muted/30"
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium text-sm">
                                        {isTutorSender
                                          ? selectedTutor.profile?.full_name
                                          : msg.sender_profile?.full_name || "Unknown"}
                                      </span>
                                      <span className="text-muted-foreground">→</span>
                                      <span className="font-medium text-sm">
                                        {!isTutorSender
                                          ? selectedTutor.profile?.full_name
                                          : msg.recipient_profile?.full_name || "Unknown"}
                                      </span>
                                    </div>
                                    <span className="text-xs text-muted-foreground">
                                      {new Date(msg.created_at).toLocaleString()}
                                    </span>
                                  </div>
                                  <p className="text-sm text-foreground">{msg.content}</p>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </ScrollArea>
                    </TabsContent>

                    <TabsContent value="sessions" className="mt-4">
                      <ScrollArea className="h-[400px]">
                        {tutorSessions.length === 0 ? (
                          <p className="text-center text-muted-foreground py-8">
                            No sessions found
                          </p>
                        ) : (
                          <div className="space-y-3">
                            {tutorSessions.map((session) => (
                              <div
                                key={session.id}
                                className="p-4 rounded-xl border border-border bg-muted/30"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{session.subject}</span>
                                    <Badge variant="outline" className="flex items-center gap-1">
                                      {getStatusIcon(session.status)}
                                      {session.status}
                                    </Badge>
                                  </div>
                                  <span className="text-sm text-muted-foreground">
                                    {session.duration_minutes} min
                                  </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-muted-foreground">
                                    Student: {session.student_profile?.full_name || "Unknown"}
                                  </span>
                                  <span className="text-muted-foreground">
                                    {new Date(session.scheduled_at).toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </ScrollArea>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Monitoring;
