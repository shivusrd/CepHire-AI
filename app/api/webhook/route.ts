import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();

    console.log("📩 VAPI WEBHOOK:", JSON.stringify(body, null, 2));

    const message = body?.message;

    if (message?.type !== "end-of-call-report") {
      return NextResponse.json({ ignored: true });
    }

    // ✅ db_id
    const db_id =
      message?.assistantOverrides?.variableValues?.db_id ||
      message?.artifact?.variableValues?.db_id ||
      message?.artifact?.variables?.db_id;

    if (!db_id) {
      console.log("❌ Missing db_id");
      return NextResponse.json({ error: "Missing db_id" }, { status: 400 });
    }

    /* ---------------- TRANSCRIPT ---------------- */
    const transcript =
      message?.artifact?.transcript ||
      message?.analysis?.transcript ||
      "";

    /* ---------------- SUMMARY ---------------- */
    const summary =
      message?.analysis?.summary ||
      "Interview completed.";

    /* ---------------- RECORDING ---------------- */
    const recordingUrl =
      message?.artifact?.recordingUrl || "";

    /* ---------------- RATINGS ---------------- */
    const structuredOutputs =
      message?.artifact?.structuredOutputs || {};

    const reportKey = Object.keys(structuredOutputs).find(
      (key) =>
        structuredOutputs[key]?.name === "Interview_Audit_Report"
    );

    const results = reportKey
      ? structuredOutputs[reportKey].result
      : {};

    const cleanScore = (val: any) => {
      const num = Number(val) || 0;
      const normalized = num > 10 ? num / 10 : num;
      return Math.min(Math.round(normalized), 10);
    };

    const updatePayload = {
      interview_status: "Completed",
      interview_transcript: transcript,
      ai_result: summary,
      recording_url: recordingUrl,
      final_score: cleanScore(results?.final_score),
      technical_rating: cleanScore(results?.technical_rating),
      communication_rating: cleanScore(results?.communication_rating),
      coding_logic_rating: cleanScore(results?.coding_logic_rating),
    };

    const { error } = await supabase
      .from("candidates")
      .update(updatePayload)
      .eq("id", db_id);

    if (error) throw error;

    console.log("✅ Interview stored:", db_id);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Webhook error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}