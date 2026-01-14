import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sparkles, ArrowLeft, Star, Clock, Calendar as CalendarIcon, Loader2, User, CheckCircle2, AlertCircle, MessageSquare } from "lucide-react";
import TutorReviews from "@/components/TutorReviews";
import { format, getDay } from "date-fns";
import { toast } from "sonner";
import { WeeklyAvailability } from "@/components/AvailabilityScheduler";
import { cn } from "@/lib/utils";

interface TimeSlot {
  start: string;
  end: string;
}

// Convert 24hr time to 12hr format
const formatTime12hr = (time24: string): string => {
  const [hours, minutes] = time24.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const hours12 = hours % 12 || 12;
  return `${hours12}:${String(minutes).padStart(2, "0")} ${period}`;
};

interface TutorInfo {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
  subjects: string[];
  hourly_rate: number;
  experience_years: number;
  education: string | null;
  teaching_style: string | null;
  rating: number;
  total_reviews: number;
  availability: WeeklyAvailability | null;
}

const BookSession = () => {
  const { tutorId } = useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  
  const [tutor, setTutor] = useState<TutorInfo | null>(null);
  const [loadingTutor, setLoadingTutor] = useState(true);
  const [booking, setBooking] = useState(false);
  const [booked, setBooked] = useState(false);
  
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState("");
  const [subject, setSubject] = useState("");
  const [notes, setNotes] = useState("");
  const [duration, setDuration] = useState("60");

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchTutor = async () => {
      if (!tutorId) return;

      try {
        const { data: tutorData, error: tutorError } = await supabase
          .from("tutor_profiles")
          .select("*")
          .eq("user_id", tutorId)
          .maybeSingle();

        if (tutorError) throw tutorError;

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("full_name, avatar_url, bio")
          .eq("user_id", tutorId)
          .maybeSingle();

        if (profileError) throw profileError;

        setTutor({
          user_id: tutorId,
          full_name: profileData?.full_name || "Tutor",
          avatar_url: profileData?.avatar_url || null,
          bio: profileData?.bio || null,
          subjects: tutorData?.subjects || [],
          hourly_rate: tutorData?.hourly_rate || 0,
          experience_years: tutorData?.experience_years || 0,
          education: tutorData?.education || null,
          teaching_style: tutorData?.teaching_style || null,
          rating: tutorData?.rating || 0,
          total_reviews: tutorData?.total_reviews || 0,
          availability: tutorData?.availability as unknown as WeeklyAvailability | null,
        });

        if (tutorData?.subjects?.length > 0) {
          setSubject(tutorData.subjects[0]);
        }
      } catch (error) {
        console.error("Error fetching tutor:", error);
        toast.error("Failed to load tutor profile");
      } finally {
        setLoadingTutor(false);
      }
    };

    fetchTutor();
  }, [tutorId]);

  // Get available time slots for the selected date
  const availableTimeSlots = useMemo(() => {
    if (!selectedDate || !tutor?.availability) return [];

    const dayOfWeek = getDay(selectedDate);
    const dayMap: Record<number, keyof WeeklyAvailability> = {
      0: "sunday",
      1: "monday",
      2: "tuesday",
      3: "wednesday",
      4: "thursday",
      5: "friday",
      6: "saturday",
    };

    const dayKey = dayMap[dayOfWeek];
    const dayAvailability = tutor.availability[dayKey];

    if (!dayAvailability?.enabled || !dayAvailability.slots?.length) {
      return [];
    }

    // Generate time slots from the tutor's availability
    const slots: string[] = [];
    dayAvailability.slots.forEach((slot: TimeSlot) => {
      const [startHour, startMin] = slot.start.split(":").map(Number);
      const [endHour, endMin] = slot.end.split(":").map(Number);
      
      let currentHour = startHour;
      let currentMin = startMin;

      while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
        const timeStr = `${String(currentHour).padStart(2, "0")}:${String(currentMin).padStart(2, "0")}`;
        slots.push(timeStr);
        currentMin += 30;
        if (currentMin >= 60) {
          currentMin = 0;
          currentHour++;
        }
      }
    });

    return slots;
  }, [selectedDate, tutor?.availability]);

  // Check if a date has availability
  const isDayAvailable = (date: Date): boolean => {
    if (!tutor?.availability) return true; // If no availability set, all days are available

    const dayOfWeek = getDay(date);
    const dayMap: Record<number, keyof WeeklyAvailability> = {
      0: "sunday",
      1: "monday",
      2: "tuesday",
      3: "wednesday",
      4: "thursday",
      5: "friday",
      6: "saturday",
    };

    const dayKey = dayMap[dayOfWeek];
    const dayAvailability = tutor.availability[dayKey];

    return dayAvailability?.enabled && dayAvailability.slots?.length > 0;
  };

  const handleBookSession = async () => {
    if (!user || !tutor || !selectedDate || !selectedTime || !subject) {
      toast.error("Please fill in all required fields");
      return;
    }

    setBooking(true);
    try {
      const [hours, minutes] = selectedTime.split(":");
      const scheduledAt = new Date(selectedDate);
      scheduledAt.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      const price = (tutor.hourly_rate * parseInt(duration)) / 60;

      const { error } = await supabase.from("sessions").insert({
        student_id: user.id,
        tutor_id: tutor.user_id,
        subject,
        scheduled_at: scheduledAt.toISOString(),
        duration_minutes: parseInt(duration),
        notes,
        price,
        status: "pending",
      });

      if (error) throw error;

      // Send email notification to tutor
      const { data: tutorProfile } = await supabase
        .from("profiles")
        .select("email, full_name")
        .eq("user_id", tutor.user_id)
        .single();

      const { data: studentProfile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", user.id)
        .single();

      if (tutorProfile?.email) {
        supabase.functions.invoke("send-notification", {
          body: {
            type: "session_booked",
            recipientEmail: tutorProfile.email,
            recipientName: tutorProfile.full_name,
            senderName: studentProfile?.full_name || "A student",
            subject,
            sessionDate: format(scheduledAt, "PPP 'at' p"),
          },
        }).catch(console.error);
      }

      setBooked(true);
      toast.success("Session booked successfully!");
    } catch (error) {
      console.error("Error booking session:", error);
      toast.error("Failed to book session");
    } finally {
      setBooking(false);
    }
  };

  if (loading || loadingTutor) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!tutor) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Tutor not found</p>
          <Link to="/find-tutors">
            <Button>Browse Tutors</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (booked) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center mb-6">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="font-display text-2xl font-bold text-foreground mb-2">
              Session Booked!
            </h2>
            <p className="text-muted-foreground mb-6">
              Your session with {tutor.full_name} has been requested. 
              You'll receive a confirmation once they accept.
            </p>
            <div className="flex gap-4">
              <Link to="/dashboard" className="flex-1">
                <Button variant="outline" className="w-full">Dashboard</Button>
              </Link>
              <Link to="/sessions" className="flex-1">
                <Button className="w-full">View Sessions</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
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
          <Link to="/find-tutors">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Tutors
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto grid lg:grid-cols-3 gap-8">
          {/* Tutor Profile */}
          <Card className="lg:col-span-1 h-fit">
            <CardContent className="p-6">
              <div className="text-center">
                <div className="w-24 h-24 mx-auto rounded-2xl bg-muted flex items-center justify-center overflow-hidden mb-4">
                  {tutor.avatar_url ? (
                    <img
                      src={tutor.avatar_url}
                      alt={tutor.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-12 h-12 text-muted-foreground" />
                  )}
                </div>
                <h2 className="font-display font-bold text-xl text-foreground mb-1">
                  {tutor.full_name}
                </h2>
                <div className="flex items-center justify-center gap-1 mb-4">
                  <Star className="w-4 h-4 text-primary fill-primary" />
                  <span className="font-semibold text-foreground">{tutor.rating}</span>
                  <span className="text-sm text-muted-foreground">
                    ({tutor.total_reviews} reviews)
                  </span>
                </div>

                <div className="flex flex-wrap justify-center gap-1 mb-4">
                  {tutor.subjects.slice(0, 3).map((subject, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 text-xs font-medium rounded-full bg-primary/10 text-primary"
                    >
                      {subject}
                    </span>
                  ))}
                </div>

                <div className="space-y-2 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center justify-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{tutor.experience_years}+ years experience</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <span className="font-display font-bold text-2xl text-foreground">
                    ${tutor.hourly_rate}
                  </span>
                  <span className="text-muted-foreground">/hr</span>
                </div>

                {tutor.bio && (
                  <p className="text-sm text-muted-foreground mt-4 text-left">
                    {tutor.bio}
                  </p>
                )}

                <Button
                  variant="outline"
                  className="w-full mt-4"
                  onClick={() => navigate(`/messages?with=${tutor.user_id}`)}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Message Tutor
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Booking Form */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Book a Session</CardTitle>
              <CardDescription>
                Choose a date, time, and subject for your tutoring session
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Recommendation to message first */}
              <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 dark:bg-blue-950/30 dark:border-blue-800">
                <div className="flex items-start gap-3">
                  <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                      Tip: Message the tutor first
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                      We recommend messaging {tutor.full_name} to discuss your learning goals and confirm availability before booking a session.
                    </p>
                  </div>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Select Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => {
                          setSelectedDate(date);
                          setSelectedTime(""); // Reset time when date changes
                        }}
                        disabled={(date) => date < new Date() || !isDayAvailable(date)}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Select Time</Label>
                  {!selectedDate ? (
                    <p className="text-sm text-muted-foreground py-2">
                      Please select a date first
                    </p>
                  ) : availableTimeSlots.length === 0 ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                      <AlertCircle className="w-4 h-4" />
                      <span>No available times on this date</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1">
                      {availableTimeSlots.map((time) => (
                        <Button
                          key={time}
                          type="button"
                          variant={selectedTime === time ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedTime(time)}
                          className={cn(
                            "text-xs",
                            selectedTime === time && "ring-2 ring-primary ring-offset-2"
                          )}
                        >
                          {formatTime12hr(time)}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <select
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="">Select a subject</option>
                    {tutor.subjects.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Duration</Label>
                  <select
                    id="duration"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="30">30 minutes</option>
                    <option value="60">1 hour</option>
                    <option value="90">1.5 hours</option>
                    <option value="120">2 hours</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes for the tutor (optional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="What topics would you like to cover? Any specific questions?"
                  rows={4}
                />
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="font-display font-bold text-2xl text-foreground">
                    ${((tutor.hourly_rate * parseInt(duration)) / 60).toFixed(2)}
                  </p>
                </div>
                <Button
                  onClick={handleBookSession}
                  disabled={booking || !selectedDate || !selectedTime || !subject}
                  size="lg"
                >
                  {booking ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Booking...
                    </>
                  ) : (
                    "Book Session"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Reviews Section */}
          <div className="lg:col-span-3">
            <TutorReviews tutorId={tutor.user_id} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default BookSession;
