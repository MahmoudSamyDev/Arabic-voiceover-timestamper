// Whisper requires 16 kHz mono Float32Array.
// OfflineAudioContext handles resampling and stereo downmix natively.
export async function decodeAudioToFloat32(
  file: File,
  targetSampleRate = 16_000,
): Promise<Float32Array> {
  const arrayBuffer = await file.arrayBuffer();

  // Decode at native sample rate first
  const audioCtx = new AudioContext();
  const decoded = await audioCtx.decodeAudioData(arrayBuffer);
  await audioCtx.close();

  // Resample + downmix to 1-channel 16 kHz via OfflineAudioContext.
  // The spec mandates automatic stereo-to-mono downmix when channel counts differ.
  const offlineCtx = new OfflineAudioContext(
    1,                                              // output channels: mono
    Math.ceil(decoded.duration * targetSampleRate), // total output samples
    targetSampleRate,
  );

  const source = offlineCtx.createBufferSource();
  source.buffer = decoded;
  source.connect(offlineCtx.destination);
  source.start(0);

  const resampled = await offlineCtx.startRendering();
  return resampled.getChannelData(0);
}
