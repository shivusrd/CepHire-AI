"use server";
import pdf from "pdf-parse-fork";
import mammoth from "mammoth";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from "@/lib/supabase";
import { auth } from "@clerk/nextjs/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function processResume(formData: FormData) {
  try {
    // 1. AUTHENTICATION CHECK
    const { userId } = await auth();
    if (!userId) {
      return { error: "Authentication required. Please sign in." };
    }

    // 2. USAGE LIMITER CHECK
    // Counting entries in the 'candidates' table for the current user
    const { count, error: countError } = await supabase
      .from("candidates")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    if (countError) {
      console.error("Supabase Count Error:", countError);
      return { error: "Could not verify usage limits. Please try again." };
    }

    const LIMIT = 3;
    if (count !== null && count >= LIMIT) {
      return { 
        error: `Limit Reached: You have used all ${LIMIT} free AI audits. Please upgrade to Pro for unlimited access.` 
      };
    }

    // 3. FILE EXTRACTION
    const file = formData.get("resume") as File;
    if (!file) return { error: "No file uploaded" };

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    let extractedText = "";

    if (file.type === "application/pdf") {
      const data = await pdf(buffer);
      extractedText = data.text;
    } else if (
      file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      const data = await mammoth.extractRawText({ buffer });
      extractedText = data.value;
    } else {
      return { error: "Unsupported file type. Please upload PDF or DOCX." };
    }

    // 4. GEMINI AI ANALYSIS
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `
      You are an expert technical recruiter. Analyze the following resume text and provide:
      1. A summary of technical strengths.
      2. 5-7 deep technical interview questions based on their experience.
      3. A "Behavioral Fit" assessment.
      
      Resume Text: ${extractedText}
    `;

    const result = await model.generateContent(prompt);
    const aiResponse = result.response.text();

    // 5. SAVE TO DATABASE (Targeting 'candidates' table)
    const { error: insertError } = await supabase.from("candidates").insert([
      {
        user_id: userId,
        name: file.name.replace(/\.[^/.]+$/, ""), 
        resume_text: extractedText.substring(0, 1000), // Saving first 1000 chars for context
        ai_result: aiResponse,
        created_at: new Date().toISOString(),
      },
    ]);

    if (insertError) {
      console.error("Supabase Insert Error:", insertError);
      // We still return the text so the user gets their result
    }

    return { text: aiResponse };

  } catch (err: any) {
    console.error("Processing Error:", err);
    return { error: "An unexpected error occurred during processing." };
  }
}