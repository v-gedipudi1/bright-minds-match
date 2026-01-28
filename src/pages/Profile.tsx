import { useEffect, useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, ArrowLeft, Camera, Loader2, Save, User, Star } from "lucide-react";
import DeleteAccountSection from "@/components/DeleteAccountSection";
import ReviewTutorDialog from "@/components/ReviewTutorDialog";
import StripeConnectSection from "@/components/StripeConnectSection";
import { toast } from "sonner";
import AvailabilityScheduler, { WeeklyAvailability, getDefaultAvailability } from "@/components/AvailabilityScheduler";

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  role: "student" | "tutor";
  avatar_url: string | null;
  bio: string | null;
  phone_number: string | null;
}

interface TutorProfile {
  subjects: string[];
  hourly_rate: number;
  experience_years: number;
  education: string | null;
  teaching_style: string | null;
  availability: WeeklyAvailability | null;
  timezone: string | null;
}

interface StudentProfile {
  learning_goals: string | null;
  subjects_interested: string[];
  learning_style: string | null;
  personality: string | null;
  background: string | null;
  study_habits: string | null;
}

const Profile = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tutorProfile, setTutorProfile] = useState<TutorProfile | null>(null);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);

  // Form state
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [subjects, setSubjects] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [experienceYears, setExperienceYears] = useState("");
  const [education, setEducation] = useState("");
  const [teachingStyle, setTeachingStyle] = useState("");
  const [availability, setAvailability] = useState<WeeklyAvailability>(getDefaultAvailability());
  const [timezone, setTimezone] = useState("America/New_York");
  const [learningGoals, setLearningGoals] = useState("");
  const [learningStyle, setLearningStyle] = useState("");
  const [personality, setPersonality] = useState("");
  const [background, setBackground] = useState("");
  const [studyHabits, setStudyHabits] = useState("");
  const [subjectsInterested, setSubjectsInterested] = useState("");

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      try {
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (profileError) throw profileError;
        setProfile(profileData);
        setFullName(profileData?.full_name || "");
        setBio(profileData?.bio || "");
        setPhoneNumber(profileData?.phone_number || "");

        if (profileData?.role === "tutor") {
          const { data: tutorData, error: tutorError } = await supabase
            .from("tutor_profiles")
            .select("*")
            .eq("user_id", user.id)
            .maybeSingle();

          if (tutorError) throw tutorError;
          setTutorProfile(tutorData ? {
            subjects: tutorData.subjects || [],
            hourly_rate: tutorData.hourly_rate || 0,
            experience_years: tutorData.experience_years || 0,
            education: tutorData.education,
            teaching_style: tutorData.teaching_style,
            availability: tutorData.availability as unknown as WeeklyAvailability | null,
            timezone: tutorData.timezone,
          } : null);
          setSubjects((tutorData?.subjects || []).join(", "));
          setHourlyRate(String(tutorData?.hourly_rate || ""));
          setExperienceYears(String(tutorData?.experience_years || ""));
          setEducation(tutorData?.education || "");
          setTeachingStyle(tutorData?.teaching_style || "");
          // Load availability or use default
          const savedAvailability = tutorData?.availability as unknown as WeeklyAvailability | null;
          setAvailability(savedAvailability || getDefaultAvailability());
          // Load timezone
          setTimezone(tutorData?.timezone || "America/Los_Angeles");
        } else {
          const { data: studentData, error: studentError } = await supabase
            .from("student_profiles")
            .select("*")
            .eq("user_id", user.id)
            .maybeSingle();

          if (studentError) throw studentError;
          setStudentProfile(studentData);
          setLearningGoals(studentData?.learning_goals || "");
          setLearningStyle(studentData?.learning_style || "");
          setPersonality(studentData?.personality || "");
          setBackground(studentData?.background || "");
          setStudyHabits(studentData?.study_habits || "");
          setSubjectsInterested((studentData?.subjects_interested || []).join(", "));
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        toast.error("Failed to load profile");
      } finally {
        setLoadingData(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${user.id}/${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: urlData.publicUrl })
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      setProfile((prev) => prev ? { ...prev, avatar_url: urlData.publicUrl } : null);
      toast.success("Profile picture updated!");
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast.error("Failed to upload profile picture");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      // Update main profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ full_name: fullName, bio, phone_number: phoneNumber || null })
        .eq("user_id", user.id);

      if (profileError) throw profileError;

      if (profile?.role === "tutor") {
        const { error: tutorError } = await supabase
          .from("tutor_profiles")
          .update({
            subjects: subjects.split(",").map((s) => s.trim()).filter(Boolean),
            hourly_rate: parseFloat(hourlyRate) || 0,
            experience_years: parseInt(experienceYears) || 0,
            education,
            teaching_style: teachingStyle,
            availability: JSON.parse(JSON.stringify(availability)),
            timezone,
          })
          .eq("user_id", user.id);

        if (tutorError) throw tutorError;
      } else {
        const { error: studentError } = await supabase
          .from("student_profiles")
          .update({
            learning_goals: learningGoals,
            learning_style: learningStyle,
            personality,
            background,
            study_habits: studyHabits,
            subjects_interested: subjectsInterested.split(",").map((s) => s.trim()).filter(Boolean),
          })
          .eq("user_id", user.id);

        if (studentError) throw studentError;
      }

      toast.success("Profile saved successfully!");
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading || loadingData) {
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

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <h1 className="font-display text-3xl font-bold text-foreground mb-8">
          Edit Profile
        </h1>

        {/* Avatar Section */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-2xl bg-muted flex items-center justify-center overflow-hidden">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-12 h-12 text-muted-foreground" />
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-medium hover:bg-primary/90 transition-colors"
                >
                  {uploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4" />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{profile?.full_name}</h3>
                <p className="text-sm text-muted-foreground">{profile?.email}</p>
                <p className="text-xs text-primary mt-1 capitalize">{profile?.role}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Basic Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Your public profile details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about yourself..."
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input
                id="phoneNumber"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+1 (555) 123-4567"
              />
              <p className="text-xs text-muted-foreground">
                Used for SMS notifications about messages and session updates
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Role-specific fields */}
        {profile?.role === "tutor" ? (
          <>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Tutor Details</CardTitle>
                <CardDescription>Information for students to find you</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="subjects">Subjects (comma-separated)</Label>
                  <Input
                    id="subjects"
                    value={subjects}
                    onChange={(e) => setSubjects(e.target.value)}
                    placeholder="Mathematics, Physics, Chemistry"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="hourlyRate">Hourly Rate ($)</Label>
                    <Input
                      id="hourlyRate"
                      type="number"
                      value={hourlyRate}
                      onChange={(e) => setHourlyRate(e.target.value)}
                      placeholder="50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="experienceYears">Years of Experience</Label>
                    <Input
                      id="experienceYears"
                      type="number"
                      value={experienceYears}
                      onChange={(e) => setExperienceYears(e.target.value)}
                      placeholder="5"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="education">Education</Label>
                  <Input
                    id="education"
                    value={education}
                    onChange={(e) => setEducation(e.target.value)}
                    placeholder="Ph.D. in Mathematics from MIT"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="teachingStyle">Teaching Style</Label>
                  <Textarea
                    id="teachingStyle"
                    value={teachingStyle}
                    onChange={(e) => setTeachingStyle(e.target.value)}
                    placeholder="Describe your teaching approach..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="mb-6">
              <AvailabilityScheduler 
                availability={availability} 
                onChange={setAvailability}
                timezone={timezone}
                onTimezoneChange={setTimezone}
              />
            </div>

            {/* Stripe Connect for Payments */}
            <div className="mb-6">
              <StripeConnectSection />
            </div>
          </>
        ) : (
          <>
            {/* Review a Tutor Card */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Star className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Review a Tutor</h3>
                      <p className="text-sm text-muted-foreground">
                        Share your experience with tutors you've worked with
                      </p>
                    </div>
                  </div>
                  <Button onClick={() => setShowReviewDialog(true)}>
                    Write Review
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Learning Profile</CardTitle>
                <CardDescription>Help us find the perfect tutor for you</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="subjectsInterested">Subjects Interested (comma-separated)</Label>
                  <Input
                    id="subjectsInterested"
                    value={subjectsInterested}
                    onChange={(e) => setSubjectsInterested(e.target.value)}
                    placeholder="Mathematics, Physics, Programming"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="learningGoals">Learning Goals</Label>
                  <Textarea
                    id="learningGoals"
                    value={learningGoals}
                    onChange={(e) => setLearningGoals(e.target.value)}
                    placeholder="What do you want to achieve?"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="learningStyle">Learning Style</Label>
                  <Input
                    id="learningStyle"
                    value={learningStyle}
                    onChange={(e) => setLearningStyle(e.target.value)}
                    placeholder="Visual, auditory, hands-on, reading/writing..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="background">Background</Label>
                  <Textarea
                    id="background"
                    value={background}
                    onChange={(e) => setBackground(e.target.value)}
                    placeholder="Tell us about your educational background..."
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="personality">Personality</Label>
                  <Textarea
                    id="personality"
                    value={personality}
                    onChange={(e) => setPersonality(e.target.value)}
                    placeholder="Describe your personality and how you prefer to interact..."
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="studyHabits">Study Habits</Label>
                  <Textarea
                    id="studyHabits"
                    value={studyHabits}
                    onChange={(e) => setStudyHabits(e.target.value)}
                    placeholder="When and how do you prefer to study?"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            <ReviewTutorDialog open={showReviewDialog} onOpenChange={setShowReviewDialog} />
          </>
        )}

        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Profile
            </>
          )}
        </Button>

        {/* Delete Account Section */}
        {profile?.role && (
          <div className="mt-8">
            <DeleteAccountSection role={profile.role} />
          </div>
        )}
      </main>
    </div>
  );
};

export default Profile;
