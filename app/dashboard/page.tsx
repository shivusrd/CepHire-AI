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

  if (loading) return <div className="p-10 text-center font-mono">Loading Daksha Pipeline...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto min-h-screen bg-white">
      <div className="flex justify-between items-center mb-8 border-b pb-6">
        <h1 className="text-2xl font-black tracking-tighter text-gray-900 uppercase">Recruitment Audit</h1>
        <a href="/" className="text-sm font-bold text-blue-600 hover:text-blue-800 transition">+ New Scan</a>
      </div>

      <div className="space-y-3">
        {candidates.map((person) => (
          <div key={person.id} className="border border-gray-100 rounded-xl overflow-hidden transition-all duration-200">
            {/* Minimal Row Header */}
            <button 
              onClick={() => toggleRow(person.id)}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-left"
            >
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-xs">
                  {person.name.charAt(0)}
                </div>
                <div>
                  <h2 className="font-bold text-gray-800 leading-none">{person.name}</h2>
                  <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-widest">
                    {new Date(person.created_at).toDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold bg-green-50 text-green-600 px-2 py-0.5 rounded border border-green-100">
                  AI AUDITED
                </span>
                <span className={`transform transition-transform ${expandedId === person.id ? 'rotate-180' : ''}`}>
                  ▼
                </span>
              </div>
            </button>

            {/* Hidden Report Content */}
            {expandedId === person.id && (
              <div className="p-6 bg-gray-50 border-t border-gray-100 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="max-w-none prose prose-sm prose-blue text-gray-600 font-medium">
                  <ReactMarkdown>{person.ai_result}</ReactMarkdown>
                </div>
                <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end">
                   <button className="text-[10px] font-bold text-gray-400 hover:text-red-500 uppercase tracking-tighter">
                     Remove Record
                   </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}