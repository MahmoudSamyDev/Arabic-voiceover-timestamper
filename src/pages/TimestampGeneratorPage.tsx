import { Check } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { AppHeader } from "../components/AppHeader";
import { ExportSection } from "../features/export/ExportSection";
import { ProcessingStatus } from "../features/processing/ProcessingStatus";
import { TranscriptResult } from "../features/transcript/TranscriptResult";
import { UploadSection } from "../features/upload/UploadSection";
import { useTranscriptWorkflow } from "../hooks/useTranscriptWorkflow";
import { transcriptToText } from "../utils/format";

export function TimestampGeneratorPage() {
  const {
    appState,
    audioFile,
    canExport,
    errorMessage,
    fail,
    modelProgress,
    progress,
    reset,
    selectFile,
    statusMessage,
    transcript,
  } = useTranscriptWorkflow();
  const [copied, setCopied] = useState(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const transcriptText = useMemo(
    () => transcriptToText(transcript),
    [transcript],
  );

  const copyTranscript = async () => {
    if (!transcriptText) return;

    await navigator.clipboard.writeText(transcriptText);

    if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    setCopied(true);
    copyTimeoutRef.current = setTimeout(() => setCopied(false), 1800);
  };

  const downloadTranscript = () => {
    if (!transcriptText) {
      return;
    }

    const blob = new Blob([transcriptText], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const safeName =
      audioFile?.name.replace(/\.[^/.]+$/, "").replace(/[^\p{L}\p{N}_-]+/gu, "-") ??
      "timestamped-transcript";

    link.href = url;
    link.download = `${safeName}-transcript.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <main className="min-h-screen bg-zinc-100/70 text-zinc-900">
      <AppHeader />

      <div className="mx-auto grid w-full max-w-[1100px] gap-6 px-4 pb-12 sm:px-6 lg:px-8">
        <UploadSection
          audioFile={audioFile}
          onError={fail}
          onFileSelected={selectFile}
        />

        <ProcessingStatus
          appState={appState}
          errorMessage={errorMessage}
          modelProgress={modelProgress}
          progress={progress}
          statusMessage={statusMessage}
        />

        <TranscriptResult onCopy={copyTranscript} transcript={transcript} />

        <ExportSection
          canExport={canExport}
          onClear={reset}
          onCopy={copyTranscript}
          onDownload={downloadTranscript}
        />

      </div>

      {/* Copy toast */}
      <div
        aria-live="polite"
        className={[
          "pointer-events-none fixed bottom-8 left-1/2 -translate-x-1/2 transition-opacity duration-300",
          copied ? "opacity-100" : "opacity-0",
        ].join(" ")}
      >
        <div className="flex items-center gap-2 rounded-full bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white shadow-lg">
          <Check aria-hidden="true" size={14} strokeWidth={2.5} />
          تم النسخ إلى الحافظة
        </div>
      </div>
    </main>
  );
}
