"use client";

import { useState, useEffect } from "react";
import { processResume } from "./actions";
import Vapi from "@vapi-ai/web";
import {
  UserButton,
  SignedIn,
  SignedOut,
  SignInButton,
  useUser,
} from "@clerk/nextjs";

export default function Home() {
  const { user } = useUser();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessed, setIsProcessed] = useState(false);
  const [candidateName, setCandidateName] = useState("");
  const [dbId, setDbId] = useState<string | null>(null);
  const [vapi, setVapi] = useState<any>(null);

  const adminEmail = "dubeyshivam890@gmail.com";
  const isAdmin =
    user?.primaryEmailAddress?.emailAddress === adminEmail;

  // ✅ Initialize Vapi ONCE
  useEffect(() => {
    const vapiInstance = new Vapi(
      "c11d6c7c-3361-4d16-9c89-a0b96f953834" // PUBLIC WEB KEY
    );

    console.log("✅ Vapi initialized");

    vapiInstance.on("call-start", () =>
      console.log("📞 Call started")
    );

    vapiInstance.on("call-end", () =>
      console.log("📴 Call ended")
    );

    vapiInstance.on("error", (e: any) =>
      console.error("❌ Vapi error:", e)
    );

    setVapi(vapiInstance);
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

    console.log("📦 Supabase record:", response.candidateId);

    setDbId(response.candidateId);
    const file = formData.get("resume") as File;
    setCandidateName(file.name.replace(/\.[^/.]+$/, ""));
    setIsProcessed(true);
    setLoading(false);
  }

  // ✅ Start Interview
  const startInterview = () => {
    if (!vapi) {
      alert("AI still initializing...");
      return;
    }

    console.log("🚀 Starting Interview");

    vapi.start("8e924de8-5f30-48af-858e-9d9cb9ba83d2", {
      variableValues: {
        name: candidateName,
        db_id: dbId,
      },
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="flex justify-between items-center p-6 bg-white border-b shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black">
            C
          </div>
          <span className="text-xl font-black uppercase">
            CepHire
          </span>
        </div>

        <div className="flex items-center gap-6">
          <SignedIn>
            {isAdmin && (
              <a href="/dashboard" className="text-sm font-bold">
                Admin Dashboard
              </a>
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
          {!isProcessed ? (
            <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border">
              <h1 className="text-4xl font-black text-center mb-8">
                Audit Resumes with
                <span className="text-blue-600"> AI.</span>
              </h1>

              <form onSubmit={handleSubmit} className="space-y-6">
                <input
                  type="file"
                  name="resume"
                  accept=".pdf,.docx"
                  required
                />

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black"
                >
                  {loading ? "Analyzing..." : "Analyze & Continue"}
                </button>
              </form>

              {error && (
                <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-xl">
                  ⚠️ {error}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white p-12 rounded-[2.5rem] shadow-2xl text-center">
              <h2 className="text-4xl font-black mb-6">
                Ready, {candidateName}!
              </h2>

              <button
                onClick={startInterview}
                className="w-full py-6 rounded-3xl font-black text-2xl bg-blue-600 text-white hover:bg-blue-700"
              >
                Start AI Interview 🎤
              </button>
            </div>
          )}
        </SignedIn>
      </main>
    </div>
  );
}
