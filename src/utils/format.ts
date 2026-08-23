export function formatFileSize(bytes: number): string {
  if (bytes === 0) {
    return "0 كيلوبايت";
  }

  const units = ["بايت", "كيلوبايت", "ميغابايت", "غيغابايت"];
  const unitIndex = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const value = bytes / 1024 ** unitIndex;

  return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

export function formatDuration(seconds: number | null): string {
  if (seconds === null || Number.isNaN(seconds)) {
    return "جارٍ قراءة المدة...";
  }

  const totalSeconds = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;

  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

export function transcriptToText(
  lines: Array<{ timestamp: string; text: string }>,
): string {
  return lines.map((line) => `[${line.timestamp}] ${line.text}`).join("\n\n");
}
