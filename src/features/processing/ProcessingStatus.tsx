import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Card } from "../../components/ui/Card";
import { ProgressBar } from "../../components/ui/ProgressBar";
import type { AppState, ModelDownloadProgress } from "../../types/app";

type ProcessingStatusProps = {
  appState: AppState;
  errorMessage: string | null;
  modelProgress: ModelDownloadProgress | null;
  progress: number;
  statusMessage: string;
};

export function ProcessingStatus({
  appState,
  errorMessage,
  modelProgress,
  progress,
  statusMessage,
}: ProcessingStatusProps) {
  const isCompleted = appState === "completed";
  const isError = appState === "error";
  const isActive = appState === "model-loading" || appState === "processing";
  const visibleProgress = isCompleted ? 100 : progress;

  return (
    <Card
      aria-live="polite"
      description="تفريغ صوتي محلي عبر ويسبر — يعمل بالكامل داخل متصفحك."
      title="حالة المعالجة"
    >
      <div className="flex items-start gap-4">
        <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-800">
          {isCompleted ? (
            <CheckCircle2 aria-hidden="true" size={20} strokeWidth={1.9} />
          ) : isError ? (
            <XCircle aria-hidden="true" size={20} strokeWidth={1.9} />
          ) : (
            <Loader2
              aria-hidden="true"
              className={isActive ? "animate-spin" : ""}
              size={20}
              strokeWidth={1.9}
            />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center justify-between gap-4">
            <p className="text-sm font-medium text-zinc-950">
              {isError ? errorMessage : statusMessage}
            </p>
            <p className="font-mono text-sm text-zinc-500">{visibleProgress}%</p>
          </div>

          {modelProgress && (
            <p className="mb-2 truncate font-mono text-xs text-zinc-400">
              جارٍ تحميل ملفات النموذج — {modelProgress.progress}%
            </p>
          )}

          <ProgressBar value={visibleProgress} />
        </div>
      </div>
    </Card>
  );
}
