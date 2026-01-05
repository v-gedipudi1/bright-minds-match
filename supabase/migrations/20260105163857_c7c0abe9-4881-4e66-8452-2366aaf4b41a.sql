-- Add policy for tutors to create sessions for enrolled students
CREATE POLICY "Tutors can create sessions for their enrolled students"
ON sessions
FOR INSERT
WITH CHECK (
  auth.uid() = tutor_id
  AND EXISTS (
    SELECT 1 FROM class_enrollments
    WHERE class_enrollments.tutor_id = auth.uid()
    AND class_enrollments.student_id = sessions.student_id
  )
);