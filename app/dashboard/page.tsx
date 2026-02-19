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
      .order("created_at", { ascending: false });

    if (!error) setCandidates(data || []);
    setLoading(false);
  }

  useEffect(() => {
    getCandidates();
  }, []);

  const deleteCandidate = async (id: string) => {
    if (!confirm("Are you sure you want to delete this record?")) return;
    const { error } = await supabase.from("candidates").delete().eq("id", id);
    if (!error) getCandidates();
  };

  if (loading) return <div className="p-10 text-center font-mono animate-pulse">Loading CepHire Pipeline...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto min-h-screen bg-slate-50">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-slate-900 uppercase">CepHire AI Dashboard</h1>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Recruitment Intelligence</p>
        </div>
        <button onClick={getCandidates} className="text-xs bg-white border px-4 py-2 rounded-lg font-bold hover:bg-slate-100">Refresh Data</button>
      </div>

      <div className="grid gap-4">
        {candidates.map((person) => (
          <div key={person.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <button 
              onClick={() => setExpandedId(expandedId === person.id ? null : person.id)}
              className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">{person.name?.charAt(0)}</div>
                <div className="text-left">
                  <h2 className="font-bold text-slate-800 leading-none">{person.name}</h2>
                  <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold">{new Date(person.created_at).toDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-[9px] font-black text-slate-400 uppercase">Score</p>
                  <p className="text-xl font-black text-slate-900">{person.final_score || 0}/10</p>
                </div>
                <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${person.interview_status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                  {person.interview_status?.toUpperCase() || 'PENDING'}
                </span>
              </div>
            </button>

            {expandedId === person.id && (
              <div className="p-6 bg-slate-50 border-t border-slate-100 animate-in slide-in-from-top-2 duration-300">
                <div className="grid md:grid-cols-3 gap-8">
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ratings</h3>
                    <RatingItem label="Technical" score={person.technical_rating} />
                    <RatingItem label="Communication" score={person.communication_rating} />
                    <RatingItem label="Coding Logic" score={person.coding_logic_rating} />
                    
                    {person.recording_url && (
                      <div className="mt-6 pt-4 border-t">
                        <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Interview Recording</p>
                        <audio controls className="w-full h-8"><source src={person.recording_url} type="audio/wav" /></audio>
                      </div>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">AI Analysis</h3>
                    <div className="prose prose-sm text-slate-600 font-medium bg-white p-4 rounded-xl border border-slate-200">
                      <ReactMarkdown>{person.ai_result || "No analysis generated yet."}</ReactMarkdown>
                    </div>
                    <button 
                      onClick={() => deleteCandidate(person.id)}
                      className="mt-6 text-[10px] font-bold text-red-400 hover:text-red-600 uppercase tracking-widest"
                    >
                      Delete Candidate Record
                    </button>
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

function RatingItem({ label, score }: { label: string; score: number }) {
  return (
    <div>
      <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase mb-1">
        <span>{label}</span>
        <span>{score || 0}/10</span>
      </div>
      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
        <div className="bg-blue-600 h-full" style={{ width: `${(score || 0) * 10}%` }}></div>
      </div>
    </div>
  );
}