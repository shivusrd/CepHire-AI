"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import ReactMarkdown from "react-markdown";

export default function Dashboard() {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  async function getCandidates() {
    const { data, error } = await supabase
      .from("candidates")
      .select("*")
      .eq("interview_status", "Completed") 
      .order("created_at", { ascending: false });

    if (!error) setCandidates(data || []);
    setLoading(false);
  }

  useEffect(() => { getCandidates(); }, []);

  const handleDecision = async (candidate: any, newStatus: 'Selected' | 'Rejected') => {
    if (!confirm(`Mark ${candidate.name} as ${newStatus}?`)) return;

    const { error } = await supabase
      .from('candidates')
      .update({ selection_status: newStatus })
      .eq('id', candidate.id);

    if (!error) {
      fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: candidate.name, status: newStatus, score: candidate.final_score })
      });
      alert(`Status updated to ${newStatus}!`);
      getCandidates(); 
    }
  };

  if (loading) return <div className="p-10 text-center font-black animate-pulse text-blue-600 tracking-widest">SYNCING CepHire AI PIPELINE...</div>;

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto min-h-screen bg-slate-50">
      <div className="flex justify-between items-center mb-10">
        <div className="flex items-center gap-4">
          <a href="/" className="p-2 hover:bg-white rounded-xl border border-slate-200 shadow-sm transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </a>
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">CepHire AI Dashboard</h1>
        </div>
        <button onClick={getCandidates} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl font-bold transition-colors shadow-lg shadow-blue-100">Sync Data</button>
      </div>

      <div className="grid gap-4">
        {candidates.map((person) => (
          <div key={person.id} className={`bg-white border rounded-[2.5rem] overflow-hidden transition-all shadow-sm ${person.selection_status === 'Selected' ? 'border-emerald-500 ring-4 ring-emerald-500/5' : 'border-slate-200'}`}>
            <button onClick={() => setExpandedId(expandedId === person.id ? null : person.id)} className="w-full flex flex-col md:flex-row items-start md:items-center justify-between p-6 gap-4">
              <div className="flex items-center gap-5 text-left">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-inner ${person.selection_status === 'Selected' ? 'bg-emerald-500' : 'bg-slate-900'}`}>
                  {person.name?.charAt(0)}
                </div>
                <div>
                  <h2 className="font-black text-slate-900 text-xl leading-tight mb-2">{person.name}</h2>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1.5 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                      <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                      <span className="text-[10px] font-black text-blue-600 uppercase tracking-tight">{person.email || "No Email"}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                      <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                      <span className="text-[10px] font-black text-slate-600 uppercase tracking-tight">{person.phone || "No Phone"}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-8 w-full md:w-auto justify-between border-t md:border-t-0 pt-4 md:pt-0">
                <span className={`text-[10px] font-black px-4 py-1.5 rounded-full shadow-sm ${person.selection_status === 'Selected' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : person.selection_status === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-500'}`}>
                  {person.selection_status?.toUpperCase() || 'EVALUATING'}
                </span>
                <div className="text-right">
                  <p className="text-[9px] font-black text-slate-400 uppercase leading-none mb-1">Final Score</p>
                  <p className="text-2xl font-black text-slate-900">{person.final_score || 0}<span className="text-sm text-slate-300">/10</span></p>
                </div>
              </div>
            </button>

            {expandedId === person.id && (
              <div className="p-8 bg-slate-50 border-t border-slate-100 animate-in slide-in-from-top-2 duration-300">
                <div className="grid md:grid-cols-3 gap-10">
                  <div className="space-y-6">
                    <div>
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Competency Breakdown</h3>
                        <RatingItem label="Overall Performance" score={person.final_score} color="bg-blue-600" />
                        <RatingItem label="Technical Proficiency" score={person.technical_rating} color="bg-indigo-500" />
                        <RatingItem label="Communication Skill" score={person.communication_rating} color="bg-purple-500" />
                        <RatingItem label="Logic & Coding" score={person.coding_logic_rating} color="bg-sky-500" />
                    </div>
                    {person.recording_url && (
                        <div className="pt-6 border-t border-slate-200">
                             <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Interview Recording</h3>
                             <audio controls className="w-full h-10 rounded-xl shadow-inner bg-white"><source src={person.recording_url} type="audio/wav" /></audio>
                        </div>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">AI Recruiter Summary</h3>
                    <div className="prose prose-sm bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm mb-8 text-slate-600 leading-relaxed font-medium">
                      <ReactMarkdown>{person.ai_result || "Analysis pending..."}</ReactMarkdown>
                    </div>
                    <div className="flex gap-4">
                      <button onClick={() => handleDecision(person, 'Selected')} className="flex-1 bg-emerald-600 text-white py-4 rounded-2xl font-black text-sm shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all active:scale-95">APPROVE & HIRE</button>
                      <button onClick={() => handleDecision(person, 'Rejected')} className="flex-1 border-2 border-red-100 text-red-500 py-4 rounded-2xl font-black text-sm hover:bg-red-50 transition-all">REJECT CANDIDATE</button>
                    </div>
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

function RatingItem({ label, score, color = "bg-blue-600" }: { label: string; score: number, color?: string }) {
  const percentage = Math.min((score || 0) * 10, 100);
  return (
    <div className="mb-5">
      <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase mb-2 tracking-tight">
        <span>{label}</span>
        <span className="text-slate-900">{score || 0}/10</span>
      </div>
      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden shadow-inner">
        <div className={`${color} h-full transition-all duration-1000 ease-out`} style={{ width: `${percentage}%` }}></div>
      </div>
    </div>
  );
}