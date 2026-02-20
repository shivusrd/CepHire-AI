"use client";

import { useState, useEffect, useRef } from "react";
import { processResume } from "./actions";
import Vapi from "@vapi-ai/web";
import Link from "next/link";
import { UserButton, SignedIn, SignedOut, SignInButton, useUser } from "@clerk/nextjs";
import { supabase } from "@/lib/supabase";
import * as faceapi from "face-api.js";

// Components
import InterviewSuccess from "@/components/InterviewSuccess";
import ProcessingReport from "@/components/ProcessingReport";
import CodeEditor from "@/components/CodeEditor";


export default function Home() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessed, setIsProcessed] = useState(false);
  const [candidateName, setCandidateName] = useState("");
  const [dbId, setDbId] = useState<string | null>(null);
  const [vapi, setVapi] = useState<any>(null);
  const [step, setStep] = useState<"idle" | "active" | "processing" | "completed">("idle");
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const [showCompiler, setShowCompiler] = useState(false);

  const logViolation = async (type: string) => {
  if (!dbId) return;

  await fetch("/api/proctor-log", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      db_id: dbId,
      type,
    }),
  });
};

  const adminEmail = "dubeyshivam890@gmail.com";
  const isAdmin = user?.primaryEmailAddress?.emailAddress === adminEmail;
   
  useEffect(() => {
  const vapiInstance = new Vapi("c11d6c7c-3361-4d16-9c89-a0b96f953834");

  vapiInstance.on("call-start", () => setStep("active"));

  vapiInstance.on("call-end", async () => {
  setStep("processing");

  if (recorderRef.current) {
    recorderRef.current.stop();

    recorderRef.current.onstop = async () => {
      const blob = new Blob(chunksRef.current, {
        type: "video/webm",
      });

      const fileName = `${dbId}.webm`;

      await supabase.storage
        .from("recordings")
        .upload(fileName, blob, { upsert: true });

      setStep("completed");
    };
  }
});

  vapiInstance.on("error", (e: any) => {
    if (e.error?.errorMsg !== "Meeting has ended") {
      setStep("idle");
    }
  });

  setVapi(vapiInstance);

  return () => {
    vapiInstance.stop();
  };
}, []);

  useEffect(() => {
  if (step !== "active") return;

  const interval = setInterval(() => {
    const container = document.getElementById("vapi-video-container");

    if (container && streamRef.current) {
      // prevent duplicate video
      if (!container.querySelector("video")) {
        const video = document.createElement("video");

        video.srcObject = streamRef.current;
        video.autoplay = true;
        video.muted = true;
        video.playsInline = true;
        video.className = "w-full h-full object-cover";

        container.innerHTML = "";
        container.appendChild(video);
      }

      clearInterval(interval);
    }
  }, 300);

  return () => clearInterval(interval);
}, [step]);

// ✅ STEP 4 — LOAD FACE AI MODELS
useEffect(() => {
  const loadModels = async () => {
    await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
    console.log("✅ Face detection ready");
  };

  loadModels();
}, []);

// ✅ STEP 5 — PROCTORING FACE MONITOR
useEffect(() => {
  if (step !== "active") return;

  const interval = setInterval(async () => {
    if (!streamRef.current) return;

    const video = document.querySelector("video");
    if (!video) return;

    const detections = await faceapi.detectAllFaces(
      video,
      new faceapi.TinyFaceDetectorOptions()
    );

    // 🚨 Multiple people
    if (detections.length > 1) {
      await supabase.from("proctor_logs").insert({
        candidate_id: dbId,
        violation_type: "MULTIPLE_FACES_DETECTED",
      });
    }

    // 🚨 No face
    if (detections.length === 0) {
      await supabase.from("proctor_logs").insert({
        candidate_id: dbId,
        violation_type: "NO_FACE_VISIBLE",
      });
    }

  }, 5000); // every 5 sec

  return () => clearInterval(interval);
}, [step]);

useEffect(() => {
  const handleVisibility = () => {
    if (document.hidden) {
      console.warn("⚠️ Tab switched");
      logViolation("TAB_SWITCH");
    }
  };

  document.addEventListener("visibilitychange", handleVisibility);

  return () =>
    document.removeEventListener("visibilitychange", handleVisibility);
}, [dbId]);

useEffect(() => {
  const handleBlur = () => {
    console.warn("⚠️ Window focus lost");
    logViolation("WINDOW_BLUR");
  };

  window.addEventListener("blur", handleBlur);

  return () => window.removeEventListener("blur", handleBlur);
}, [dbId]);

