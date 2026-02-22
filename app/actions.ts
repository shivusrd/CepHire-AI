"use server";

import pdf from "pdf-parse-fork";
import mammoth from "mammoth";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from "@/lib/supabase";
import { auth } from "@clerk/nextjs/server";

const genAI = new GoogleGenerativeAI(
  process.env.NEXT_PUBLIC_GEMINI_API_KEY || ""
);

export async function processResume(formData: FormData) {
  try {
    // ✅ Check user
    const { userId } = await auth();
    if (!userId) return { error: "Please sign in." };

    // ✅ Get uploaded file
    const file = formData.get("resume") as File;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let extractedText = "";

    // ✅ Extract text from PDF or DOCX
    if (file.type === "application/pdf") {
      const data = await pdf(buffer);
      extractedText = data.text;
    } else {
      const data = await mammoth.extractRawText({ buffer });
      extractedText = data.value;
    }

    // ✅ Extract email & phone
    const emailRegex =
      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    const phoneRegex = /(\+?\d{1,3}[- ]?)?\d{10,12}/;

    const email = extractedText.match(emailRegex)?.[0] || "Not Found";
    const phone = extractedText.match(phoneRegex)?.[0] || "Not Found";

    // =====================================================
    // ✅ AI RESUME ANALYSIS (INDUSTRY LEVEL PROMPT)
    // =====================================================

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });

    const prompt = `
You are a senior technical recruiter.

Analyze this resume and return STRICT JSON ONLY.

Resume:
${extractedText}
Return format:
{
  "skills": "comma separated technical skills",
  "experience": "short professional summary (2 lines)",
  "focus_areas": "topics interviewer should focus on",
  "seniority": "Junior | Mid | Senior"
}

Determine seniority using experience:
0-2 years → Junior
3-6 years → Mid
7+ years → Senior
`;

    const result = await model.generateContent(prompt);

    const aiText = result.response.text();

    // ✅ Safe JSON parsing
    let parsed: any = {};
    try {
      parsed = JSON.parse(aiText);
    } catch {
      parsed = {
        skills: "",
        experience: "",
        focus_areas: "",
      };
    }

    const extractedSkills = parsed.skills || "";
    const extractedExperience = parsed.experience || "";
    const focusAreas = parsed.focus_areas || "";
    const seniority = parsed.seniority || "Mid";

    // =====================================================
    // ✅ SAVE CANDIDATE IN SUPABASE
    // =====================================================

    const { data: insertedData, error: insertError } = await supabase
      .from("candidates")
      .insert([
        {
          user_id: userId,
          name: file.name.replace(/\.[^/.]+$/, ""),
          email,
          phone,

          resume_text: extractedText.substring(0, 1000),

          // recruiter summary
          ai_result: extractedExperience,

          // 🔥 NEW SMART INTERVIEW DATA
          skills: extractedSkills,
          focus_areas: focusAreas,
          seniority: seniority,
          interview_status: "Scheduled",
          selection_status: "Pending",
        },
      ])
      .select("id")
      .single();

    if (insertError) throw insertError;

    // =====================================================
    // ✅ RETURN DATA TO FRONTEND (FOR VAPI)
    // =====================================================

    return {
      success: true,
      candidateId: insertedData.id,
      skills: extractedSkills,
      experience: extractedExperience,
      focusArea: focusAreas,
      seniority: seniority
    };
  } catch (err: any) {
    console.error("Resume processing error:", err);
    return { error: "Upload failed." };
  }
}