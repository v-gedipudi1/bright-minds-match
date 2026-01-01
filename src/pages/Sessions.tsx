import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Sparkles, ArrowLeft, Calendar, Clock, User, Loader2, BookOpen, CheckCircle2, XCircle, CreditCard, MessageSquare, Pencil, Check, X } from "lucide-react";
import { toast } from "sonner";

interface Session {
  id: string;
  subject: string;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  notes: string | null;
  price: number | null;
  tutor_id: string;
  student_id: string;
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

        // Enrich with profile data
        const enrichedSessions = await Promise.all(
          (sessionsData || []).map(async (session) => {
            const { data: tutorProfile } = await supabase
              .from("profiles")
              .select("full_name, avatar_url")
              .eq("user_id", session.tutor_id)
              .maybeSingle();

            const { data: studentProfile } = await supabase
              .from("profiles")
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

  const handlePayment = async (session: Session) => {
    if (!user) return;
    
    // Stripe requires minimum $0.50 USD
    if (!session.price || session.price < 0.50) {
      toast.error("Payment amount must be at least $0.50 (Stripe minimum)");
      return;
    }
    
    setProcessingPayment(session.id);
    try {
      const { data, error } = await supabase.functions.invoke("create-session-payment", {
        body: {
          sessionId: session.id,
          amount: session.price,
          tutorName: session.tutor_name,
          subject: session.subject,
          duration: session.duration_minutes,
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error) {
      console.error("Error creating payment:", error);
      toast.error("Failed to initiate payment");
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

  const upcomingSessions = sessions.filter(
    (s) => s.status === "confirmed" || s.status === "pending" || s.status === "awaiting_payment"
  );
  const pastSessions = sessions.filter(
    (s) => s.status === "completed" || s.status === "cancelled"
  );

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
              Upcoming Sessions
            </CardTitle>
            <CardDescription>
              Your scheduled tutoring sessions
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
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Past Sessions */}
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
