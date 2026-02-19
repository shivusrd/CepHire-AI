"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import ReactMarkdown from "react-markdown";

export default function Dashboard() {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    async function getCandidates() {
      const { data, error } = await supabase
        .from("candidates")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching:", error.message);
      } else {
        setCandidates(data || []);
      }
      setLoading(false);
    }
    getCandidates();
  }, []);

  const toggleRow = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (loading) return <div className="p-10 text-center font-mono animate-pulse">Loading Recruitment Pipeline...</div>;

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto min-h-screen bg-slate-50">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">CepHire ADMIN</h1>
          <p className="text-slate-500 text-sm font-medium">Real-time AI Interview Intelligence</p>
        </div>
        <div className="flex gap-3">
           <div className="bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm text-center">
             <p className="text-[10px] uppercase font-bold text-slate-400">Total Scans</p>
             <p className="text-xl font-black text-blue-600">{candidates.length}</p>
           </div>
           <a href="/" className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition flex items-center shadow-lg shadow-blue-200">
             + New Candidate
           </a>
        </div>
      </div>

      <div className="grid gap-4">
        {candidates.map((person) => (
          <div key={person.id} className={`bg-white border rounded-2xl overflow-hidden transition-all shadow-sm ${expandedId === person.id ? 'ring-2 ring-blue-500 border-transparent' : 'border-slate-200'}`}>
            
            {/* Header Row */}
            <button 
              onClick={() => toggleRow(person.id)}
              className="w-full flex flex-wrap items-center justify-between p-5 hover:bg-slate-50 transition-colors text-left gap-4"
            >
              <div className="flex items-center gap-4 min-w-[200px]">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold shadow-md">
                  {person.name.charAt(0)}
                </div>
                <div>
                  <h2 className="font-bold text-slate-800 text-lg leading-none">{person.name}</h2>
                  <p className="text-xs text-slate-400 mt-1 font-semibold italic">
                    {new Date(person.created_at).toLocaleDateString()} at {new Date(person.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </p>
                </div>
              </div>

              {/* Status & Quick Score */}
              <div className="flex items-center gap-6">
                <div className="hidden md:flex flex-col items-end">
                  <p className="text-[9px] uppercase font-bold text-slate-400 mb-1">Final AI Score</p>
                  <div className="flex items-center gap-1">
                    <span className="text-2xl font-black text-slate-800">{person.final_score || 0}</span>
                    <span className="text-slate-300 font-bold text-sm">/10</span>
                  </div>
                </div>

                <div className="flex flex-col items-center">
                  <span className={`text-[10px] font-black px-3 py-1 rounded-full border ${
                    person.interview_status === 'Completed' 
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                    : 'bg-amber-50 text-amber-600 border-amber-100'
                  }`}>
                    {person.interview_status?.toUpperCase() || 'PENDING'}
                  </span>
                </div>
                <span className={`text-slate-400 transition-transform ${expandedId === person.id ? 'rotate-180' : ''}`}>
                  ▼
                </span>
              </div>
            </button>

            {/* Expanded Detailed Report */}
            {expandedId === person.id && (
              <div className="bg-slate-50 border-t border-slate-100 p-6 animate-in slide-in-from-top-4 duration-300">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  
                  {/* Left Column: Skill Breakdown */}
                  <div className="space-y-6">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Technical Proficiency</h3>
                    <div className="space-y-4">
                      <RatingBar label="Technical" value={person.technical_rating} color="bg-blue-500" />
                      <RatingBar label="Communication" value={person.communication_rating} color="bg-purple-500" />
                      <RatingBar label="Coding Logic" value={person.coding_logic_rating} color="bg-indigo-500" />
                    </div>
                  </div>

                  {/* Middle Column: AI Summary */}
                  <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-inner">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">AI Recruiter Summary</h3>
                    <div className="prose prose-slate prose-sm max-w-none text-slate-700">
                      <ReactMarkdown>{person.ai_result || "_No summary available yet. Assistant may still be processing._"}</ReactMarkdown>
                    </div>
                    
                    {person.interview_transcript && (
                      <div className="mt-6">
                         <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Interview Transcript</h3>
                         <div className="bg-slate-50 p-4 rounded-lg text-xs font-mono text-slate-500 max-h-40 overflow-y-auto whitespace-pre-wrap border border-slate-100">
                           {person.interview_transcript}
                         </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Helper Component for Rating Bars
function RatingBar({ label, value, color }: { label: string, value: number, color: string }) {
  const percentage = (value / 10) * 100 || 0;
  return (
    <div>
      <div className="flex justify-between text-[10px] font-bold text-slate-600 mb-1 uppercase tracking-tight">
        <span>{label}</span>
        <span>{value || 0}/10</span>
      </div>
      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
        <div 
          className={`${color} h-full transition-all duration-1000 ease-out`} 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
}