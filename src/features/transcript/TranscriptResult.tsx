import { Copy } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import type { TranscriptLine } from "../../types/app";

type TranscriptResultProps = {
  onCopy: () => void;
  transcript: TranscriptLine[];
};

export function TranscriptResult({ onCopy, transcript }: TranscriptResultProps) {
  const hasTranscript = transcript.length > 0;

  return (
    <Card
      className="min-h-[460px]"
      description="حدّد النص أو انسخه أو صدّره مع الحفاظ على الطوابع الزمنية."
      title="نتيجة النص"
    >
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-zinc-500">
          {hasTranscript
            ? `${transcript.length} مقطع موقّت زمنيًا`
            : "سيظهر النص هنا بعد المعالجة."}
        </p>
        <Button
          aria-label="نسخ النص"
          disabled={!hasTranscript}
          icon={<Copy aria-hidden="true" size={16} strokeWidth={1.9} />}
          onClick={onCopy}
        >
          نسخ النص
        </Button>
      </div>

      <div className="h-[360px] overflow-y-auto rounded-xl border border-zinc-200 bg-zinc-50 p-5 text-start shadow-inner">
        {hasTranscript ? (
          <div className="space-y-5">
            {transcript.map((line) => (
              <p
                className="grid gap-2 text-base leading-7 text-zinc-800 sm:grid-cols-[72px_1fr]"
                key={line.id}
              >
                <span className="font-mono text-sm font-semibold text-zinc-950" dir="ltr">
                  [{line.timestamp}]
                </span>
                <span>{line.text}</span>
              </p>
            ))}
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-center">
            <p className="max-w-sm text-sm leading-6 text-zinc-500">
              ارفع ملف تعليق صوتي لمعاينة النص الموقّت زمنيًا في هذه المساحة.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
