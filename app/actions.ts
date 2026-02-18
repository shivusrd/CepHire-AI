"use server";
import pdf from "pdf-parse-fork";
import mammoth from "mammoth";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from "@/lib/supabase";
import { auth } from "@clerk/nextjs/server";

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || "");

export async function processResume(formData: FormData) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { error: "Authentication required. Please sign in." };
    }

    const file = formData.get("resume") as File;
    if (!file) return { error: "No file uploaded" };

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    let extractedText = "";

    if (file.type === "application/pdf") {
      const data = await pdf(buffer);
      extractedText = data.text;
    } else if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      const data = await mammoth.extractRawText({ buffer });
      extractedText = data.value;
    } else {
      return { error: "Unsupported file type. Please upload PDF or DOCX." };
    }

    // Using Gemini 1.5 Flash for speed and reliability
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `
      You are an expert technical recruiter. Analyze the following resume text and provide:
      1. A summary of technical strengths.
      2. Exactly 5 technical interview questions based on their specific skills.
      
      Resume Text: ${extractedText}
    `;

    const result = await model.generateContent(prompt);
    const aiResponse = result.response.text();

    // --- CRITICAL CHANGE START ---
    // We must capture the inserted row so we can get the 'id'
    const { data: insertedData, error: insertError } = await supabase
      .from("candidates")
      .insert([
        {
          user_id: userId,
          name: file.name.replace(/\.[^/.]+$/, ""), 
          resume_text: extractedText.substring(0, 1000), 
          ai_result: aiResponse, 
          interview_status: "Ready", 
          created_at: new Date().toISOString(),
        },
      ])
      .select('id') // Specifically ask for the ID back
      .single(); // Get just one object

    if (insertError) {
      console.error("Supabase Insert Error:", insertError);
      return { error: "Database error. Please try again." };
    }

    // Return the candidateId so page.tsx can give it to Vapi
    return { 
      success: true, 
      candidateId: insertedData.id, 
      text: aiResponse 
    };
    // --- CRITICAL CHANGE END ---

  } catch (err: any) {
    console.error("Processing Error:", err);
    
    if (err.message?.includes("429")) {
      return { error: "AI Limit Reached. Please wait a minute and try again." };
    }

    return { error: "An unexpected error occurred. Please try again later." };
  }
}