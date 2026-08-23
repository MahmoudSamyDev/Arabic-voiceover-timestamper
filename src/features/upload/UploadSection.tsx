import { FileAudio, UploadCloud } from "lucide-react";
import { useRef, useState } from "react";
import { Card } from "../../components/ui/Card";
import { readAudioDuration } from "../../hooks/useAudioMetadata";
import type { AudioFileInfo } from "../../types/app";
import { formatDuration, formatFileSize } from "../../utils/format";

const acceptedExtensions = [".mp3", ".wav", ".m4a", ".aac"];
const acceptedMimeTypes = [
  "audio/mpeg",
  "audio/wav",
  "audio/x-wav",
  "audio/mp4",
  "audio/x-m4a",  // macOS / iTunes
  "video/mp4",    // Windows often reports M4A as video/mp4
  "audio/aac",
  "audio/x-aac",
];

type UploadSectionProps = {
  audioFile: AudioFileInfo | null;
  onError: (message: string) => void;
  onFileSelected: (fileInfo: AudioFileInfo) => void;
};

export function UploadSection({
  audioFile,
  onError,
  onFileSelected,
}: UploadSectionProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = async (file?: File) => {
    if (!file) {
      return;
    }

    const extension = `.${file.name.split(".").pop()?.toLowerCase() ?? ""}`;
    const hasAcceptedExtension = acceptedExtensions.includes(extension);
    const hasAcceptedMimeType =
      file.type === "" || acceptedMimeTypes.includes(file.type);

    if (!hasAcceptedExtension || !hasAcceptedMimeType) {
      onError("يرجى رفع ملف صوتي بصيغة مدعومة.");
      return;
    }

    try {
      const duration = await readAudioDuration(file);
      onFileSelected({
        duration,
        file,
        name: file.name,
        size: file.size,
      });
    } catch {
      onFileSelected({
        duration: null,
        file,
        name: file.name,
        size: file.size,
      });
    }
  };

  return (
    <Card
      aria-labelledby="upload-heading"
      description="أفلت تسجيل التعليق الصوتي هنا، أو تصفّح من جهازك."
      title="رفع الصوت"
    >
      <div
        className={[
          "flex min-h-64 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-6 py-10 text-center transition-colors",
          isDragging
            ? "border-zinc-900 bg-zinc-50"
            : "border-zinc-300 bg-zinc-50/60 hover:border-zinc-400 hover:bg-zinc-50",
        ].join(" ")}
        onClick={() => inputRef.current?.click()}
        onDragEnter={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setIsDragging(false);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          void handleFile(event.dataTransfer.files[0]);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        role="button"
        tabIndex={0}
      >
        <input
          accept=".mp3,.wav,.m4a,.aac,audio/mpeg,audio/wav,audio/x-wav,audio/mp4,audio/aac"
          aria-label="اختر ملفًا صوتيًا"
          className="sr-only"
          onChange={(event) => void handleFile(event.target.files?.[0])}
          ref={inputRef}
          type="file"
        />
        <div className="mb-5 flex size-14 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700 shadow-sm">
          <UploadCloud aria-hidden="true" size={24} strokeWidth={1.8} />
        </div>
        <p className="text-lg font-semibold text-zinc-950">
          أفلت الملف الصوتي هنا أو انقر للتصفح
        </p>
        <p className="mt-2 max-w-md text-sm leading-6 text-zinc-500">
          يدعم الملفات الصوتية الشائعة.
        </p>
      </div>

      {audioFile && (
        <div className="mt-5 grid gap-3 rounded-xl border border-zinc-200 bg-white p-4 sm:grid-cols-[1fr_auto_auto] sm:items-center">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700">
              <FileAudio aria-hidden="true" size={20} strokeWidth={1.8} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-zinc-950">
                {audioFile.name}
              </p>
              <p className="text-xs text-zinc-500">الملف الصوتي المحدد</p>
            </div>
          </div>
          <p className="text-sm text-zinc-600">{formatFileSize(audioFile.size)}</p>
          <p className="text-sm text-zinc-600">
            {formatDuration(audioFile.duration)}
          </p>
        </div>
      )}
    </Card>
  );
}
