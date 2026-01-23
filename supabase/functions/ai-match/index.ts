import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation helpers
const validateString = (value: unknown, fieldName: string, maxLength: number = 1000, truncate: boolean = false): string => {
  if (value === undefined || value === null) return "";
  if (typeof value !== 'string') {
    throw new Error(`${fieldName} must be a string`);
  }
  // Truncate if allowed and exceeds max length (useful for database data)
  if (value.length > maxLength) {
    if (truncate) {
      return value.substring(0, maxLength);
    }
    throw new Error(`${fieldName} must be less than ${maxLength} characters`);
  }
  return value;
};

const validateStringArray = (value: unknown, fieldName: string, maxItems: number = 50): string[] => {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) {
    throw new Error(`${fieldName} must be an array`);
  }
  if (value.length > maxItems) {
    throw new Error(`${fieldName} must have less than ${maxItems} items`);
  }
  return value.map((item, i) => {
    if (typeof item !== 'string') {
      throw new Error(`${fieldName}[${i}] must be a string`);
    }
    if (item.length > 200) {
      throw new Error(`${fieldName}[${i}] must be less than 200 characters`);
    }
    return item;
  });
};

const validateStudentProfile = (profile: unknown) => {
  if (!profile || typeof profile !== 'object') {
    throw new Error('studentProfile must be an object');
  }
  const p = profile as Record<string, unknown>;
  return {
    background: validateString(p.background, 'background', 500),
    personality: validateString(p.personality, 'personality', 500),
    learning_goals: validateString(p.learning_goals, 'learning_goals', 500),
    learning_style: validateString(p.learning_style, 'learning_style', 200),
    study_habits: validateString(p.study_habits, 'study_habits', 500),
    subjects_interested: validateStringArray(p.subjects_interested, 'subjects_interested', 20),
  };
};

const validateTutor = (tutor: unknown, index: number) => {
  if (!tutor || typeof tutor !== 'object') {
    throw new Error(`tutors[${index}] must be an object`);
  }
  const t = tutor as Record<string, unknown>;
  
  // Validate user_id is a valid UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (typeof t.user_id !== 'string' || !uuidRegex.test(t.user_id)) {
    throw new Error(`tutors[${index}].user_id must be a valid UUID`);
  }

  return {
    user_id: t.user_id,
    full_name: validateString(t.full_name, `tutors[${index}].full_name`, 100),
    subjects: validateStringArray(t.subjects, `tutors[${index}].subjects`, 20),
    experience_years: typeof t.experience_years === 'number' ? Math.min(Math.max(0, t.experience_years), 100) : 0,
    teaching_style: validateString(t.teaching_style, `tutors[${index}].teaching_style`, 500, true), // Truncate long teaching styles
    education: validateString(t.education, `tutors[${index}].education`, 500, true), // Truncate long education
    rating: typeof t.rating === 'number' ? Math.min(Math.max(0, t.rating), 5) : 0,
  };
};

const validateTutors = (tutors: unknown): ReturnType<typeof validateTutor>[] => {
  if (!Array.isArray(tutors)) {
    throw new Error('tutors must be an array');
  }
  if (tutors.length === 0) {
    throw new Error('tutors array cannot be empty');
  }
  if (tutors.length > 100) {
    throw new Error('tutors array must have less than 100 items');
  }
  return tutors.map((t, i) => validateTutor(t, i));
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing required environment variables");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Parse and validate input
    let requestBody;
    try {
      requestBody = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate inputs
    let studentProfile;
    let tutors;
    try {
      studentProfile = validateStudentProfile(requestBody.studentProfile);
      tutors = validateTutors(requestBody.tutors);
    } catch (validationError) {
      const errorMessage = validationError instanceof Error ? validationError.message : "Validation error";
      console.error("Input validation failed:", errorMessage);
      return new Response(
        JSON.stringify({ error: errorMessage }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Input validated successfully", { 
      studentProfileFields: Object.keys(studentProfile), 
      tutorCount: tutors.length 
    });

    const systemPrompt = `You are an AI tutor matching assistant for Bright Minds Match. Your task is to analyze a student's profile and match them with the best tutors based on compatibility.

Consider these factors when matching:
1. Learning style compatibility (visual, auditory, kinesthetic)
2. Subject expertise alignment
3. Teaching style preferences
4. Personality compatibility
5. Schedule availability
6. Educational goals alignment

For each tutor, provide:
- A match score from 0-100
- 2-3 specific reasons why they're a good match

Return your response as valid JSON in this exact format:
{
  "matches": [
    {
      "tutor_id": "uuid",
      "match_score": 85,
      "match_reasons": ["reason1", "reason2", "reason3"]
    }
  ]
}`;

    const userPrompt = `Student Profile:
- Background: ${studentProfile.background || "Not specified"}
- Personality: ${studentProfile.personality || "Not specified"}
- Learning Goals: ${studentProfile.learning_goals || "Not specified"}
- Learning Style: ${studentProfile.learning_style || "Not specified"}
- Study Habits: ${studentProfile.study_habits || "Not specified"}
- Subjects Interested: ${(studentProfile.subjects_interested || []).join(", ") || "Not specified"}

Available Tutors:
${tutors.map((t, i: number) => `
Tutor ${i + 1}:
- ID: ${t.user_id}
- Name: ${t.full_name}
- Subjects: ${(t.subjects || []).join(", ")}
- Experience: ${t.experience_years} years
- Teaching Style: ${t.teaching_style || "Not specified"}
- Education: ${t.education || "Not specified"}
- Rating: ${t.rating}/5
`).join("\n")}

Analyze the compatibility and return the top matches with scores and reasons.`;

    console.log("Calling Lovable AI for matching...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    console.log("AI Response received:", content);

    const matchResults = JSON.parse(content);

    return new Response(JSON.stringify(matchResults), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in ai-match function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
