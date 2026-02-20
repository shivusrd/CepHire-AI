import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const body = await req.json();

  await supabase.from("proctor_logs").insert([
    {
      candidate_id: body.db_id,
      violation_type: body.type,
    },
  ]);

  return NextResponse.json({ success: true });
}