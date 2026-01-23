import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useFounderCheck } from "@/hooks/useFounderCheck";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  ArrowLeft, 
  Loader2, 
  Crown, 
  Users, 
  MessageSquare, 
  Calendar, 
  DollarSign,
  Save,
  Star,
  BookOpen,
  User
} from "lucide-react";
import { toast } from "sonner";

interface Tutor {
  user_id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  bio: string | null;
  phone_number: string | null;
}

interface TutorProfile {
  hourly_rate: number;
  experience_years: number;
  subjects: string[];
  teaching_style: string | null;
  education: string | null;
  rating: number;
  total_reviews: number;
  total_sessions: number;
  stripe_onboarding_complete: boolean;
}

interface Message {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  recipient_id: string;
  sender_name?: string;
  recipient_name?: string;
}

interface Session {
  id: string;
  subject: string;
  scheduled_at: string;
  status: string;
  student_id: string;
  student_name?: string;
  price: number;
}

interface Student {
  id: string;
  student_id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  created_at: string;
}

const TutorManagement = () => {
  const { user, loading: authLoading } = useAuth();
  const { isFounder, loading: founderLoading } = useFounderCheck();
  const navigate = useNavigate();
  
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [selectedTutor, setSelectedTutor] = useState<Tutor | null>(null);
  const [tutorProfile, setTutorProfile] = useState<TutorProfile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loadingTutors, setLoadingTutors] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [saving, setSaving] = useState(false);

  // Editable fields
  const [editFullName, setEditFullName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editRate, setEditRate] = useState("");
  const [editExperience, setEditExperience] = useState("");
  const [editSubjects, setEditSubjects] = useState("");
  const [editTeachingStyle, setEditTeachingStyle] = useState("");
  const [editEducation, setEditEducation] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!founderLoading && !isFounder && user) {
      toast.error("Access denied. Founder privileges required.");
      navigate("/dashboard");
    }
  }, [isFounder, founderLoading, user, navigate]);

  useEffect(() => {
    if (isFounder) {
      fetchTutors();
    }
  }, [isFounder]);

  const fetchTutors = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, full_name, email, avatar_url, bio, phone_number")
        .eq("role", "tutor")
        .order("full_name");

      if (error) throw error;
      setTutors(data || []);
    } catch (err) {
      console.error("Error fetching tutors:", err);
      toast.error("Failed to load tutors");
    } finally {
      setLoadingTutors(false);
    }
  };

  const selectTutor = async (tutor: Tutor) => {
    setSelectedTutor(tutor);
    setLoadingDetails(true);

    // Set editable fields
    setEditFullName(tutor.full_name || "");
    setEditBio(tutor.bio || "");
    setEditPhone(tutor.phone_number || "");

    try {
      // Fetch tutor profile
      const { data: profileData, error: profileError } = await supabase
        .from("tutor_profiles")
        .select("*")
        .eq("user_id", tutor.user_id)
        .maybeSingle();

      if (profileError) throw profileError;
      setTutorProfile(profileData);
      
      if (profileData) {
        setEditRate(profileData.hourly_rate?.toString() || "");
        setEditExperience(profileData.experience_years?.toString() || "");
        setEditSubjects(profileData.subjects?.join(", ") || "");
        setEditTeachingStyle(profileData.teaching_style || "");
        setEditEducation(profileData.education || "");
      }

      // Fetch messages
      const { data: messagesData, error: messagesError } = await supabase
        .from("messages")
        .select("*")
        .or(`sender_id.eq.${tutor.user_id},recipient_id.eq.${tutor.user_id}`)
        .order("created_at", { ascending: false })
        .limit(50);

      if (messagesError) throw messagesError;

      // Get profile names for messages
      const userIds = new Set<string>();
      messagesData?.forEach(m => {
        userIds.add(m.sender_id);
        userIds.add(m.recipient_id);
      });

      const { data: profilesData } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", Array.from(userIds));

      const profileMap = new Map(profilesData?.map(p => [p.user_id, p.full_name]) || []);

      const enrichedMessages = messagesData?.map(m => ({
        ...m,
        sender_name: profileMap.get(m.sender_id) || "Unknown",
        recipient_name: profileMap.get(m.recipient_id) || "Unknown",
      })) || [];

      setMessages(enrichedMessages);

      // Fetch sessions
      const { data: sessionsData, error: sessionsError } = await supabase
        .from("sessions")
        .select("*")
        .eq("tutor_id", tutor.user_id)
        .order("scheduled_at", { ascending: false })
        .limit(50);

      if (sessionsError) throw sessionsError;

      // Get student names
      const studentIds = new Set<string>(sessionsData?.map(s => s.student_id) || []);
      const { data: studentsData } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", Array.from(studentIds));

      const studentMap = new Map(studentsData?.map(s => [s.user_id, s.full_name]) || []);

      const enrichedSessions = sessionsData?.map(s => ({
        ...s,
        student_name: studentMap.get(s.student_id) || "Unknown",
      })) || [];

      setSessions(enrichedSessions);

      // Fetch enrolled students
      const { data: enrollmentsData, error: enrollmentsError } = await supabase
        .from("class_enrollments")
        .select("id, student_id, created_at")
        .eq("tutor_id", tutor.user_id);

      if (enrollmentsError) throw enrollmentsError;

      const enrolledStudentIds = enrollmentsData?.map(e => e.student_id) || [];
      const { data: enrolledStudentsData } = await supabase
        .from("profiles")
        .select("user_id, full_name, email, avatar_url")
        .in("user_id", enrolledStudentIds);

      const enrolledStudents = enrollmentsData?.map(e => {
        const profile = enrolledStudentsData?.find(p => p.user_id === e.student_id);
        return {
          id: e.id,
          student_id: e.student_id,
          full_name: profile?.full_name || "Unknown",
          email: profile?.email || "",
          avatar_url: profile?.avatar_url || null,
          created_at: e.created_at,
        };
      }) || [];

      setStudents(enrolledStudents);

    } catch (err) {
      console.error("Error fetching tutor details:", err);
      toast.error("Failed to load tutor details");
    } finally {
      setLoadingDetails(false);
    }
  };

  const saveChanges = async () => {
    if (!selectedTutor) return;
    setSaving(true);

    try {
      // Update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: editFullName,
          bio: editBio,
          phone_number: editPhone,
        })
        .eq("user_id", selectedTutor.user_id);

      if (profileError) throw profileError;

      // Update tutor profile
      const { error: tutorError } = await supabase
        .from("tutor_profiles")
        .update({
          hourly_rate: parseFloat(editRate) || 0,
          experience_years: parseInt(editExperience) || 0,
          subjects: editSubjects.split(",").map(s => s.trim()).filter(Boolean),
          teaching_style: editTeachingStyle || null,
          education: editEducation || null,
        })
        .eq("user_id", selectedTutor.user_id);

      if (tutorError) throw tutorError;

      toast.success("Tutor profile updated successfully!");
      
      // Refresh the tutor list
      await fetchTutors();
      
      // Update local state
      setSelectedTutor({
        ...selectedTutor,
        full_name: editFullName,
        bio: editBio,
        phone_number: editPhone,
      });

    } catch (err) {
      console.error("Error saving changes:", err);
      toast.error("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || founderLoading) {
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
          <div className="flex items-center gap-3">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <Crown className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h1 className="font-display font-bold text-lg text-foreground">Tutor Management</h1>
                <p className="text-xs text-muted-foreground">Founder Access</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Tutor List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="w-5 h-5" />
                All Tutors ({tutors.length})
              </CardTitle>
              <CardDescription>Select a tutor to manage</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                {loadingTutors ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {tutors.map((tutor) => (
                      <div
                        key={tutor.user_id}
                        onClick={() => selectTutor(tutor)}
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedTutor?.user_id === tutor.user_id
                            ? "bg-primary/10 border border-primary/30"
                            : "bg-muted/50 hover:bg-muted border border-transparent"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={tutor.avatar_url || undefined} />
                            <AvatarFallback>{tutor.full_name?.charAt(0) || "T"}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground truncate">{tutor.full_name}</p>
                            <p className="text-xs text-muted-foreground truncate">{tutor.email}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Tutor Details */}
          <div className="lg:col-span-2">
            {!selectedTutor ? (
              <Card className="h-[700px] flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Select a tutor from the list to view and edit their details</p>
                </div>
              </Card>
            ) : loadingDetails ? (
              <Card className="h-[700px] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </Card>
            ) : (
              <Card>
                <CardHeader className="border-b border-border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar className="w-14 h-14">
                        <AvatarImage src={selectedTutor.avatar_url || undefined} />
                        <AvatarFallback className="text-lg">{selectedTutor.full_name?.charAt(0) || "T"}</AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle>{selectedTutor.full_name}</CardTitle>
                        <CardDescription>{selectedTutor.email}</CardDescription>
                      </div>
                    </div>
                    <Button onClick={saveChanges} disabled={saving}>
                      {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                      Save Changes
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <Tabs defaultValue="profile">
                    <TabsList className="mb-4">
                      <TabsTrigger value="profile" className="gap-2">
                        <User className="w-4 h-4" /> Profile
                      </TabsTrigger>
                      <TabsTrigger value="messages" className="gap-2">
                        <MessageSquare className="w-4 h-4" /> Messages ({messages.length})
                      </TabsTrigger>
                      <TabsTrigger value="sessions" className="gap-2">
                        <Calendar className="w-4 h-4" /> Sessions ({sessions.length})
                      </TabsTrigger>
                      <TabsTrigger value="students" className="gap-2">
                        <BookOpen className="w-4 h-4" /> Students ({students.length})
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="profile">
                      <ScrollArea className="h-[500px] pr-4">
                        <div className="grid md:grid-cols-2 gap-4">
                          {/* Basic Info */}
                          <div className="space-y-4">
                            <h3 className="font-semibold text-foreground">Basic Information</h3>
                            <div className="space-y-2">
                              <Label htmlFor="fullName">Full Name</Label>
                              <Input 
                                id="fullName" 
                                value={editFullName} 
                                onChange={(e) => setEditFullName(e.target.value)} 
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="phone">Phone Number</Label>
                              <Input 
                                id="phone" 
                                value={editPhone} 
                                onChange={(e) => setEditPhone(e.target.value)} 
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="bio">Bio</Label>
                              <Textarea 
                                id="bio" 
                                value={editBio} 
                                onChange={(e) => setEditBio(e.target.value)} 
                                rows={3}
                              />
                            </div>
                          </div>

                          {/* Tutor Details */}
                          <div className="space-y-4">
                            <h3 className="font-semibold text-foreground">Tutor Details</h3>
                            <div className="space-y-2">
                              <Label htmlFor="rate">Hourly Rate ($)</Label>
                              <Input 
                                id="rate" 
                                type="number"
                                value={editRate} 
                                onChange={(e) => setEditRate(e.target.value)} 
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="experience">Years of Experience</Label>
                              <Input 
                                id="experience" 
                                type="number"
                                value={editExperience} 
                                onChange={(e) => setEditExperience(e.target.value)} 
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="subjects">Subjects (comma-separated)</Label>
                              <Input 
                                id="subjects" 
                                value={editSubjects} 
                                onChange={(e) => setEditSubjects(e.target.value)}
                                placeholder="Math, Physics, Chemistry" 
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="education">Education</Label>
                              <Input 
                                id="education" 
                                value={editEducation} 
                                onChange={(e) => setEditEducation(e.target.value)} 
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="teachingStyle">Teaching Style</Label>
                              <Textarea 
                                id="teachingStyle" 
                                value={editTeachingStyle} 
                                onChange={(e) => setEditTeachingStyle(e.target.value)} 
                                rows={2}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="mt-6 pt-4 border-t border-border">
                          <h3 className="font-semibold text-foreground mb-4">Statistics</h3>
                          <div className="grid grid-cols-3 gap-4">
                            <div className="p-4 rounded-lg bg-muted/50 text-center">
                              <Star className="w-5 h-5 mx-auto mb-2 text-amber-500" />
                              <p className="text-2xl font-bold text-foreground">{tutorProfile?.rating?.toFixed(1) || "0.0"}</p>
                              <p className="text-xs text-muted-foreground">Rating</p>
                            </div>
                            <div className="p-4 rounded-lg bg-muted/50 text-center">
                              <MessageSquare className="w-5 h-5 mx-auto mb-2 text-primary" />
                              <p className="text-2xl font-bold text-foreground">{tutorProfile?.total_reviews || 0}</p>
                              <p className="text-xs text-muted-foreground">Reviews</p>
                            </div>
                            <div className="p-4 rounded-lg bg-muted/50 text-center">
                              <Calendar className="w-5 h-5 mx-auto mb-2 text-secondary" />
                              <p className="text-2xl font-bold text-foreground">{tutorProfile?.total_sessions || 0}</p>
                              <p className="text-xs text-muted-foreground">Sessions</p>
                            </div>
                          </div>
                          <div className="mt-4 p-3 rounded-lg bg-muted/30">
                            <p className="text-sm text-muted-foreground">
                              Stripe Connected: {tutorProfile?.stripe_onboarding_complete ? (
                                <span className="text-green-600 font-medium">Yes</span>
                              ) : (
                                <span className="text-yellow-600 font-medium">No</span>
                              )}
                            </p>
                          </div>
                        </div>
                      </ScrollArea>
                    </TabsContent>

                    <TabsContent value="messages">
                      <ScrollArea className="h-[500px]">
                        {messages.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>No messages found</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {messages.map((msg) => (
                              <div key={msg.id} className="p-3 rounded-lg bg-muted/50 border border-border">
                                <div className="flex justify-between mb-2">
                                  <p className="text-sm font-medium text-foreground">
                                    {msg.sender_id === selectedTutor.user_id ? (
                                      <span className="text-primary">{msg.sender_name} (Tutor)</span>
                                    ) : (
                                      msg.sender_name
                                    )}
                                    {" → "}
                                    {msg.recipient_id === selectedTutor.user_id ? (
                                      <span className="text-primary">{msg.recipient_name} (Tutor)</span>
                                    ) : (
                                      msg.recipient_name
                                    )}
                                  </p>
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(msg.created_at).toLocaleString()}
                                  </span>
                                </div>
                                <p className="text-sm text-foreground">{msg.content}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </ScrollArea>
                    </TabsContent>

                    <TabsContent value="sessions">
                      <ScrollArea className="h-[500px]">
                        {sessions.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>No sessions found</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {sessions.map((session) => (
                              <div key={session.id} className="p-3 rounded-lg bg-muted/50 border border-border">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="font-medium text-foreground">{session.subject}</p>
                                    <p className="text-sm text-muted-foreground">
                                      Student: {session.student_name}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      {new Date(session.scheduled_at).toLocaleString()}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      session.status === "confirmed" ? "bg-green-100 text-green-700" :
                                      session.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                                      session.status === "completed" ? "bg-blue-100 text-blue-700" :
                                      "bg-muted text-muted-foreground"
                                    }`}>
                                      {session.status}
                                    </span>
                                    {session.price && (
                                      <p className="text-sm font-medium text-foreground mt-1">
                                        ${session.price}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </ScrollArea>
                    </TabsContent>

                    <TabsContent value="students">
                      <ScrollArea className="h-[500px]">
                        {students.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>No enrolled students</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {students.map((student) => (
                              <div key={student.id} className="p-3 rounded-lg bg-muted/50 border border-border">
                                <div className="flex items-center gap-3">
                                  <Avatar className="w-10 h-10">
                                    <AvatarImage src={student.avatar_url || undefined} />
                                    <AvatarFallback>{student.full_name?.charAt(0) || "S"}</AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium text-foreground">{student.full_name}</p>
                                    <p className="text-sm text-muted-foreground">{student.email}</p>
                                    <p className="text-xs text-muted-foreground">
                                      Enrolled: {new Date(student.created_at).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </ScrollArea>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default TutorManagement;
