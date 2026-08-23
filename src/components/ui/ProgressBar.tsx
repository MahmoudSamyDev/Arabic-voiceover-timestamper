type ProgressBarProps = {
  value: number;
};

export function ProgressBar({ value }: ProgressBarProps) {
  const normalizedValue = Math.min(100, Math.max(0, value));

  return (
    <div
      aria-label="تقدّم المعالجة"
      aria-valuemax={100}
      aria-valuemin={0}
      aria-valuenow={normalizedValue}
      className="h-2 overflow-hidden rounded-full bg-zinc-100"
      role="progressbar"
    >
      <div
        className="h-full rounded-full bg-zinc-950 transition-[width] duration-500 ease-out"
        style={{ width: `${normalizedValue}%` }}
      />
    </div>
  );
}
