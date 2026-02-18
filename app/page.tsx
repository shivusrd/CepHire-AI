"use client";
import { useState, useEffect } from "react";
import { processResume } from "./actions";
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
  const [dbId, setDbId] = useState<string | null>(null);
  
  // New state to track if Vapi SDK is actually loaded
  const [isVapiReady, setIsVapiReady] = useState(false);

  const adminEmail = "dubeyshivam890@gmail.com";
  const isAdmin = user?.primaryEmailAddress?.emailAddress === adminEmail;

  // Polling logic to detect Vapi SDK
  useEffect(() => {
    const checkVapi = () => {
      const vapi = (window as any).vapiSDK || (window as any).vapi;
      if (vapi) {
        console.log("✅ Vapi SDK detected and ready for use.");
        setIsVapiReady(true);
        return true;
      }
      return false;
    };

    // Check immediately on mount
    if (checkVapi()) return;

    // If not found, check every 1 second
    const interval = setInterval(() => {
      if (checkVapi()) clearInterval(interval);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const file = formData.get("resume") as File;
    const name = file.name.replace(/\.[^/.]+$/, "");
    setCandidateName(name);

    const response = await processResume(formData);

    if (response.error) {
      setError(response.error);
      setLoading(false);
    } else {
      console.log("📦 Supabase record created! ID:", response.candidateId);
      setDbId(response.candidateId);
      setIsProcessed(true);
      setLoading(false);
    }
  }

  const startInterview = () => {
    const vapi = (window as any).vapiSDK || (window as any).vapi;
    const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;
    const assistantId = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID;

    if (!publicKey || !assistantId) {
      console.error("Vercel Error: Missing environment variables!");
      alert("System setup incomplete. Please check Vercel Settings.");
      return;
    }

    if (vapi && typeof vapi.run === "function") {
      vapi.run({
        apiKey: publicKey,
        assistantId: assistantId,
        assistantOverrides: {
          variableValues: {
            name: candidateName,
            db_id: dbId, 
          },
        },
      });
    } else {
      alert("AI is still initializing. Please wait 3 seconds and try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-[family-name:var(--font-geist-sans)]">
      {/* NAVBAR */}
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
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center mb-12">
                <h1 className="text-5xl font-black text-gray-900 mb-4 tracking-tight">
                  Audit Resumes with <span className="text-blue-600">AI.</span>
                </h1>
                <p className="text-gray-500 font-medium text-sm">Noida HR Tech Deployment v1.0</p>
              </div>
              <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-gray-100">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <input type="file" name="resume" accept=".pdf,.docx" required className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                  <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-lg hover:bg-blue-700 transition-all shadow-lg disabled:bg-gray-300">
                    {loading ? "Analyzing..." : "Analyze & Continue"}
                  </button>
                </form>
                {error && <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-xl font-bold">⚠️ {error}</div>}
              </div>
            </div>
          ) : (
            <div className="bg-white p-12 rounded-[2.5rem] shadow-2xl border border-gray-100 text-center animate-in zoom-in duration-500">
              <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">✓</div>
              <h2 className="text-4xl font-black text-gray-900 mb-3">Ready, {candidateName}!</h2>
              
              <button 
                onClick={startInterview} 
                disabled={!isVapiReady}
                className={`w-full py-6 rounded-3xl font-black text-2xl transition-all shadow-xl flex items-center justify-center gap-4 
                  ${isVapiReady ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-300 text-gray-400 cursor-not-allowed'}`}
              >
                <span>{isVapiReady ? "Start AI Interview" : "AI Joining Call..."}</span>
                {isVapiReady && <span className="bg-blue-500 px-3 py-1 rounded-lg text-sm uppercase animate-pulse">Live</span>}
              </button>
              
              {!isVapiReady && (
                <p className="mt-4 text-xs text-gray-400">
                  Waiting for secure voice connection... (Ensure Ad-blockers are off)
                </p>
              )}
            </div>
          )}
        </SignedIn>
      </main>
    </div>
  );
}