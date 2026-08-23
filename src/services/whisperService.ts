// Vite resolves this URL and bundles the worker as a separate module chunk.
const WORKER_URL = new URL('../workers/whisper.worker.ts', import.meta.url);

export type TranscriptChunk = {
  text: string;
  timestamp: [number, number]; // [startSecs, endSecs]
};

type LoadOptions = {
  modelId: string;
  onProgress?: (file: string, progress: number) => void;
};

class WhisperService {
  private worker: Worker | null = null;
  private loadPromise: Promise<void> | null = null;

  loadModel(opts: LoadOptions): Promise<void> {
    // Called again while loading? Return the same promise.
    if (this.loadPromise) return this.loadPromise;

    this.worker = new Worker(WORKER_URL, { type: 'module' });

    this.loadPromise = new Promise((resolve, reject) => {
      const w = this.worker!;
      w.addEventListener('message', ({ data }) => {
        if (data.type === 'MODEL_PROGRESS') opts.onProgress?.(data.file, data.progress);
        if (data.type === 'MODEL_READY') resolve();
        if (data.type === 'ERROR') reject(new Error(data.message));
      });
      w.postMessage({ type: 'LOAD_MODEL', modelId: opts.modelId });
    });

    return this.loadPromise;
  }

  transcribe(audio: Float32Array): Promise<TranscriptChunk[]> {
    return new Promise((resolve, reject) => {
      if (!this.worker) { reject(new Error('Model not loaded')); return; }

      const w = this.worker;
      const handler = ({ data }: MessageEvent) => {
        if (data.type === 'TRANSCRIPTION_DONE') { w.removeEventListener('message', handler); resolve(data.chunks); }
        if (data.type === 'ERROR')               { w.removeEventListener('message', handler); reject(new Error(data.message)); }
      };
      w.addEventListener('message', handler);

      // Transfer the ArrayBuffer — zero-copy. Main thread gives up ownership.
      w.postMessage({ type: 'TRANSCRIBE', audio }, [audio.buffer]);
    });
  }
}

// Singleton — one worker, shared across all uploads in a session.
export const whisperService = new WhisperService();
