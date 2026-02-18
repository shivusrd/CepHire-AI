"use server";
import pdf from "pdf-parse-fork";
import mammoth from "mammoth";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from "@/lib/supabase";
import { auth } from "@clerk/nextjs/server";

// Using the key from your environment
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || "");

export async function processResume(formData: FormData) {
  try {
    const { userId } = await auth();
    if (!userId) return { error: "Authentication required." };

    const file = formData.get("resume") as File;
    if (!file) return { error: "No file uploaded" };

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    let extractedText = "";

    // Extraction Logic
    if (file.type === "application/pdf") {
      const data = await pdf(buffer);
      extractedText = data.text;
    } else if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      const data = await mammoth.extractRawText({ buffer });
      extractedText = data.value;
    } else {
      return { error: "Upload a PDF or DOCX file." };
    }

    // Fixed model name to gemini-1.5-flash
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    const prompt = `You are a technical recruiter. Analyze this resume and suggest 5 interview questions: ${extractedText}`;

    const result = await model.generateContent(prompt);
    const aiResponse = result.response.text();

    // Save to Supabase and get the ID for the Vapi Webhook
    const { data: insertedData, error: insertError } = await supabase
      .from("candidates")
      .insert([{
          user_id: userId,
          name: file.name.replace(/\.[^/.]+$/, ""), 
          resume_text: extractedText.substring(0, 1000), 
          ai_result: aiResponse, 
          interview_status: "Ready", 
          created_at: new Date().toISOString(),
      }])
      .select('id')
      .single();

    if (insertError) throw insertError;

    return { 
      success: true, 
      candidateId: insertedData.id, 
      text: aiResponse 
    };

  } catch (err: any) {
    console.error("Action Error:", err);
    return { error: "Process failed. Try again." };
  }
}