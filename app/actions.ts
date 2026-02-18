"use server";
import pdf from "pdf-parse-fork";
import mammoth from "mammoth";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from "@/lib/supabase";

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || "");

export async function processResume(formData: FormData) {
  const file = formData.get("resume") as File;
  if (!file) return { error: "No file uploaded" };

  try {
    // 1. Read File into a Modern Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer); // Fixed the Deprecation Warning
    let extractedText = "";

    // 2. Identify and Extract Text
    if (file.type === "application/pdf") {
      const data = await pdf(buffer);
      extractedText = data.text;
    } else if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      const data = await mammoth.extractRawText({ buffer });
      extractedText = data.value;
    } else {
      return { error: "Please upload a PDF or .docx file" };
    }

    if (!extractedText || extractedText.trim().length < 20) {
      return { error: "The resume appears to be empty or unreadable." };
    }

    // 3. Generate AI Questions
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = `You are a technical interviewer at Iopex. Based on this resume, generate 3 high-level technical interview questions: ${extractedText}`;
    
    const result = await model.generateContent(prompt);
    const aiOutput = result.response.text();

    // 4. Save to Supabase with Error Catching
    console.log("--- ATTEMPTING DATABASE SAVE ---");
    
    const { data: dbData, error: dbError } = await supabase
      .from('candidates')
      .insert([
        { 
          name: file.name, 
          resume_text: extractedText.substring(0, 1000), // Only save first 1000 chars for speed
          ai_result: aiOutput 
        }
      ])
      .select();

    if (dbError) {
      console.log("❌ DATABASE REJECTED SAVE:", dbError.message);
      // We don't crash the whole app, just log the error
    } else {
      console.log("✅ CANDIDATE SAVED TO SUPABASE:", dbData);
    }

    return { text: aiOutput };

  } catch (err: any) {
    console.error("SYSTEM CRASH:", err.message);
    // This catches the "Fetch Failed" network error specifically
    if (err.message.includes("fetch failed")) {
      return { error: "Network Error: Your Wi-Fi/VPN is blocking the database connection. AI worked, but data wasn't saved." };
    }
    return { error: "Processing Error: " + err.message };
  }
}