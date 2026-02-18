import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY! // Use Service Role for backend updates
);  

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const callData = payload.message;

    if (callData.type === "end-of-call-report") {
      const db_id = callData.variables?.db_id; // The ID we sent from page.tsx

      const { error } = await supabase
        .from('candidates')
        .update({
          interview_status: 'Completed',
          technical_rating: callData.analysis?.structuredData?.technical_rating,
          ai_result: callData.analysis?.summary // Overwrite with final call summary
        })
        .eq('id', db_id);

      if (error) throw error;
      return NextResponse.json({ success: true });
    }
    
    return NextResponse.json({ message: "Not an end-of-call report" });
  } catch (err) {
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}