useEffect(() => {
  if (step !== "active") return;

  let interval: any;

  const runFaceDetection = async () => {
    const faceapi = await import("face-api.js");

    await faceapi.nets.tinyFaceDetector.loadFromUri("/models");

    interval = setInterval(async () => {
      const video =
        document.querySelector("#vapi-video-container video") as HTMLVideoElement;

      if (!video) return;

      const detections = await faceapi.detectAllFaces(
        video,
        new faceapi.TinyFaceDetectorOptions()
      );

      if (detections.length === 0) {
        logViolation("NO_FACE");
      }

      if (detections.length > 1) {
        logViolation("MULTIPLE_FACE");
      }
    }, 6000);
  };

  runFaceDetection();

  return () => clearInterval(interval);
}, [step]);

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
    setDbId(response.candidateId);
    const file = formData.get("resume") as File;
    setCandidateName(file.name.replace(/\.[^/.]+$/, ""));
    setIsProcessed(true);
    setLoading(false);
  }

  const startMandatoryVideoInterview = async () => {
  if (!vapi) return alert("AI still initializing...");

  try {
    // 🎥 Request camera + microphone
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    // ✅ IMPORTANT:
    // Store stream for later attachment (React renders UI after call-start)
    streamRef.current = stream;

    // 🎥 START RECORDING (unchanged)
    chunksRef.current = [];

    const recorder = new MediaRecorder(stream);
    recorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };

    recorder.start();

    // ✅ START VAPI INTERVIEW
    vapi.start(process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID!, {
      variableValues: {
        name: candidateName,
        db_id: dbId,
      },
    });

  } catch (err) {
    console.error(err);
    alert("Camera & microphone permission required.");
  }
};

  if (!isUserLoaded) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 uppercase font-black text-blue-600 animate-pulse">
      Syncing Environment...
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <nav className="flex justify-between items-center p-6 bg-white border-b shadow-sm z-10">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black">D</div>
          <span className="text-xl font-black uppercase tracking-tighter">CepHire AI</span>
        </Link>
        <div className="flex items-center gap-6">
          <SignedIn>
            {isAdmin && <Link href="/dashboard" className="text-sm font-black text-slate-500 hover:text-blue-600 uppercase">Dashboard</Link>}
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
          <SignedOut><SignInButton mode="modal" /></SignedOut>
        </div>
      </nav>

      <main className={`flex-1 flex flex-col items-center justify-center p-4 ${step === 'active' ? 'max-w-full' : 'max-w-2xl mx-auto'}`}>
        <SignedIn>
          {/* UPLOAD STEP */}
          {!isProcessed && step === "idle" && (
            <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-100 w-full">
               <h1 className="text-4xl font-black text-center mb-8 tracking-tight">Technical <span className="text-blue-600">Video</span> Audit.</h1>
               <form onSubmit={handleSubmit} className="space-y-6">
                 <div className="border-2 border-dashed border-slate-200 p-8 rounded-3xl text-center hover:border-blue-400 bg-slate-50/50 cursor-pointer transition-all">
                    <input type="file" name="resume" accept=".pdf,.docx" required className="text-sm cursor-pointer" />
                 </div>
                 <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-blue-100 active:scale-95 transition-all">
                    {loading ? "PROCESSING..." : "ANALYZE RESUME"}
                 </button>
               </form>
            </div>
          )}

          {/* READY STEP */}
          {isProcessed && step === "idle" && (
            <div className="bg-white p-12 rounded-[3rem] shadow-2xl text-center border border-slate-100 w-full">
              <div className="w-20 h-20 bg-blue-600 text-white rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-3xl font-black shadow-xl">
                {candidateName.charAt(0)}
              </div>
              <h2 className="text-4xl font-black mb-4">Welcome, {candidateName}!</h2>
              <p className="text-slate-500 mb-8 font-medium">This is a video-proctored technical interview. Ensure your camera is on.</p>
              <button onClick={startMandatoryVideoInterview} className="w-full py-6 rounded-3xl font-black text-2xl bg-blue-600 text-white hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all hover:-translate-y-1">
                Enter Interview Room 🎥
              </button>
            </div>
          )}

          {/* 🎥 SPLIT SCREEN INTERVIEW INTERFACE */}
          {step === "active" && (
  <div
    className={`w-full h-[750px] transition-all duration-500 ${
      showCompiler
        ? "grid grid-cols-1 lg:grid-cols-5 gap-6 p-2 max-w-[1400px] mx-auto"
        : "flex items-center justify-center"
    }`}
  >
    {/* ================= VIDEO PANEL ================= */}
    <div
      className={`bg-slate-900 rounded-[2.5rem] overflow-hidden relative shadow-2xl border-4 border-blue-600/20 ${
        showCompiler
          ? "lg:col-span-2"
          : "w-full h-full max-w-[1200px]"
      }`}
    >
      <div
        id="vapi-video-container"
        className="w-full h-full bg-slate-800 flex items-center justify-center"
      >
        <div className="text-slate-500 font-bold uppercase tracking-widest text-xs animate-pulse">
          Initializing Stream...
        </div>
      </div>

      {/* LIVE LABEL */}
      <div className="absolute bottom-6 left-6 bg-black/60 backdrop-blur-md px-5 py-2 rounded-full flex items-center gap-3">
        <div className="w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
        <span className="text-white text-[10px] font-black uppercase tracking-widest">
          Live: {candidateName}
        </span>
      </div>

      {/* COMPILER TOGGLE BUTTON */}
      <div className="absolute top-6 right-6">
        {!showCompiler ? (
          <button
            onClick={() => setShowCompiler(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-black text-xs shadow-lg hover:bg-blue-700 transition-all"
          >
            Open Compiler 💻
          </button>
        ) : (
          <button
            onClick={() => setShowCompiler(false)}
            className="bg-red-500 text-white px-6 py-3 rounded-xl font-black text-xs shadow-lg hover:bg-red-600 transition-all"
          >
            Close Compiler ✖
          </button>
        )}
      </div>
    </div>

    {/* ================= COMPILER PANEL ================= */}
    {showCompiler && (
      <div className="lg:col-span-3 rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-200">
        <CodeEditor />
      </div>
    )}
  </div>
)}

          {step === "processing" && <ProcessingReport />}
          {step === "completed" && <InterviewSuccess />}
        </SignedIn>

        <SignedOut>
            <div className="text-center bg-white p-12 rounded-[3rem] shadow-xl">
                <h1 className="text-5xl font-black mb-4 tracking-tighter italic text-slate-900">CepHire AI</h1>
                <p className="text-slate-400 mb-8 font-medium">Technical recruitment, automated with video & logic.</p>
                <SignInButton mode="modal">
                    <button className="bg-blue-600 text-white px-12 py-4 rounded-2xl font-black shadow-lg shadow-blue-200 hover:scale-105 transition-all uppercase tracking-tighter">Enter Pipeline</button>
                </SignInButton>
            </div>
        </SignedOut>
      </main>
    </div>
  );
}