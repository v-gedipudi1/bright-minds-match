import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, CalendarPlus, Loader2, User } from "lucide-react";
import { toast } from "sonner";
import BookSessionForm from "@/components/BookSessionForm";

interface Student {
  id: string;
  student_id: string;
  student_name: string;
  student_avatar: string | null;
  created_at: string;
}

const MyStudents = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBookForm, setShowBookForm] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, [user]);

  const fetchStudents = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("class_enrollments")
        .select("*")
        .eq("tutor_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Enrich with student profile data
      const enriched = await Promise.all(
        (data || []).map(async (enrollment) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, avatar_url")
            .eq("user_id", enrollment.student_id)
            .maybeSingle();

          return {
            ...enrollment,
            student_name: profile?.full_name || "Unknown Student",
            student_avatar: profile?.avatar_url || null,
          };
        })
      );

      setStudents(enriched);
    } catch (error) {
      console.error("Error fetching students:", error);
      toast.error("Failed to load your students");
    } finally {
      setLoading(false);
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
              My Students
            </CardTitle>
            <CardDescription>Students enrolled in your class</CardDescription>
          </div>
          {students.length > 0 && (
            <Button onClick={() => setShowBookForm(true)} size="sm">
              <CalendarPlus className="w-4 h-4 mr-2" />
              Book a Session
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {students.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                No students have joined your class yet
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Share your profile with students so they can join your class
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {students.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border border-border"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center overflow-hidden">
                      {student.student_avatar ? (
                        <img
                          src={student.student_avatar}
                          alt={student.student_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-6 h-6 text-primary" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {student.student_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Joined {new Date(student.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Book Session Form Dialog */}
      <BookSessionForm
        open={showBookForm}
        onOpenChange={setShowBookForm}
        students={students.map((s) => ({
          id: s.student_id,
          name: s.student_name,
          avatar: s.student_avatar,
        }))}
        onSuccess={() => {
          setShowBookForm(false);
          toast.success("Session booked successfully! Students will be notified.");
        }}
      />
    </>
  );
};

export default MyStudents;
