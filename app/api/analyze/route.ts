import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// 1. Setup the AI with your Key from the .env.local file
const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

export async function POST(req: Request) {
  console.log("--- AI REQUEST RECEIVED ---");

  try {
    // 2. Check if the API key is actually found by your Mac
    if (!apiKey || apiKey === "your_key_here") {
      console.error("CRITICAL ERROR: API Key not found in .env.local");
      return NextResponse.json(
        { text: "Error: API Key missing. Please check your .env.local file and restart the server." },
        { status: 500 }
      );
    }

    // 3. Parse the resume text from the website
    const { resumeText } = await req.json();
    if (!resumeText) {
      return NextResponse.json({ text: "Error: No resume text provided." }, { status: 400 });
    }

    console.log("Analyzing resume...");

    // 4. Initialize the Gemini Model (Updated to 1.5 Flash for speed)
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // 5. Tell the AI exactly what to do
    const prompt = `You are an expert technical recruiter. Based on the following resume text, suggest 3-5 high-level technical interview questions that will test the candidate's real-world experience. 
    
    Resume Text: ${resumeText}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const aiOutput = response.text();

    console.log("AI successfully generated questions!");

    // 6. Send the questions back to your website
    return NextResponse.json({ text: aiOutput });

  } catch (error: any) {
    // 7. If anything crashes, show the FULL error in the VS Code terminal
    console.error("DETAILED ERROR LOG:", error);
    
    return NextResponse.json(
      { text: `AI Error: ${error.message || "Something went wrong on the server."}` },
      { status: 500 }
    );
  }
}