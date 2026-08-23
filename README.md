# Arabic Voiceover Timestamper

A browser-based tool that turns an Arabic audio file into a timestamped Arabic transcript. Everything runs client-side — there is no server, no API key, and no audio ever leaves the device. The interface is Arabic and right-to-left throughout.

Transcription is powered by OpenAI's Whisper model, running in-browser via [Transformers.js](https://github.com/huggingface/transformers.js) and ONNX Runtime, executing off the main thread in a Web Worker so the interface stays responsive.

## Features

- Drag-and-drop or file-picker upload for MP3, WAV, M4A, and AAC
- Fully offline transcription after the first model download (cached by the browser)
- Transcription is pinned to Arabic, with automatic cleanup of the recognized text: stray diacritics and tatweel are stripped, punctuation is normalized to Arabic form, and digits are converted to Arabic-Indic numerals
- Timestamped transcript lines (`MM:SS`, kept in Western digits so timecodes stay compatible with video editors), chunked for long recordings
- Live progress reporting for both model download and transcription
- Copy-to-clipboard or `.txt` file export, with Arabic filenames preserved
- No account, no server, no per-request cost

## Tech stack

- React 19 + TypeScript (strict mode)
- Vite 8
- Tailwind CSS 4 (RTL layout via logical properties, no plugin required)
- `@huggingface/transformers` (Transformers.js) for in-browser Whisper inference

## Getting started

### Prerequisites

- Node.js 20 or later

### Install and run

```bash
npm install
npm run dev
```

The app is served locally with hot module reloading. On first use it downloads the Whisper model (`Xenova/whisper-small`, a multilingual checkpoint, ~490 MB) from the Hugging Face CDN and caches it in the browser for future sessions. The larger multilingual model is used because Whisper's smaller checkpoints are noticeably weaker on Arabic than on European languages.

### Other scripts

```bash
npm run build     # Type-check and build for production (output: dist/)
npm run lint      # Run ESLint
npm run preview   # Serve the production build locally
```

## How it works

1. An uploaded audio file is validated and its duration is read.
2. The Whisper model loads (from cache after the first run) in a Web Worker.
3. The audio is decoded and resampled to 16 kHz mono.
4. Whisper transcribes the audio in overlapping chunks, decoding with the language pinned to Arabic, off the main thread.
5. Recognized text is normalized (diacritics, punctuation, digits) and rendered as timestamped lines, ready to copy or export as a `.txt` file.

## Browser requirements

Multi-threaded inference requires `SharedArrayBuffer`, which in turn requires the `Cross-Origin-Opener-Policy` and `Cross-Origin-Embedder-Policy` headers. These are set automatically by Vite's dev and preview servers. If you deploy the production build behind your own host or reverse proxy, set the same two headers there, or transcription will not work.

Because of these headers, the app cannot be embedded in a cross-origin iframe.

## Privacy

Audio is processed entirely on-device. The only network request is the one-time Whisper model download; after that, the app works fully offline.

## Project structure

```
src/
├── components/   Shared UI primitives
├── features/     Upload, processing, transcript, and export sections
├── pages/        Top-level page that wires everything together
├── hooks/        Transcription workflow state machine
├── services/     Whisper worker wrapper
├── workers/      Whisper inference (runs off the main thread)
├── utils/        Audio decoding, Arabic text normalization, transcript formatting
└── types/        Shared TypeScript types
```
