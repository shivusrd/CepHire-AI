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
  const [isVapiReady, setIsVapiReady] = useState(false);

  const adminEmail = "dubeyshivam890@gmail.com";
  const isAdmin = user?.primaryEmailAddress?.emailAddress === adminEmail;

  useEffect(() => {
    const checkVapi = () => {
      const vapi = (window as any).vapiSDK || (window as any).vapi;
      if (vapi && typeof vapi.run === "function") {
        setIsVapiReady(true);
        return true;
      }
      return false;
    };

    if (checkVapi()) return;

    const scriptId = "vapi-sdk-script";
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://cdn.jsdelivr.net/gh/VapiAI/html-script-tag@latest/dist/assets/index.js";
      script.async = true;
      script.onload = () => {
        console.log("✅ Vapi Script Loaded");
        checkVapi();
      };
      script.onerror = () => {
        console.error("❌ Vapi Script Blocked");
        setError("Voice engine blocked. Check Zscaler or Ad-blockers.");
      };
      document.body.appendChild(script);
    }

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
    const response = await processResume(formData);

    if (response.error) {
      setError(response.error);
      setLoading(false);
    } else {
      console.log("📦 Supabase record created! ID:", response.candidateId);
      setDbId(response.candidateId);
      const file = formData.get("resume") as File;
      setCandidateName(file.name.replace(/\.[^/.]+$/, ""));
      setIsProcessed(true);
      setLoading(false);
    }
  }

  const startInterview = () => {
    const vapi = (window as any).vapiSDK || (window as any).vapi;
    
    // --- HARDCODED TEST KEYS ---
    const publicKey = "c11d6c7c-3361-4d16-9c89-a0b96f953834";
    const assistant = "8e924de8-5f30-48af-858e-9d9cb9ba83d2";
    // ---------------------------

    // Tester's Debug Logs
    console.log("🚀 [TESTER DEBUG] Attempting to start call...");
    console.log("🔑 Public Key being used:", publicKey);
    console.log("🤖 Assistant ID being used:", assistant);
    console.log("🆔 Database ID (db_id):", dbId);

    if (vapi && typeof vapi.run === "function") {
      vapi.run({
        apiKey: publicKey,
        assistantId: assistant,
        assistantOverrides: {
          variableValues: {
            name: candidateName,
            db_id: dbId, 
          },
        },
      });
    } else {
      alert("AI is still initializing. Please wait 3 seconds.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="flex justify-between items-center p-6 bg-white border-b shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black">C</div>
          <span className="text-xl font-black text-gray-900 uppercase">CepHire</span>
        </div>
        <div className="flex items-center gap-6">
          <SignedIn>
            {isAdmin && <a href="/dashboard" className="text-sm font-bold text-gray-600">Admin Dashboard</a>}
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
          <SignedOut><SignInButton mode="modal" /></SignedOut>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto py-20 px-4">
        <SignedIn>
          {!isProcessed ? (
            <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border">
              <h1 className="text-4xl font-black text-center mb-8">Audit Resumes with <span className="text-blue-600">AI.</span></h1>
              <form onSubmit={handleSubmit} className="space-y-6">
                <input type="file" name="resume" accept=".pdf,.docx" required className="w-full text-sm text-gray-500" />
                <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black disabled:bg-gray-300">
                  {loading ? "Analyzing..." : "Analyze & Continue"}
                </button>
              </form>
              {error && <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-xl font-bold">⚠️ {error}</div>}
            </div>
          ) : (
            <div className="bg-white p-12 rounded-[2.5rem] shadow-2xl text-center">
              <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">✓</div>
              <h2 className="text-4xl font-black mb-3 text-gray-900">Ready, {candidateName}!</h2>
              <button 
                onClick={startInterview} 
                disabled={!isVapiReady}
                className={`w-full py-6 rounded-3xl font-black text-2xl transition-all flex items-center justify-center gap-4 
                  ${isVapiReady ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-xl' : 'bg-gray-300 text-gray-400 cursor-not-allowed'}`}
              >
                <span>{isVapiReady ? "Start AI Interview" : "AI Joining Call..."}</span>
                {isVapiReady && <span className="bg-blue-500 px-3 py-1 rounded-lg text-sm uppercase animate-pulse">Live</span>}
              </button>
              {!isVapiReady && <p className="mt-4 text-xs text-gray-400">Waiting for Vapi SDK connection...</p>}
            </div>
          )}
        </SignedIn>
      </main>
    </div>
  );
}