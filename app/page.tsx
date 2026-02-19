"use client";

import { useState, useEffect } from "react";
import { processResume } from "./actions";
import Vapi from "@vapi-ai/web";
import Link from "next/link"; // Use Link for faster navigation
import {
  UserButton,
  SignedIn,
  SignedOut,
  SignInButton,
  useUser,
} from "@clerk/nextjs";

import InterviewSuccess from "@/components/InterviewSuccess";
import ProcessingReport from "@/components/ProcessingReport";

export default function Home() {
  const { user, isLoaded: isUserLoaded } = useUser();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessed, setIsProcessed] = useState(false);
  const [candidateName, setCandidateName] = useState("");
  const [dbId, setDbId] = useState<string | null>(null);
  const [vapi, setVapi] = useState<any>(null);

  const [step, setStep] = useState<"idle" | "active" | "processing" | "completed">("idle");

  const adminEmail = "dubeyshivam890@gmail.com";
  const isAdmin = user?.primaryEmailAddress?.emailAddress === adminEmail;

  useEffect(() => {
    const vapiInstance = new Vapi("c11d6c7c-3361-4d16-9c89-a0b96f953834");

    vapiInstance.on("call-start", () => setStep("active"));
    vapiInstance.on("call-end", () => {
      setStep("processing");
      setTimeout(() => setStep("completed"), 5000);
    });

    vapiInstance.on("error", (e: any) => {
      if (e.error?.errorMsg !== 'Meeting has ended') setStep("idle");
    });

    setVapi(vapiInstance);

    // Cleanup to prevent memory leaks when navigating away
    return () => {
      if (vapiInstance) vapiInstance.stop();
    };
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const response = await processResume(formData);

    if (response.error) {
      setError(response.error);
      setLoading(false);
      return;
    }

    setDbId(response.candidateId);
    const file = formData.get("resume") as File;
    setCandidateName(file.name.replace(/\.[^/.]+$/, ""));
    setIsProcessed(true);
    setLoading(false);
  }

  const startInterview = () => {
    if (!vapi) return alert("AI still initializing...");
    vapi.start("8e924de8-5f30-48af-858e-9d9cb9ba83d2", {
      variableValues: { name: candidateName, db_id: dbId },
    });
  };

  // Prevent flicker during Clerk Auth load
  if (!isUserLoaded) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-pulse font-black text-blue-600 uppercase tracking-widest">Initialising CepHire AI....</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="flex justify-between items-center p-6 bg-white border-b shadow-sm">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black">C</div>
          <span className="text-xl font-black uppercase tracking-tighter">CepHire</span>
        </Link>

        <div className="flex items-center gap-6">
          <SignedIn>
            {isAdmin && (
              <Link href="/dashboard" className="text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors">
                Admin Dashboard
              </Link>
            )}
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
          <SignedOut>
            <SignInButton mode="modal" />
          </SignedOut>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto py-20 px-4">
        <SignedIn>
          {!isProcessed && step === "idle" && (
            <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-100 animate-in fade-in zoom-in duration-300">
              <h1 className="text-4xl font-black text-center mb-8 tracking-tight">
                Audit Resumes with <span className="text-blue-600 underline">AI.</span>
              </h1>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="border-2 border-dashed border-slate-200 p-8 rounded-2xl text-center hover:border-blue-400 transition-colors cursor-pointer bg-slate-50/50">
                    <input type="file" name="resume" accept=".pdf,.docx" required className="text-sm cursor-pointer" />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-blue-100 active:scale-95 transition-all"
                >
                  {loading ? "Analyzing Skills..." : "Analyze & Continue"}
                </button>
              </form>
              {error && <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-bold animate-shake">⚠️ {error}</div>}
            </div>
          )}

          {isProcessed && step === "idle" && (
            <div className="bg-white p-12 rounded-[2.5rem] shadow-2xl text-center border border-slate-100 animate-in slide-in-from-bottom-4 duration-500">
              <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-black shadow-inner">
                {candidateName.charAt(0)}
              </div>
              <h2 className="text-4xl font-black mb-2 tracking-tight">Ready, {candidateName}!</h2>
              <p className="text-slate-500 mb-8 font-medium">Your resume has been audited. Click below to start the AI technical interview.</p>
              <button
                onClick={startInterview}
                className="w-full py-6 rounded-3xl font-black text-2xl bg-blue-600 text-white hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all hover:-translate-y-1 active:scale-95"
              >
                Start AI Interview 🎤
              </button>
            </div>
          )}

          {step === "active" && (
            <div className="flex flex-col items-center justify-center text-center p-12 bg-white rounded-[2.5rem] shadow-xl border border-slate-100">
              <div className="w-24 h-24 bg-blue-600 rounded-full mb-6 flex items-center justify-center shadow-lg relative">
                <div className="absolute inset-0 w-full h-full bg-blue-600 rounded-full animate-ping opacity-25"></div>
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
              </div>
              <h2 className="text-2xl font-black uppercase tracking-widest text-blue-600">Interview in Progress</h2>
              <p className="text-slate-400 mt-2 font-medium">Please speak clearly. The AI is listening.</p>
            </div>
          )}

          {step === "processing" && <ProcessingReport />}
          {step === "completed" && <InterviewSuccess />}
        </SignedIn>

        <SignedOut>
          <div className="text-center animate-in fade-in duration-700">
            <h1 className="text-5xl font-black mb-6 tracking-tighter">Welcome to CepHire</h1>
            <p className="text-slate-500 mb-8 max-w-sm mx-auto">Please sign in to start your automated interview audit and recruitment pipeline.</p>
            <SignInButton mode="modal">
                <button className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black shadow-2xl hover:bg-black transition-all">Get Started</button>
            </SignInButton>
          </div>
        </SignedOut>
      </main>
    </div>
  );
}