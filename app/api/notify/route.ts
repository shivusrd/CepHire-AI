import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend =
  process.env.RESEND_API_KEY
    ? new Resend(process.env.RESEND_API_KEY)
    : null;

export async function POST(req: Request) {
  try {
    const { email, name, status, score } = await req.json();

    // 1. LOG TO TERMINAL (Visual confirmation for you)
    console.log(`📢 [SYSTEM LOG]: Candidate ${name} has been ${status.toUpperCase()} with a score of ${score}/10.`);

    // 2. FUTURE CODE (Keep for when you have a domain)
    /*
    if (resend)) {
        await resend.emails.send({
            from: "CepHire <onboarding@resend.dev>",
            to: email,
            subject: `Status Update: ${status}`,
            html: `<p>Hi ${name}, your interview status is ${status}. Score: ${score}/10</p>`
        });
    }
    */

    return NextResponse.json({ success: true, message: "Decision logged successfully." });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}