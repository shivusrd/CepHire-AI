import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const callData = payload.message;

    if (callData?.type === "end-of-call-report") {
      const db_id = callData.variableValues?.db_id || callData.artifact?.variables?.db_id || callData.artifact?.variableValues?.db_id || callData.assistantOverrides?.variableValues?.db_id;

      if (!db_id) return NextResponse.json({ error: "No db_id" }, { status: 400 });

      const structuredOutputs = callData.artifact?.structuredOutputs || {};
      const reportKey = Object.keys(structuredOutputs).find(key => structuredOutputs[key]?.name === "Interview_Audit_Report");
      const results = reportKey ? structuredOutputs[reportKey].result : null;

      const cleanScore = (val: any) => {
        const num = Number(val) || 0;
        const normalized = num > 10 ? num / 10 : num;
        return Math.min(Math.round(normalized), 10);
      };

      const { error } = await supabase
        .from("candidates")
        .update({
          interview_status: "Completed",
          final_score: cleanScore(results?.final_score),
          technical_rating: cleanScore(results?.technical_rating),
          communication_rating: cleanScore(results?.communication_rating),
          coding_logic_rating: cleanScore(results?.coding_logic_rating),
          ai_result: callData.analysis?.summary || "Interview evaluation processed.",
          interview_transcript: callData.artifact?.transcript || "",
          recording_url: callData.artifact?.recordingUrl || "" 
        })
        .eq("id", db_id);

      if (error) throw error;
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ message: "Ignored" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}