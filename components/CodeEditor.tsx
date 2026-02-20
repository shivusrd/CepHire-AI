"use client";
import Editor from "@monaco-editor/react";
import { useState } from "react";

export default function CodeEditor() {
  const [lang, setLang] = useState("java");

  // Default code snippets for different languages
  const defaultCode: any = {
    java: 'public class Main {\n  public static void main(String[] args) {\n    System.out.println("Hello World");\n  }\n}',
    javascript: 'console.log("Hello World");',
    python: 'print("Hello World")',
    cpp: '#include <iostream>\nusing namespace std;\n\nint main() {\n  cout << "Hello World";\n  return 0;\n}'
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="p-4 border-b flex justify-between items-center bg-slate-50">
        <div className="flex items-center gap-3">
            <select 
              value={lang} 
              onChange={(e) => setLang(e.target.value)}
              className="bg-white border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-tight shadow-sm outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="java">Java</option>
              <option value="python">Python</option>
              <option value="javascript">JavaScript</option>
              <option value="cpp">C++</option>
            </select>
        </div>
        <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Live Compiler</span>
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden">
        <Editor
          height="100%"
          language={lang}
          theme="light"
          value={defaultCode[lang]}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            padding: { top: 20 },
            fontFamily: "'Fira Code', monospace",
            cursorStyle: "block",
            lineNumbers: "on",
            automaticLayout: true,
          }}
        />
      </div>
    </div>
  );
}