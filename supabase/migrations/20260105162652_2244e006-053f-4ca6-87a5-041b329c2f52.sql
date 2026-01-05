-- Create class_enrollments table for tutor-student relationships
CREATE TABLE public.class_enrollments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL,
    tutor_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(student_id, tutor_id)
);

-- Enable Row Level Security
ALTER TABLE public.class_enrollments ENABLE ROW LEVEL SECURITY;

-- Students can view their own enrollments
CREATE POLICY "Students can view own enrollments" 
ON public.class_enrollments 
FOR SELECT 
USING (auth.uid() = student_id);

-- Tutors can view students enrolled in their class
CREATE POLICY "Tutors can view their enrolled students" 
ON public.class_enrollments 
FOR SELECT 
USING (auth.uid() = tutor_id);

-- Students can join a class (insert enrollment)
CREATE POLICY "Students can join classes" 
ON public.class_enrollments 
FOR INSERT 
WITH CHECK (auth.uid() = student_id);

-- Students can leave a class (delete enrollment)
CREATE POLICY "Students can leave classes" 
ON public.class_enrollments 
FOR DELETE 
USING (auth.uid() = student_id);

-- Add a column to sessions to track if it was created via class enrollment
-- Also add a group_session_id to link multiple student sessions together
ALTER TABLE public.sessions 
ADD COLUMN IF NOT EXISTS group_session_id UUID DEFAULT NULL,
ADD COLUMN IF NOT EXISTS is_class_session BOOLEAN DEFAULT false;