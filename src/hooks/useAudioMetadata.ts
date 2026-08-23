export function readAudioDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const audio = document.createElement("audio");
    const objectUrl = URL.createObjectURL(file);

    const cleanup = () => {
      URL.revokeObjectURL(objectUrl);
      audio.removeAttribute("src");
      audio.load();
    };

    audio.preload = "metadata";
    audio.src = objectUrl;

    audio.onloadedmetadata = () => {
      const duration = audio.duration;
      cleanup();

      if (Number.isFinite(duration)) {
        resolve(duration);
      } else {
        reject(new Error("تعذّرت قراءة مدة الملف الصوتي."));
      }
    };

    audio.onerror = () => {
      cleanup();
      reject(new Error("تعذّرت قراءة الملف المحدد كملف صوتي."));
    };
  });
}
