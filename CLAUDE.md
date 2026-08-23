# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start Vite dev server with HMR
npm run build     # TypeScript type check (tsc -b) + Vite production build → dist/
npm run lint      # ESLint static analysis
npm run preview   # Serve production build locally
```

No test runner is configured.

## Architecture

React 19 + TypeScript + Vite + Tailwind CSS 4 app that transcribes uploaded Arabic voiceover audio into a timestamped Arabic transcript, using **Whisper running entirely in the browser** via `@huggingface/transformers` and a Web Worker. No server. No API key. Offline after the first model download. The UI is Arabic/RTL end to end (`index.html` sets `dir="rtl" lang="ar"`).

### Two-thread model

The app runs two threads:

- **Main thread** — React UI, Web Audio API (`OfflineAudioContext` for decoding/resampling), state management
- **Web Worker** (`src/workers/whisper.worker.ts`) — owns the Whisper model for its full lifecycle, runs ONNX inference so the UI never freezes

They communicate by message passing. Audio goes in as a transferable `Float32Array` (zero-copy), transcript chunks come back as JSON.

```
Main Thread                         Web Worker
     │──── LOAD_MODEL { modelId } ──────────▶│  downloads from HF CDN
     │◀─── MODEL_PROGRESS { file, % } ───────│  or reads from Cache API
     │◀─── MODEL_READY ──────────────────────│
     │──── TRANSCRIBE { audio: Float32Array }▶│  ONNX inference, 30s chunks
     │◀─── TRANSCRIPTION_DONE { chunks[] } ──│
```

### State machine via custom hook

All application state lives in `src/hooks/useTranscriptWorkflow.ts`:

```
"idle" → "file-selected" → "model-loading" → "processing" → "completed"
                                                           ↘ "error"
```

`TimestampGeneratorPage` consumes this hook and distributes state + handlers to child components as props — components are stateless relative to workflow state.

The hook uses a `sessionRef` (incremented on each `reset()` and `selectFile()`) to guard all async continuations with a `stale()` check — abandoned uploads cannot update state after a new file is selected.

### Key data flow

1. `UploadSection` validates the file (MP3/WAV/M4A/AAC by both extension and MIME type), calls `readAudioDuration()` to populate `AudioFileInfo.duration`, then calls `selectFile()`. Validation failures call `onError` directly — bypassing the state machine.
2. `selectFile()` immediately calls `startProcessing()` — no effect needed.
3. **Phase A** (`model-loading`): `whisperService.loadModel()` — downloads `Xenova/whisper-small` (multilingual) from HuggingFace CDN on first use, then serves from the browser Cache API. Progress updates drive the first 40% of the progress bar.
4. **Phase B** (`processing`): `decodeAudioToFloat32()` in `src/utils/audioProcessing.ts` uses `OfflineAudioContext` to resample the file to 16 kHz mono `Float32Array` (the exact format Whisper requires).
5. **Phase C** (`processing`): `whisperService.transcribe(audio)` transfers the buffer to the worker — the main thread gives up ownership. Whisper decodes with `language: 'arabic', task: 'transcribe'` pinned (no auto-detection, no language picker — the app is Arabic-only by design), in 30-second windows with 5-second overlap (`chunk_length_s: 30, stride_length_s: 5`), using beam search with `num_beams: 5`.
6. Chunks are mapped to `TranscriptLine[]`: `toTimestamp()` converts seconds → `MM:SS` (kept in Western digits — timecodes stay tool/editor-universal), and `normalizeArabicText()` from `src/utils/arabicText.ts` cleans the recognized text (strips stray tashkeel/diacritics and tatweel, maps Western punctuation to Arabic form `، ؛ ؟`, converts Western digits within spoken content to Arabic-Indic `٠-٩`).
7. Export: clipboard copy or `.txt` download via `transcriptToText()` in `src/utils/format.ts` (`[MM:SS] Text\n\n` format, lines joined by `\n\n`); filename sanitized in `TimestampGeneratorPage.tsx` with a Unicode-aware regex (`\p{L}\p{N}` property escapes) so Arabic-named source files keep their name instead of collapsing to a generic fallback.

### Feature-based component layout

```
src/
├── components/ui/          # Primitive, reusable: Button, Card, ProgressBar
├── features/               # Feature slices (upload/, processing/, transcript/, export/)
├── pages/                  # TimestampGeneratorPage — assembles feature components
├── hooks/                  # useTranscriptWorkflow (state machine), useAudioMetadata.ts (exports readAudioDuration — uses HTMLAudioElement to read file duration, not the Web Audio API)
├── services/                # whisperService.ts — owns the Whisper worker
├── workers/                # whisper.worker.ts — Whisper ONNX inference off main thread
├── utils/                  # audioProcessing.ts (decode/resample), format.ts (export), arabicText.ts (normalizeArabicText — diacritics/punctuation/digit cleanup)
└── types/app.ts            # AppState, AudioFileInfo, TranscriptLine, ModelDownloadProgress
```

### Whisper service singleton

`src/services/whisperService.ts` exposes a module-level singleton (`whisperService`). `loadModel()` is idempotent — if called again while loading, it returns the same promise. The worker is created with `{ type: 'module' }` via Vite's `new URL('../workers/whisper.worker.ts', import.meta.url)` pattern, which bundles the worker as a separate chunk.

### Model selection

Currently hardcoded in `useTranscriptWorkflow.ts` as `MODEL_ID = "Xenova/whisper-small"` — a **multilingual** checkpoint (no `.en` suffix; `.en` variants are English-only and can't transcribe Arabic). `small` is the minimum size that gives usably accurate Arabic output — Whisper's smaller multilingual checkpoints (`tiny`/`base`) are noticeably weaker on Arabic specifically than on European languages. Available multilingual sizes: `whisper-tiny` (~78 MB), `whisper-base` (~145 MB), `whisper-small` (~490 MB, current default) — trading size/speed for accuracy. Language is pinned via `language: 'arabic', task: 'transcribe'` in `whisper.worker.ts`, not user-selectable.

### Offline-first model hosting

By default the model downloads from HuggingFace CDN and is cached by the browser's Cache API. To host the model locally:

```bash
pip install huggingface_hub
huggingface-cli download Xenova/whisper-small \
  --local-dir ./public/models/Xenova/whisper-small \
  --include "*.json" "onnx/*.onnx"
