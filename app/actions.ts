"use server";
import pdf from "pdf-parse-fork";
import mammoth from "mammoth";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from "@/lib/supabase";
import { auth } from "@clerk/nextjs/server";

// Note: Ensure your .env.local uses NEXT_PUBLIC_ if you access it this way, 
// though for server actions, GEMINI_API_KEY (without prefix) is usually safer.
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || "");

export async function processResume(formData: FormData) {
  try {
    // DEBUGGER: Check if the key is actually loading
    console.log("DEBUG: Key exists?", !!process.env.NEXT_PUBLIC_GEMINI_API_KEY);

    // 1. AUTHENTICATION
    const { userId } = await auth();
    if (!userId) {
      return { error: "Authentication required. Please sign in." };
    }

    // 2. FILE EXTRACTION
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

    // 3. GEMINI AI ANALYSIS
    // Testing Note: Use "gemini-1.5-flash" if "gemini-2.5-flash" causes quota issues
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const prompt = `
      You are an expert technical recruiter. Analyze the following resume text and provide:
      1. A summary of technical strengths.
      2. 5-7 deep technical interview questions based on their experience.
      3. A "Behavioral Fit" assessment.
      
      Resume Text: ${extractedText}
    `;

    const result = await model.generateContent(prompt);
    const aiResponse = result.response.text();

    // 4. SAVE TO DATABASE (candidates table)
    const { error: insertError } = await supabase.from("candidates").insert([
      {
        user_id: userId,
        name: file.name.replace(/\.[^/.]+$/, ""), 
        resume_text: extractedText.substring(0, 1000), 
        ai_result: aiResponse,
        created_at: new Date().toISOString(),
      },
    ]);

    if (insertError) {
      console.error("Supabase Insert Error:", insertError);
    }

    return { text: aiResponse };

  } catch (err: any) {
    console.error("Processing Error:", err);

    // --- ENHANCED ERROR HANDLING FOR UI ---
    
    // Check for Rate Limit / Quota Exceeded (429)
    if (err.message?.includes("429") || err.status === 429) {
      return { 
        error: "AI Limit Reached: Google's free tier is exhausted for now. Please wait a minute and try again." 
      };
    }

    // Check for Invalid API Key (400)
    if (err.message?.includes("400")) {
      return { error: "AI Service Error: Invalid API Key. Please verify your .env.local settings." };
    }

    // Default error for everything else
    return { error: "An unexpected error occurred. Please try again later." };
  }
}