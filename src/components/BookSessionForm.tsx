import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar as CalendarIcon, Loader2, User } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Student {
  id: string;
  name: string;
  avatar: string | null;
}

interface BookSessionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  students: Student[];
  onSuccess: () => void;
}

const BookSessionForm = ({ open, onOpenChange, students, onSuccess }: BookSessionFormProps) => {
  const { user } = useAuth();
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState("");
  const [duration, setDuration] = useState("60");
  const [totalPrice, setTotalPrice] = useState("");
  const [subject, setSubject] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleStudentToggle = (studentId: string) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const pricePerStudent = selectedStudents.length > 0 && totalPrice
    ? (parseFloat(totalPrice) / selectedStudents.length).toFixed(2)
    : "0.00";

  const handleSubmit = async () => {
    if (!user) return;

    if (selectedStudents.length === 0) {
      toast.error("Please select at least one student");
      return;
    }
    if (!selectedDate) {
      toast.error("Please select a date");
      return;
    }
    if (!selectedTime) {
      toast.error("Please select a time");
      return;
    }
    if (!totalPrice || parseFloat(totalPrice) < 0.50) {
      toast.error("Price must be at least $0.50");
      return;
    }
    if (!subject.trim()) {
      toast.error("Please enter a subject");
      return;
    }

    setSubmitting(true);
    try {
      const [hours, minutes] = selectedTime.split(":");
      const scheduledAt = new Date(selectedDate);
      scheduledAt.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      const pricePerStudentNum = parseFloat(totalPrice) / selectedStudents.length;
      const groupSessionId = crypto.randomUUID();

      // Create a session for each selected student
      const sessionsToInsert = selectedStudents.map((studentId) => ({
        student_id: studentId,
        tutor_id: user.id,
        subject: subject.trim(),
        scheduled_at: scheduledAt.toISOString(),
        duration_minutes: parseInt(duration),
        price: pricePerStudentNum,
        status: "awaiting_payment",
        group_session_id: selectedStudents.length > 1 ? groupSessionId : null,
        is_class_session: true,
      }));

      const { error } = await supabase.from("sessions").insert(sessionsToInsert);

      if (error) throw error;

      // Get tutor's name
      const { data: tutorProfile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", user.id)
        .single();

      // Send email and SMS notifications to each student
      for (const studentId of selectedStudents) {
        const { data: studentProfile } = await supabase
          .from("profiles")
          .select("email, full_name, phone_number")
          .eq("user_id", studentId)
          .single();

        if (studentProfile?.email) {
          supabase.functions.invoke("send-notification", {
            body: {
              type: "session_booked",
              recipientEmail: studentProfile.email,
              recipientName: studentProfile.full_name,
              recipientPhone: studentProfile.phone_number,
              senderName: tutorProfile?.full_name || "Your tutor",
              subject: subject.trim(),
              sessionDate: format(scheduledAt, "PPP 'at' p"),
            },
          }).catch(console.error);
        }
      }

      // Reset form
      setSelectedStudents([]);
      setSelectedDate(undefined);
      setSelectedTime("");
      setDuration("60");
      setTotalPrice("");
      setSubject("");

      onSuccess();
    } catch (error) {
      console.error("Error creating session:", error);
      toast.error("Failed to create session");
    } finally {
      setSubmitting(false);
    }
  };

  // Generate time slots
  const timeSlots = [];
  for (let hour = 6; hour <= 22; hour++) {
    for (let min of [0, 30]) {
      const time = `${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
      const period = hour >= 12 ? "PM" : "AM";
      const displayHour = hour % 12 || 12;
      const display = `${displayHour}:${String(min).padStart(2, "0")} ${period}`;
      timeSlots.push({ value: time, label: display });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Book a Session</DialogTitle>
          <DialogDescription>
            Schedule a tutoring session for your students. The price will be split evenly among selected students.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Student Selection */}
          <div className="space-y-3">
            <Label>Select Students</Label>
            <div className="space-y-2 max-h-40 overflow-y-auto border rounded-lg p-3">
              {students.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer"
                  onClick={() => handleStudentToggle(student.id)}
                >
                  <Checkbox
                    checked={selectedStudents.includes(student.id)}
                    onCheckedChange={() => handleStudentToggle(student.id)}
                  />
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center overflow-hidden">
                    {student.avatar ? (
                      <img
                        src={student.avatar}
                        alt={student.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-4 h-4 text-primary" />
                    )}
                  </div>
                  <span className="text-sm font-medium">{student.name}</span>
                </div>
              ))}
            </div>
            {selectedStudents.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {selectedStudents.length} student{selectedStudents.length !== 1 ? "s" : ""} selected
              </p>
            )}
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              placeholder="e.g., Math, Science, English"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Time</Label>
              <select
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Select time</option>
                {timeSlots.map((slot) => (
                  <option key={slot.value} value={slot.value}>
                    {slot.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label>Duration</Label>
            <select
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

          {/* Price */}
          <div className="space-y-2">
            <Label htmlFor="price">Total Price ($)</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0.50"
              placeholder="Enter total session price"
              value={totalPrice}
              onChange={(e) => setTotalPrice(e.target.value)}
            />
            {selectedStudents.length > 1 && totalPrice && (
              <p className="text-sm text-muted-foreground">
                Each student will pay: ${pricePerStudent}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={submitting || selectedStudents.length === 0}
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Booking...
              </>
            ) : (
              "Submit Session"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BookSessionForm;
