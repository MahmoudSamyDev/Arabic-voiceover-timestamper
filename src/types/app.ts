export type AppState =
  | "idle"
  | "file-selected"
  | "model-loading"
  | "processing"
  | "completed"
  | "error";

export type ModelDownloadProgress = {
  file: string;
  progress: number; // 0–100
};

export type AudioFileInfo = {
  file: File;
  name: string;
  size: number;
  duration: number | null;
};

export type TranscriptLine = {
  id: string;
  timestamp: string;
  text: string;
};
