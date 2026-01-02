import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, User, Loader2, Pencil, Trash2, X, Check } from "lucide-react";
import { toast } from "sonner";

interface Review {
  id: string;
  student_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  student_name: string;
  student_avatar: string | null;
}

interface TutorReviewsProps {
  tutorId: string;
}

const TutorReviews = ({ tutorId }: TutorReviewsProps) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [userHasSession, setUserHasSession] = useState(false);
  const [userReview, setUserReview] = useState<Review | null>(null);
  
  // New review form state
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  
  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState("");

  useEffect(() => {
    fetchReviews();
    if (user) {
      checkUserSession();
    }
  }, [tutorId, user]);

  const fetchReviews = async () => {
    try {
      const { data: reviewsData, error } = await supabase
        .from("reviews")
        .select("id, student_id, rating, comment, created_at")
        .eq("tutor_id", tutorId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch student profiles for each review from profiles table
      const reviewsWithProfiles = await Promise.all(
        (reviewsData || []).map(async (review) => {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("full_name, avatar_url")
            .eq("user_id", review.student_id)
            .maybeSingle();

          return {
            ...review,
            student_name: profileData?.full_name || "Anonymous Student",
            student_avatar: profileData?.avatar_url || null,
          };
        })
      );

      setReviews(reviewsWithProfiles);
      
      // Check if current user has a review
      if (user) {
        const existingReview = reviewsWithProfiles.find(r => r.student_id === user.id);
        setUserReview(existingReview || null);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkUserSession = async () => {
    if (!user) return;
    
    try {
      const { data } = await supabase
        .from("sessions")
        .select("id")
        .eq("student_id", user.id)
        .eq("tutor_id", tutorId)
        .eq("status", "confirmed")
        .limit(1);

      setUserHasSession((data?.length || 0) > 0);
    } catch (error) {
      console.error("Error checking user sessions:", error);
    }
  };

  const handleSubmitReview = async () => {
    if (!user) {
      toast.error("Please sign in to leave a review");
      return;
    }

    if (!userHasSession) {
      toast.error("You can only review tutors you've had paid sessions with");
      return;
    }

    setSubmitting(true);
    try {
      // Get a session to link the review to
      const { data: sessionData } = await supabase
        .from("sessions")
        .select("id")
        .eq("student_id", user.id)
        .eq("tutor_id", tutorId)
        .eq("status", "confirmed")
        .limit(1)
        .single();

      if (!sessionData) {
        toast.error("No paid session found");
        return;
      }

      const { error } = await supabase.from("reviews").insert({
        student_id: user.id,
        tutor_id: tutorId,
        session_id: sessionData.id,
        rating,
        comment: comment.trim() || null,
      });

      if (error) throw error;

      toast.success("Review submitted successfully!");
      setShowForm(false);
      setRating(5);
      setComment("");
      fetchReviews();
    } catch (error) {
      console.error("Error submitting review:", error);
      toast.error("Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateReview = async (reviewId: string) => {
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("reviews")
        .update({
          rating: editRating,
          comment: editComment.trim() || null,
        })
        .eq("id", reviewId);

      if (error) throw error;

      toast.success("Review updated!");
      setEditingId(null);
      fetchReviews();
    } catch (error) {
      console.error("Error updating review:", error);
      toast.error("Failed to update review");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm("Are you sure you want to delete your review?")) return;

    try {
      const { error } = await supabase
        .from("reviews")
        .delete()
        .eq("id", reviewId);

      if (error) throw error;

      toast.success("Review deleted");
      fetchReviews();
    } catch (error) {
      console.error("Error deleting review:", error);
      toast.error("Failed to delete review");
    }
  };

  const startEdit = (review: Review) => {
    setEditingId(review.id);
    setEditRating(review.rating);
    setEditComment(review.comment || "");
  };

  const StarRating = ({ value, onChange, readonly = false }: { value: number; onChange?: (val: number) => void; readonly?: boolean }) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          className={`${readonly ? "cursor-default" : "cursor-pointer hover:scale-110"} transition-transform`}
        >
          <Star
            className={`w-5 h-5 ${star <= value ? "text-primary fill-primary" : "text-muted-foreground"}`}
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

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Reviews</CardTitle>
        {user && userHasSession && !userReview && !showForm && (
          <Button size="sm" onClick={() => setShowForm(true)}>
            Write a Review
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* New Review Form */}
        {showForm && (
          <div className="p-4 border border-border rounded-lg bg-muted/50 space-y-4">
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
            <div className="flex gap-2">
              <Button onClick={handleSubmitReview} disabled={submitting}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Submit Review
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Reviews List */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : reviews.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No reviews yet. Be the first to leave a review!
          </p>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="p-4 border border-border rounded-lg">
                {editingId === review.id ? (
                  // Edit Mode
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Rating</label>
                      <StarRating value={editRating} onChange={setEditRating} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Comment</label>
                      <Textarea
                        value={editComment}
                        onChange={(e) => setEditComment(e.target.value)}
                        rows={3}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleUpdateReview(review.id)} disabled={submitting}>
                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        <span className="ml-1">Save</span>
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                        <X className="w-4 h-4" />
                        <span className="ml-1">Cancel</span>
                      </Button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden shrink-0">
                        {review.student_avatar ? (
                          <img
                            src={review.student_avatar}
                            alt={review.student_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-semibold text-foreground">{review.student_name}</h4>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(review.created_at)}
                          </span>
                        </div>
                        <StarRating value={review.rating} readonly />
                        {review.comment && (
                          <p className="mt-2 text-sm text-muted-foreground">{review.comment}</p>
                        )}
                      </div>
                    </div>
                    {user?.id === review.student_id && (
                      <div className="flex gap-2 mt-3 pt-3 border-t border-border">
                        <Button size="sm" variant="outline" onClick={() => startEdit(review)}>
                          <Pencil className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDeleteReview(review.id)}>
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TutorReviews;