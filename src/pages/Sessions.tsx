import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Sparkles, ArrowLeft, Calendar, Clock, User, Loader2, BookOpen, CheckCircle2, XCircle, CreditCard, MessageSquare, Pencil, Check, X, Video, ExternalLink, Ban, Globe } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Session {
  id: string;
  subject: string;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  notes: string | null;
  price: number | null;
  meeting_link: string | null;
  tutor_id: string;
  student_id: string;
  student_timezone_view: string | null;
  tutor_name?: string;
  student_name?: string;
  tutor_avatar?: string;
  student_avatar?: string;
}

const Sessions = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [userRole, setUserRole] = useState<"student" | "tutor" | null>(null);
  const [updatingSession, setUpdatingSession] = useState<string | null>(null);
  const [processingPayment, setProcessingPayment] = useState<string | null>(null);
  const [editingPrice, setEditingPrice] = useState<string | null>(null);
  const [newPrice, setNewPrice] = useState<string>("");
  const [editingMeetingLink, setEditingMeetingLink] = useState<string | null>(null);
  const [newMeetingLink, setNewMeetingLink] = useState<string>("");

  // Handle payment success/cancel from URL params
  useEffect(() => {
    const paymentStatus = searchParams.get("payment");
    const sessionId = searchParams.get("session_id");
    
    if (paymentStatus === "success" && sessionId) {
      // Update session status to confirmed after successful payment
      const updatePaymentStatus = async () => {
        try {
          await supabase
            .from("sessions")
            .update({ status: "confirmed" })
            .eq("id", sessionId);
          toast.success("Payment successful! Your session is confirmed.");
          // Clear the URL params
          navigate("/sessions", { replace: true });
        } catch (error) {
          console.error("Error updating session after payment:", error);
        }
      };
      updatePaymentStatus();
    } else if (paymentStatus === "cancelled") {
      toast.info("Payment was cancelled");
      navigate("/sessions", { replace: true });
    }
  }, [searchParams, navigate]);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchSessions = async () => {
      if (!user) return;

      try {
        // Get user role
        const { data: profileData } = await supabase
          .from("profiles")
          .select("role")
          .eq("user_id", user.id)
          .maybeSingle();

        setUserRole(profileData?.role || null);

        // Fetch sessions
        const { data: sessionsData, error } = await supabase
          .from("sessions")
          .select("*")
          .or(`student_id.eq.${user.id},tutor_id.eq.${user.id}`)
          .order("scheduled_at", { ascending: true });

        if (error) throw error;

        // Enrich with profile data using public_profiles view
        const enrichedSessions = await Promise.all(
          (sessionsData || []).map(async (session) => {
            const { data: tutorProfile } = await supabase
              .from("public_profiles")
              .select("full_name, avatar_url")
              .eq("user_id", session.tutor_id)
              .maybeSingle();

            const { data: studentProfile } = await supabase
              .from("public_profiles")
              .select("full_name, avatar_url")
              .eq("user_id", session.student_id)
              .maybeSingle();

            return {
              ...session,
              tutor_name: tutorProfile?.full_name,
              tutor_avatar: tutorProfile?.avatar_url,
              student_name: studentProfile?.full_name,
              student_avatar: studentProfile?.avatar_url,
            };
          })
        );

        setSessions(enrichedSessions);
      } catch (error) {
        console.error("Error fetching sessions:", error);
        toast.error("Failed to load sessions");
      } finally {
        setLoadingSessions(false);
      }
    };

    fetchSessions();
  }, [user]);

  const updateSessionStatus = async (sessionId: string, status: string) => {
    setUpdatingSession(sessionId);
    try {
      // If tutor is accepting, set status to awaiting_payment so student can pay
      const newStatus = status === "confirmed" ? "awaiting_payment" : status;
      
      const { error } = await supabase
        .from("sessions")
        .update({ status: newStatus })
        .eq("id", sessionId);

      if (error) throw error;

      setSessions((prev) =>
        prev.map((s) => (s.id === sessionId ? { ...s, status: newStatus } : s))
      );

      if (newStatus === "awaiting_payment") {
        toast.success("Session accepted! Waiting for student payment.");
      } else if (newStatus === "cancelled") {
        toast.success("Session cancelled successfully");
      } else {
        toast.success(`Session ${status}`);
      }
    } catch (error) {
      console.error("Error updating session:", error);
      toast.error("Failed to update session");
    } finally {
      setUpdatingSession(null);
    }
  };

  const handleCancelSession = async (sessionId: string) => {
    await updateSessionStatus(sessionId, "cancelled");
  };

  const handlePayment = async (session: Session) => {
    if (!user) return;
    
    setProcessingPayment(session.id);
    try {
      // Only send sessionId - server validates and fetches all details from DB
      const { data, error } = await supabase.functions.invoke("create-session-payment", {
        body: {
          sessionId: session.id,
        },
      });

      if (error) {
        // Handle specific error messages from server
        const errorMessage = error.message || "Failed to initiate payment";
        throw new Error(errorMessage);
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (data?.url) {
        // Use location.href instead of window.open to avoid popup blockers on mobile
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Error creating payment:", error);
      const message = error instanceof Error ? error.message : "Failed to initiate payment";
      toast.error(message);
    } finally {
      setProcessingPayment(null);
    }
  };

  const handleEditPrice = (session: Session) => {
    setEditingPrice(session.id);
    setNewPrice(session.price?.toString() || "0");
  };

  const handleSavePrice = async (sessionId: string) => {
    const priceValue = parseFloat(newPrice);
    if (isNaN(priceValue) || priceValue < 0.50) {
      toast.error("Price must be at least $0.50 (Stripe minimum)");
      return;
    }

    try {
      const { error } = await supabase
        .from("sessions")
        .update({ price: priceValue })
        .eq("id", sessionId);

      if (error) throw error;

      setSessions((prev) =>
        prev.map((s) => (s.id === sessionId ? { ...s, price: priceValue } : s))
      );
      toast.success("Price updated successfully");
    } catch (error) {
      console.error("Error updating price:", error);
      toast.error("Failed to update price");
    } finally {
      setEditingPrice(null);
      setNewPrice("");
    }
  };

  const handleEditMeetingLink = (session: Session) => {
    setEditingMeetingLink(session.id);
    setNewMeetingLink(session.meeting_link || "");
  };

  const handleSaveMeetingLink = async (sessionId: string) => {
    if (!newMeetingLink.trim()) {
      toast.error("Please enter a meeting link");
      return;
    }

    try {
      const session = sessions.find(s => s.id === sessionId);
      
      const { error } = await supabase
        .from("sessions")
        .update({ meeting_link: newMeetingLink.trim() })
        .eq("id", sessionId);

      if (error) throw error;

      setSessions((prev) =>
        prev.map((s) => (s.id === sessionId ? { ...s, meeting_link: newMeetingLink.trim() } : s))
      );

      // Notify the student about the meeting link
      if (session) {
        const { data: studentProfile } = await supabase
          .from("profiles")
          .select("email, full_name, phone_number")
          .eq("user_id", session.student_id)
          .single();

        const { data: tutorProfile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("user_id", session.tutor_id)
          .single();

        if (studentProfile?.email) {
          supabase.functions.invoke("send-notification", {
            body: {
              type: "meeting_link_sent",
              recipientEmail: studentProfile.email,
              recipientName: studentProfile.full_name,
              recipientPhone: studentProfile.phone_number,
              senderName: tutorProfile?.full_name || "Your tutor",
              subject: session.subject,
              sessionDate: new Date(session.scheduled_at).toLocaleString(),
              meetingLink: newMeetingLink.trim(),
            },
          }).catch(console.error);
        }
      }

      toast.success("Meeting link added successfully");
    } catch (error) {
      console.error("Error updating meeting link:", error);
      toast.error("Failed to update meeting link");
    } finally {
      setEditingMeetingLink(null);
      setNewMeetingLink("");
    }
  };

  const upcomingSessions = sessions.filter(
    (s) => s.status === "confirmed" || s.status === "pending" || s.status === "awaiting_payment"
  );
  const bookedSessions = sessions.filter((s) => s.status === "confirmed" && s.meeting_link);
  const pastSessions = sessions.filter(
    (s) => s.status === "completed" || s.status === "cancelled"
  );
  const unpaidSessionsCount = sessions.filter((s) => s.status === "awaiting_payment" && userRole === "student").length;

  if (loading || loadingSessions) {
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

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="font-display text-3xl font-bold text-foreground mb-8">
          My Sessions
        </h1>

        {/* Upcoming Sessions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              {userRole === "student" ? "My Sessions" : "Upcoming Sessions"}
              {userRole === "student" && unpaidSessionsCount > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs font-bold rounded-full bg-destructive text-destructive-foreground">
                  {unpaidSessionsCount} payment{unpaidSessionsCount !== 1 ? "s" : ""} pending
                </span>
              )}
            </CardTitle>
            <CardDescription>
              {userRole === "student" 
                ? "Sessions you need to pay for or have booked" 
                : "Your scheduled tutoring sessions"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingSessions.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">No upcoming sessions</p>
                {userRole === "student" && (
                  <Link to="/find-tutors">
                    <Button>Find a Tutor</Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingSessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border border-border"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center overflow-hidden">
                        {userRole === "student" ? (
                          session.tutor_avatar ? (
                            <img
                              src={session.tutor_avatar}
                              alt="Tutor"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="w-6 h-6 text-primary" />
                          )
                        ) : session.student_avatar ? (
                          <img
                            src={session.student_avatar}
                            alt="Student"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-6 h-6 text-primary" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {session.subject} with{" "}
                          {userRole === "student"
                            ? session.tutor_name
                            : session.student_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(session.scheduled_at).toLocaleDateString("en-US", {
                            weekday: "long",
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                          {" · "}
                          {session.duration_minutes} min
                        </p>
                        {/* Show timezone view for tutors on pending sessions */}
                        {userRole === "tutor" && session.student_timezone_view && session.status === "pending" && (
                          <p className="text-xs text-primary flex items-center gap-1 mt-1">
                            <Globe className="w-3 h-3" />
                            Student selected time viewing in {session.student_timezone_view}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {/* Tutor: Editable price for pending/awaiting_payment sessions */}
                      {userRole === "tutor" && (session.status === "pending" || session.status === "awaiting_payment") && (
                        editingPrice === session.id ? (
                          <div className="flex items-center gap-1">
                            <span className="text-sm">$</span>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={newPrice}
                              onChange={(e) => setNewPrice(e.target.value)}
                              className="w-20 h-8 text-sm"
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              onClick={() => handleSavePrice(session.id)}
                            >
                              <Check className="w-4 h-4 text-green-600" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              onClick={() => setEditingPrice(null)}
                            >
                              <X className="w-4 h-4 text-red-600" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="gap-1 text-muted-foreground"
                            onClick={() => handleEditPrice(session)}
                          >
                            <Pencil className="w-3 h-3" />
                            ${session.price?.toFixed(2)}
                          </Button>
                        )
                      )}
                      
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          session.status === "confirmed"
                            ? "bg-green-100 text-green-700"
                            : session.status === "awaiting_payment"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {session.status === "awaiting_payment" 
                          ? "Awaiting Payment" 
                          : session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                      </span>
                      
                      {/* Student: Pay button when awaiting payment */}
                      {userRole === "student" && session.status === "awaiting_payment" && (
                        <Button
                          size="sm"
                          onClick={() => handlePayment(session)}
                          disabled={processingPayment === session.id}
                          className="gap-1"
                        >
                          {processingPayment === session.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <CreditCard className="w-4 h-4" />
                              Pay ${session.price?.toFixed(2)}
                            </>
                          )}
                        </Button>
                      )}
                      
                      {/* Student: Join meeting button when confirmed and has meeting link */}
                      {userRole === "student" && session.status === "confirmed" && session.meeting_link && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1"
                          onClick={() => window.open(session.meeting_link!, "_blank")}
                        >
                          <Video className="w-4 h-4" />
                          Join Meeting
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      )}
                      
                      {/* Student: Message tutor button */}
                      {userRole === "student" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => navigate(`/messages?with=${session.tutor_id}`)}
                        >
                          <MessageSquare className="w-4 h-4" />
                        </Button>
                      )}
                      
                      {/* Tutor: Message student button */}
                      {userRole === "tutor" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => navigate(`/messages?with=${session.student_id}`)}
                        >
                          <MessageSquare className="w-4 h-4" />
                        </Button>
                      )}
                      
                      {/* Tutor: Add/Edit meeting link for confirmed sessions */}
                      {userRole === "tutor" && session.status === "confirmed" && (
                        editingMeetingLink === session.id ? (
                          <div className="flex items-center gap-1">
                            <Input
                              type="url"
                              placeholder="https://zoom.us/j/..."
                              value={newMeetingLink}
                              onChange={(e) => setNewMeetingLink(e.target.value)}
                              className="w-48 h-8 text-sm"
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              onClick={() => handleSaveMeetingLink(session.id)}
                            >
                              <Check className="w-4 h-4 text-green-600" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              onClick={() => setEditingMeetingLink(null)}
                            >
                              <X className="w-4 h-4 text-red-600" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant={session.meeting_link ? "ghost" : "outline"}
                            className="gap-1"
                            onClick={() => handleEditMeetingLink(session)}
                          >
                            <Video className="w-4 h-4" />
                            {session.meeting_link ? "Edit Link" : "Add Meeting Link"}
                          </Button>
                        )
                      )}
                      
                      {/* Tutor: Accept/Decline buttons for pending sessions */}
                      {userRole === "tutor" && session.status === "pending" && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateSessionStatus(session.id, "confirmed")}
                            disabled={updatingSession === session.id}
                          >
                            {updatingSession === session.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateSessionStatus(session.id, "cancelled")}
                            disabled={updatingSession === session.id}
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                      
                      {/* Cancel button for confirmed or awaiting_payment sessions - both roles */}
                      {(session.status === "confirmed" || session.status === "awaiting_payment") && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                              disabled={updatingSession === session.id}
                            >
                              {updatingSession === session.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  <Ban className="w-4 h-4" />
                                  Cancel
                                </>
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Cancel Session?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to cancel this {session.subject} session
                                {session.status === "confirmed" && " that has already been paid for"}?
                                {session.status === "confirmed" && " Refunds may need to be processed separately."}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Keep Session</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleCancelSession(session.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Yes, Cancel Session
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Booked Sessions - For students with meeting links */}
        {userRole === "student" && bookedSessions.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="w-5 h-5" />
                Booked Sessions
              </CardTitle>
              <CardDescription>
                Sessions ready to join with meeting links
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {bookedSessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-green-50 border border-green-200 dark:bg-green-950/30 dark:border-green-800"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900 flex items-center justify-center overflow-hidden">
                        {session.tutor_avatar ? (
                          <img
                            src={session.tutor_avatar}
                            alt="Tutor"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-6 h-6 text-green-600 dark:text-green-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {session.subject} with {session.tutor_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(session.scheduled_at).toLocaleDateString("en-US", {
                            weekday: "long",
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                          {" · "}
                          {session.duration_minutes} min
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => window.open(session.meeting_link!, "_blank")}
                      className="gap-2"
                    >
                      <Video className="w-4 h-4" />
                      Join Meeting
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Past Sessions
            </CardTitle>
            <CardDescription>
              Your completed tutoring sessions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pastSessions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No past sessions yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pastSessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {session.subject} with{" "}
                          {userRole === "student"
                            ? session.tutor_name
                            : session.student_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(session.scheduled_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        session.status === "completed"
                          ? "bg-green-100 text-green-700"
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
      </main>
    </div>
  );
};

export default Sessions;
