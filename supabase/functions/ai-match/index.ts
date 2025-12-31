import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

    const { studentProfile, tutors } = await req.json();

    if (!studentProfile || !tutors || tutors.length === 0) {
      return new Response(
        JSON.stringify({ error: "Missing student profile or tutors data" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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
${tutors.map((t: any, i: number) => `
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
