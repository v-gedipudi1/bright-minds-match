-- Add UPDATE policy for students to edit their own reviews
CREATE POLICY "Students can update their own reviews"
ON public.reviews
FOR UPDATE
USING (auth.uid() = student_id);

-- Add DELETE policy for students to delete their own reviews  
CREATE POLICY "Students can delete their own reviews"
ON public.reviews
FOR DELETE
USING (auth.uid() = student_id);