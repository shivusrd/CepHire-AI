import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase"; // Ensure this path is correct

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

export async function POST(req: Request) {
  try {
    const { resumeText, candidateName } = await req.json();
    
    // 1. Generate Questions with Gemini
    const genAI = new GoogleGenerativeAI(apiKey!);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Extract technical skills and suggest 5 interview questions for: ${resumeText}`;
    const result = await model.generateContent(prompt);
    const aiOutput = result.response.text();

    // 2. SAVE to Supabase (Crucial Step)
    const { data, error } = await supabase
      .from("candidates")
      .insert([{ 
        name: candidateName || "New Candidate", 
        resume_text: resumeText, 
        ai_result: aiOutput,
        interview_status: "Ready" 
      }])
      .select()
      .single();

    if (error) throw error;

    // 3. Return the DB ID so the frontend can give it to Vapi
    return NextResponse.json({ 
      success: true, 
      db_id: data.id, 
      questions: aiOutput 
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}