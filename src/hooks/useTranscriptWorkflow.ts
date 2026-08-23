import { useCallback, useMemo, useRef, useState } from "react";
import { decodeAudioToFloat32 } from "../utils/audioProcessing";
import { normalizeArabicText } from "../utils/arabicText";
import { whisperService } from "../services/whisperService";
import type {
  AppState,
  AudioFileInfo,
  ModelDownloadProgress,
  TranscriptLine,
} from "../types/app";

const MODEL_ID = "Xenova/whisper-small";

function toTimestamp(secs: number): string {
  const m = Math.floor(secs / 60).toString().padStart(2, "0");
  const s = Math.floor(secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export function useTranscriptWorkflow() {
  const [appState, setAppState] = useState<AppState>("idle");
  const [audioFile, setAudioFile] = useState<AudioFileInfo | null>(null);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("بانتظار ملف صوتي.");
  const [transcript, setTranscript] = useState<TranscriptLine[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [modelProgress, setModelProgress] = useState<ModelDownloadProgress | null>(null);

  // Incremented on reset/new file — lets us ignore stale async results.
  const sessionRef = useRef(0);

  const reset = useCallback(() => {
    sessionRef.current++;
    setAppState("idle");
    setAudioFile(null);
    setProgress(0);
    setStatusMessage("بانتظار ملف صوتي.");
    setTranscript([]);
    setErrorMessage(null);
    setModelProgress(null);
  }, []);

  const startProcessing = useCallback(async (fileInfo: AudioFileInfo) => {
    const session = sessionRef.current;
    const stale = () => session !== sessionRef.current;

    // Phase A: load model (instant if already cached from a prior session)
    setAppState("model-loading");
    setProgress(0);
    setStatusMessage("جارٍ تحميل نموذج ويسبر — يحدث هذا مرة واحدة فقط.");
    setModelProgress(null);

    try {
      await whisperService.loadModel({
        modelId: MODEL_ID,
        onProgress: (file, p) => {
          if (stale()) return;
          setModelProgress({ file, progress: Math.round(p) });
          setProgress(Math.round(p * 0.4)); // model load = first 40% of total bar
        },
      });
    } catch (err) {
      if (stale()) return;
      console.error(err);
      setErrorMessage("تعذّر تحميل نموذج التفريغ الصوتي. تحقّق من اتصالك بالإنترنت وأعد المحاولة.");
      setStatusMessage("فشل تحميل النموذج.");
      setAppState("error");
      return;
    }

    if (stale()) return;

    // Phase B: decode audio to 16 kHz mono Float32Array
    setAppState("processing");
    setProgress(45);
    setStatusMessage("جارٍ فك ترميز الصوت…");
    setModelProgress(null);

    let audio: Float32Array;
    try {
      audio = await decodeAudioToFloat32(fileInfo.file);
    } catch (err) {
      if (stale()) return;
      console.error(err);
      setErrorMessage("تعذّر فك ترميز الملف الصوتي. تأكد من أنه ملف صوتي صالح وأعد المحاولة.");
      setStatusMessage("فشلت المعالجة.");
      setAppState("error");
      return;
    }

    if (stale()) return;

    // Phase C: run Whisper inference
    setProgress(55);
    setStatusMessage("جارٍ تفريغ الصوت نصيًا…");

    try {
      const chunks = await whisperService.transcribe(audio);
      if (stale()) return;

      const lines: TranscriptLine[] = chunks.map((chunk, i) => ({
        id: String(i),
        timestamp: toTimestamp(chunk.timestamp[0]),
        text: normalizeArabicText(chunk.text),
      }));

      setTranscript(lines);
      setProgress(100);
      setStatusMessage("النص جاهز.");
      setAppState("completed");
    } catch (err) {
      if (stale()) return;
      console.error(err);
      setErrorMessage("حدث خطأ أثناء تفريغ الصوت نصيًا. حاول مرة أخرى.");
      setStatusMessage("فشل تفريغ النص.");
      setAppState("error");
    }
  }, []);

  const selectFile = useCallback((fileInfo: AudioFileInfo) => {
    sessionRef.current++;
    setAudioFile(fileInfo);
    setAppState("file-selected");
    setProgress(0);
    setStatusMessage("تم اختيار الملف الصوتي.");
    setTranscript([]);
    setErrorMessage(null);
    setModelProgress(null);
    void startProcessing(fileInfo);
  }, [startProcessing]);

  const fail = useCallback((message: string) => {
    sessionRef.current++;
    setErrorMessage(message);
    setStatusMessage("فشل الرفع.");
    setAppState("error");
  }, []);

  const canExport = appState === "completed" && transcript.length > 0;

  return useMemo(
    () => ({
      appState,
      audioFile,
      canExport,
      errorMessage,
      modelProgress,
      progress,
      reset,
      selectFile,
      fail,
      statusMessage,
      transcript,
    }),
    [
      appState,
      audioFile,
      canExport,
      errorMessage,
      modelProgress,
      fail,
      progress,
      reset,
      selectFile,
      statusMessage,
      transcript,
    ],
  );
}
