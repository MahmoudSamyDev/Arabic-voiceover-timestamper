import { pipeline, env } from '@huggingface/transformers';
import type { AutomaticSpeechRecognitionPipeline } from '@huggingface/transformers';

// Cache model weights in the browser's Cache API after first download.
env.useBrowserCache = true;
env.allowLocalModels = false; // flip to true after running the HF download guide
env.allowRemoteModels = true;

// ── Message types ─────────────────────────────────────────────────────────────

type InMsg =
  | { type: 'LOAD_MODEL'; modelId: string }
  | { type: 'TRANSCRIBE'; audio: Float32Array };

type OutMsg =
  | { type: 'MODEL_PROGRESS'; file: string; progress: number }
  | { type: 'MODEL_READY' }
  | { type: 'TRANSCRIPTION_DONE'; chunks: Chunk[] }
  | { type: 'ERROR'; message: string };

type Chunk = { text: string; timestamp: [number, number] };

// ── State ─────────────────────────────────────────────────────────────────────

let transcriber: AutomaticSpeechRecognitionPipeline | null = null;

// ── Handler ───────────────────────────────────────────────────────────────────

self.addEventListener('message', async (event: MessageEvent<InMsg>) => {
  const msg = event.data;

  if (msg.type === 'LOAD_MODEL') {
    try {
      transcriber = await pipeline('automatic-speech-recognition', msg.modelId, {
        dtype: 'fp32',
        progress_callback: (info: Record<string, unknown>) => {
          if (info.status === 'progress') {
            self.postMessage({
              type: 'MODEL_PROGRESS',
              file: info.file as string,
              progress: info.progress as number,
            } satisfies OutMsg);
          }
        },
      });
      self.postMessage({ type: 'MODEL_READY' } satisfies OutMsg);
    } catch (err) {
      self.postMessage({ type: 'ERROR', message: String(err) } satisfies OutMsg);
    }
  }

  if (msg.type === 'TRANSCRIBE') {
    if (!transcriber) {
      self.postMessage({ type: 'ERROR', message: 'Model not loaded' } satisfies OutMsg);
      return;
    }
    try {
      const result = await transcriber(msg.audio, {
        return_timestamps: true,
        chunk_length_s: 30,
        stride_length_s: 5,
        num_beams: 5,  // beam search: fewer substitution errors vs greedy decoding
        language: 'arabic', // pin decoding to Arabic instead of relying on auto-detection
        task: 'transcribe',
      });
      const output = Array.isArray(result) ? result[0] : result;
      type RawChunk = { text: string; timestamp: [number, number] };
      const rawChunks = (output.chunks ?? []) as RawChunk[];
      const chunks: Chunk[] = rawChunks
        .filter(c => c.text.trim())
        .map(c => ({ text: c.text.trim(), timestamp: c.timestamp }));
      self.postMessage({ type: 'TRANSCRIPTION_DONE', chunks } satisfies OutMsg);
    } catch (err) {
      self.postMessage({ type: 'ERROR', message: String(err) } satisfies OutMsg);
    }
  }
});
