import React from 'react';

export default function InterviewSuccess() {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-700">
      <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6 shadow-sm">
        <svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      
      <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-2">
        Test Submitted
      </h2>
      <p className="text-slate-500 max-w-sm font-medium">
        Thank you for completing your technical audit. Your data has been successfully processed.
      </p>
      
      <div className="mt-8 p-6 bg-slate-50 rounded-2xl border border-slate-100 w-full max-w-md shadow-inner">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Official Notification</h4>
        <div className="text-left space-y-4">
          <div className="flex gap-4">
            <div className="w-8 h-8 bg-white rounded-lg border border-slate-200 flex items-center justify-center shadow-sm">📩</div>
            <p className="text-xs text-slate-600 leading-tight">
              A detailed feedback report has been generated for the hiring manager.
            </p>
          </div>
          <div className="flex gap-4">
            <div className="w-8 h-8 bg-white rounded-lg border border-slate-200 flex items-center justify-center shadow-sm">📱</div>
            <p className="text-xs text-slate-600 leading-tight">
              You will receive an update on your **registered Email or WhatsApp** regarding the next round.
            </p>
          </div>
        </div>
      </div>

      <button 
        onClick={() => window.location.reload()}
        className="mt-10 px-6 py-2 border-2 border-slate-200 rounded-full text-[10px] font-black text-slate-400 hover:border-blue-600 hover:text-blue-600 transition-all uppercase tracking-widest"
      >
        Exit Interview Room
      </button>
    </div>
  );
}