echo "public/models/" >> .gitignore
```

Then in `whisper.worker.ts` flip: `env.allowLocalModels = true`, `env.allowRemoteModels = false`, add `env.localModelPath = '/models/'`.

### Runtime requirement: SharedArrayBuffer

Multi-threaded ONNX Runtime requires `SharedArrayBuffer`, which requires two HTTP headers. `vite.config.ts` sets them on both `server` and `preview`:

```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

Side effect: the app cannot be embedded in cross-origin iframes. `@huggingface/transformers` is excluded from `optimizeDeps` because it loads WASM dynamically at runtime and breaks if pre-bundled. If self-hosting the production build, replicate both headers at the reverse proxy / static host level.

### TypeScript config

Strict mode with `noUnusedLocals`, `noUnusedParameters`, and `erasableSyntaxOnly`. Two tsconfig files: `tsconfig.app.json` (browser) and `tsconfig.node.json` (Vite config), composed via `tsconfig.json` project references.

### Styling

Tailwind CSS 4 via Vite plugin (`@tailwindcss/vite`). No custom CSS classes — only `@import "tailwindcss"` in `index.css`. Zinc palette throughout; responsive with `sm:` breakpoints.

RTL: the whole app is right-to-left (`dir="rtl"` on `<html>` in `index.html`), relying on Tailwind v4's native logical-property utilities (`text-start`/`text-end`, `ps-`/`pe-`, `ms-`/`me-`) and its `:dir()`-based `rtl:`/`ltr:` variants — no plugin needed, and flex/grid main-axis direction mirrors automatically. The one exception is each transcript line's `[MM:SS]` timestamp span, which is explicitly marked `dir="ltr"` so Western digits/brackets don't get reordered by the bidi algorithm inside the surrounding Arabic (RTL) paragraph.

### ESLint

Flat config (`eslint.config.js`). Extends TypeScript-recommended + React Hooks + React Refresh rules. Ignores `dist/`.

### Non-app files at repo root

`whisperIntegration.html` is a standalone, self-contained design/planning document (not linked from `src/`, not part of the Vite build) — ignore it when reasoning about the running app.
