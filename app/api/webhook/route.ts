import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! 
);

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const callData = payload.message;

    if (callData?.type === "end-of-call-report") {
      // 1. Robust ID Finder
      const db_id = 
        callData.variableValues?.db_id || 
        callData.artifact?.variables?.db_id || 
        callData.artifact?.variableValues?.db_id;

      // 2. Extract Ratings from Structured Data
      const structuredOutputs = callData.artifact?.structuredOutputs || {};
      const firstReportKey = Object.keys(structuredOutputs)[0];
      const reportResults = firstReportKey ? structuredOutputs[firstReportKey]?.result : null;

      if (db_id) {
        // 3. Update Supabase matching your EXACT column names
        const { error } = await supabase
          .from('candidates')
          .update({
            interview_status: 'Completed',     // Matches your 'interview_status' column
            final_score: reportResults?.final_score || 0,
            technical_rating: reportResults?.technical_rating || 0,
            communication_rating: reportResults?.communication_rating || 0,
            coding_logic_rating: reportResults?.coding_logic_rating || 0,
            ai_result: callData.analysis?.summary || "Interview Completed", // Matches 'ai_result'
            interview_transcript: callData.artifact?.transcript || ""       // Matches 'interview_transcript'
          })
          .eq('id', db_id);

        if (error) {
          console.error("❌ Supabase Update Error:", error.message);
          throw error;
        }

        console.log("✅ Database Updated Successfully for:", db_id);
        return NextResponse.json({ success: true });
      }
    }
    
    return NextResponse.json({ message: "Event ignored" });
  } catch (err: any) {
    console.error("🔥 Webhook Crash:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}