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
    if (!userId) return { error: "Please sign in to upload resumes." };

    const file = formData.get("resume") as File;
    if (!file) return { error: "No file detected." };

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    let extractedText = "";

    // 1. Text Extraction
    if (file.type === "application/pdf") {
      const data = await pdf(buffer);
      extractedText = data.text;
    } else if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      const data = await mammoth.extractRawText({ buffer });
      extractedText = data.value;
    } else {
      return { error: "Please upload a PDF or DOCX file." };
    }

    // 2. Gemini Analysis (FIXED MODEL NAME)
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = `You are a technical recruiter. Analyze this resume and suggest 5 high-level technical interview questions: ${extractedText}`;

    const result = await model.generateContent(prompt);
    const aiResponse = result.response.text();

    // 3. Save to Supabase
    // We get the 'id' back to pass to Vapi as 'db_id'
    const { data: insertedData, error: insertError } = await supabase
      .from("candidates")
      .insert([{
          user_id: userId,
          name: file.name.replace(/\.[^/.]+$/, ""), 
          resume_text: extractedText.substring(0, 1000), 
          ai_result: aiResponse, 
          interview_status: "Ready", 
      }])
      .select('id')
      .single();

    if (insertError) {
        console.error("Supabase Insert Error:", insertError);
        throw insertError;
    }

    return { 
      success: true, 
      candidateId: insertedData.id, 
      text: aiResponse 
    };

  } catch (err: any) {
    console.error("Full Action Error:", err);
    return { error: "Resume processing failed. Please check your API keys." };
  }
}