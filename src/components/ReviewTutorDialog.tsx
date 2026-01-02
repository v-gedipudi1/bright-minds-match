import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Star, Loader2, User } from "lucide-react";
import { toast } from "sonner";

interface TutorSession {
  tutor_id: string;
  tutor_name: string;
  tutor_avatar: string | null;
  session_id: string;
  subject: string;
  scheduled_at: string;
  has_review: boolean;
}

interface ReviewTutorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ReviewTutorDialog = ({ open, onOpenChange }: ReviewTutorDialogProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sessions, setSessions] = useState<TutorSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<string>("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  useEffect(() => {
    if (open && user) {
      fetchPaidSessions();
    }
  }, [open, user]);

  const fetchPaidSessions = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Get all paid/confirmed sessions for the student
      const { data: sessionsData, error: sessionsError } = await supabase
        .from("sessions")
        .select("id, tutor_id, subject, scheduled_at")
        .eq("student_id", user.id)
        .eq("status", "confirmed")
        .order("scheduled_at", { ascending: false });

      if (sessionsError) throw sessionsError;

      // Get existing reviews to check which sessions are already reviewed
      const { data: reviewsData } = await supabase
        .from("reviews")
        .select("session_id")
        .eq("student_id", user.id);

      const reviewedSessionIds = new Set(reviewsData?.map(r => r.session_id) || []);

      // Fetch tutor profiles for each unique tutor
      const uniqueTutorIds = [...new Set(sessionsData?.map(s => s.tutor_id) || [])];
      const tutorProfiles = new Map<string, { full_name: string; avatar_url: string | null }>();

      for (const tutorId of uniqueTutorIds) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("full_name, avatar_url")
          .eq("user_id", tutorId)
          .maybeSingle();

        tutorProfiles.set(tutorId, {
          full_name: profileData?.full_name || "Unknown Tutor",
          avatar_url: profileData?.avatar_url || null,
        });
      }

      const sessionsWithDetails: TutorSession[] = (sessionsData || []).map(session => ({
        tutor_id: session.tutor_id,
        tutor_name: tutorProfiles.get(session.tutor_id)?.full_name || "Unknown Tutor",
        tutor_avatar: tutorProfiles.get(session.tutor_id)?.avatar_url || null,
        session_id: session.id,
        subject: session.subject,
        scheduled_at: session.scheduled_at,
        has_review: reviewedSessionIds.has(session.id),
      }));

      setSessions(sessionsWithDetails);
    } catch (error) {
      console.error("Error fetching sessions:", error);
      toast.error("Failed to load sessions");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!user || !selectedSession) {
      toast.error("Please select a session to review");
      return;
    }

    const session = sessions.find(s => s.session_id === selectedSession);
    if (!session) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.from("reviews").insert({
        student_id: user.id,
        tutor_id: session.tutor_id,
        session_id: session.session_id,
        rating,
        comment: comment.trim() || null,
      });

      if (error) throw error;

      toast.success("Review submitted successfully!");
      onOpenChange(false);
      setSelectedSession("");
      setRating(5);
      setComment("");
    } catch (error) {
      console.error("Error submitting review:", error);
      toast.error("Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  const StarRating = ({ value, onChange }: { value: number; onChange: (val: number) => void }) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className="cursor-pointer hover:scale-110 transition-transform"
        >
          <Star
            className={`w-6 h-6 ${star <= value ? "text-primary fill-primary" : "text-muted-foreground"}`}
          />
        </button>
      ))}
    </div>
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const unreviewedSessions = sessions.filter(s => !s.has_review);
  const selectedSessionData = sessions.find(s => s.session_id === selectedSession);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Review a Tutor</DialogTitle>
          <DialogDescription>
            Leave a review for a tutor you've had a paid session with
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : unreviewedSessions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              {sessions.length === 0
                ? "You haven't completed any paid sessions yet."
                : "You've already reviewed all your completed sessions!"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Session</label>
              <Select value={selectedSession} onValueChange={setSelectedSession}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a session to review" />
                </SelectTrigger>
                <SelectContent>
                  {unreviewedSessions.map((session) => (
                    <SelectItem key={session.session_id} value={session.session_id}>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{session.tutor_name}</span>
                        <span className="text-muted-foreground">·</span>
                        <span className="text-muted-foreground">{session.subject}</span>
                        <span className="text-muted-foreground">·</span>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(session.scheduled_at)}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedSessionData && (
              <div className="p-3 bg-muted/50 rounded-lg flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden shrink-0">
                  {selectedSessionData.tutor_avatar ? (
                    <img
                      src={selectedSessionData.tutor_avatar}
                      alt={selectedSessionData.tutor_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-foreground">{selectedSessionData.tutor_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedSessionData.subject} · {formatDate(selectedSessionData.scheduled_at)}
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Rating</label>
              <StarRating value={rating} onChange={setRating} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Comment (optional)</label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience with this tutor..."
                rows={3}
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleSubmit}
                disabled={submitting || !selectedSession}
                className="flex-1"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Submit Review
              </Button>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ReviewTutorDialog;
