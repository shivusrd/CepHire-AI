export default function ProcessingReport() {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-6"></div>
      <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-2">
        Finalizing your report...
      </h2>
      <p className="text-slate-500 text-sm max-w-xs leading-relaxed animate-pulse">
        Please do not close this window. Our AI is securely saving your responses to the Daksha Pipeline.
      </p>
    </div>
  );
}