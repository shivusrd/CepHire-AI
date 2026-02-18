"use client";
import { useState } from "react";
import { processResume } from "./actions"; // Ensure this returns { success, candidateId }
import Script from "next/script";
import { 
  UserButton, 
  SignedIn, 
  SignedOut, 
  SignInButton,
  useUser
} from "@clerk/nextjs";

export default function Home() {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessed, setIsProcessed] = useState(false);
  const [candidateName, setCandidateName] = useState<string>("");
  const [dbId, setDbId] = useState<string | null>(null); // Store the Supabase ID

  const adminEmail = "dubeyshivam890@gmail.com";
  const isAdmin = user?.primaryEmailAddress?.emailAddress === adminEmail;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const file = formData.get("resume") as File;
    const name = file.name.replace(/\.[^/.]+$/, "");
    setCandidateName(name);

    // This action should now return the ID from Supabase
    const response = await processResume(formData);

    if (response.error) {
      setError(response.error);
      setLoading(false);
    } else {
      setDbId(response.candidateId); // Capture the ID for the webhook
      setIsProcessed(true);
      setLoading(false);
    }
  }

  const startInterview = () => {
    if (typeof window !== "undefined" && (window as any).vapiSDK) {
      (window as any).vapiSDK.run({
        apiKey: "YOUR_VAPI_PUBLIC_KEY", 
        assistantId: "YOUR_ASSISTANT_ID",
        assistantOverrides: {
          variableValues: {
            name: candidateName,
            db_id: dbId, // This is CRITICAL for your webhook to work
          },
        },
      });
    } else {
      alert("Voice AI is still loading. Please wait a second and try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-[family-name:var(--font-geist-sans)]">
      <Script 
        src="https://cdn.jsdelivr.net/gh/VapiAI/html-script-tag@latest/dist/vapi-widget.js"
        strategy="afterInteractive"
      />

      {/* --- NAVBAR --- */}
      <nav className="flex justify-between items-center p-6 bg-white border-b border-gray-100 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black text-lg">C</div>
          <span className="text-xl font-black tracking-tighter text-gray-900 uppercase">CepHire</span>
        </div>
        
        <div className="flex items-center gap-6">
          <SignedIn>
            {isAdmin && (
              <a href="/dashboard" className="text-sm font-bold text-gray-600 hover:text-blue-600 transition">
                Admin Dashboard
              </a>
            )}
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
          <SignedOut>
            <SignInButton mode="modal">
              <button className="text-sm font-bold text-blue-600 border border-blue-600 px-4 py-2 rounded-full hover:bg-blue-50 transition">
                Sign In
              </button>
            </SignInButton>
          </SignedOut>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto py-20 px-4">
        <SignedIn>
          {!isProcessed ? (
            /* PHASE 1: UPLOAD SCREEN */
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center mb-12">
                <h1 className="text-5xl font-black text-gray-900 mb-4 tracking-tight">
                  Audit Resumes with <span className="text-blue-600">AI.</span>
                </h1>
                <p className="text-gray-500 font-medium text-sm">Upload your resume to qualify for an AI Interview.</p>
              </div>

              <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-gray-100">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center hover:border-blue-400 transition-colors">
                    <input
                      type="file"
                      name="resume"
                      accept=".pdf,.docx"
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                      required
                    />
                  </div>
                  
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-lg hover:bg-blue-700 transition-all disabled:bg-gray-300 shadow-lg"
                  >
                    {loading ? "Analyzing Experience..." : "Analyze & Continue"}
                  </button>
                </form>

                {error && (
                  <div className="mt-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-bold">
                    ⚠️ {error}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* PHASE 2: INTERVIEW READY SCREEN */
            <div className="bg-white p-12 rounded-[2.5rem] shadow-2xl border border-gray-100 text-center animate-in zoom-in duration-500">
              <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">✓</span>
              </div>
              <h2 className="text-4xl font-black text-gray-900 mb-3">Resume Analyzed!</h2>
              <p className="text-gray-500 font-medium mb-10 max-w-sm mx-auto">
                Welcome, <strong>{candidateName}</strong>. Our AI has generated a custom 10-minute technical interview for you.
              </p>
              
              <button
                onClick={startInterview}
                className="w-full bg-blue-600 text-white py-6 rounded-3xl font-black text-2xl hover:bg-blue-700 transition-all hover:scale-[1.02] shadow-xl flex items-center justify-center gap-4"
              >
                <span>Start AI Interview</span>
                <span className="bg-blue-500 px-3 py-1 rounded-lg text-sm">VOICE & VIDEO</span>
              </button>
              
              <p className="mt-6 text-[10px] text-gray-400 uppercase tracking-widest font-bold">
                Powered by Gemini 2.0 & Vapi AI
              </p>
            </div>
          )}
        </SignedIn>

        <SignedOut>
          <div className="text-center bg-white p-12 rounded-[2.5rem] shadow-xl border border-gray-100">
            <h2 className="text-3xl font-black mb-4 text-gray-900">Welcome to CepHire</h2>
            <p className="text-gray-500 mb-8 font-medium">Please sign in to start your AI application process.</p>
            <SignInButton mode="modal">
              <button className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-lg hover:bg-blue-700 transition-all shadow-lg">
                Sign In to Continue
              </button>
            </SignInButton>
          </div>
        </SignedOut>
      </main>

      {/* --- FOOTER --- */}
      <footer className="mt-20 border-t border-gray-200 bg-white py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-sm text-gray-500 font-bold">© 2026 CepHire AI. Noida Head Office.</p>
          <div className="flex justify-center gap-4 mt-4 text-xs font-bold text-gray-400">
            <span>SECURE CLOUD AUDIT</span>
            <span>•</span>
            <span>DATA PRIVACY ENCRYPTED</span>
          </div>
        </div>
      </footer>
    </div>
  );
}