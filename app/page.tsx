"use client";
import { useState } from "react";
import { processResume } from "./actions";
import ReactMarkdown from "react-markdown";
import { 
  UserButton, 
  SignedIn, 
  SignedOut, 
  SignInButton,
  useUser
} from "@clerk/nextjs";

export default function Home() {
  const { user } = useUser();
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- ADMIN CONFIG ---
  const adminEmail = "dubeyshivam890@gmail.com";
  const isAdmin = user?.primaryEmailAddress?.emailAddress === adminEmail;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData(e.currentTarget);
    const response = await processResume(formData);

    if (response.error) {
      setError(response.error);
    } else {
      setResult(response.text || null);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gray-50 font-[family-name:var(--font-geist-sans)]">
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
                Dashboard
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

      {/* --- MAIN CONTENT --- */}
      <main className="max-w-2xl mx-auto py-20 px-4">
        
        <SignedIn>
          <div className="text-center mb-12">
            <h1 className="text-5xl font-black text-gray-900 mb-4 tracking-tight">
              Audit Resumes with <span className="text-blue-600">AI.</span>
            </h1>
            <p className="text-gray-500 font-medium text-sm">Upload a resume to generate an instant AI interview strategy.</p>
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
                className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-lg hover:bg-blue-700 transition-all disabled:bg-gray-300 shadow-lg shadow-blue-200"
              >
                {loading ? "Analyzing Candidate..." : "Start AI Audit"}
              </button>
            </form>

            {error && (
              <div className="mt-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-bold">
                ⚠️ {error}
              </div>
            )}

            {result && (
              <div className="mt-10 p-8 bg-gray-50 rounded-3xl border border-gray-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-xs font-black text-blue-600 uppercase tracking-widest mb-4">Interview Strategy</h2>
                <div className="prose prose-sm prose-blue text-gray-700 max-w-none">
                  <ReactMarkdown>{result}</ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        </SignedIn>

        <SignedOut>
          <div className="text-center bg-white p-12 rounded-[2.5rem] shadow-xl border border-gray-100">
            <h2 className="text-3xl font-black mb-4 text-gray-900">Welcome to CepHire</h2>
            <p className="text-gray-500 mb-8 font-medium">Please sign in to start auditing resumes and seeing AI insights.</p>
            <SignInButton mode="modal">
              <button className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-lg hover:bg-blue-700 transition-all shadow-lg shadow-blue-200">
                Sign In to Continue
              </button>
            </SignInButton>
          </div>
        </SignedOut>

      </main>
    </div>
  );
}