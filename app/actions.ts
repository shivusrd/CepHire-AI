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
    if (!userId) return { error: "Please sign in." };

    const file = formData.get("resume") as File;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    let extractedText = "";

    if (file.type === "application/pdf") {
      const data = await pdf(buffer);
      extractedText = data.text;
    } else {
      const data = await mammoth.extractRawText({ buffer });
      extractedText = data.value;
    }

    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    const phoneRegex = /(\+?\d{1,3}[- ]?)?\d{10,12}/;
    const email = extractedText.match(emailRegex)?.[0] || "Not Found";
    const phone = extractedText.match(phoneRegex)?.[0] || "Not Found";

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = `Analyze this resume and suggest 5 interview questions: ${extractedText}`;
    const result = await model.generateContent(prompt);

    const { data: insertedData, error: insertError } = await supabase
      .from("candidates")
      .insert([{
          user_id: userId,
          name: file.name.replace(/\.[^/.]+$/, ""), 
          email, phone,
          resume_text: extractedText.substring(0, 1000), 
          ai_result: result.response.text(), 
          interview_status: "Scheduled", 
          selection_status: "Pending",
      }])
      .select('id').single();

    if (insertError) throw insertError;
    return { success: true, candidateId: insertedData.id };
  } catch (err: any) {
    return { error: "Upload failed." };
  }
}