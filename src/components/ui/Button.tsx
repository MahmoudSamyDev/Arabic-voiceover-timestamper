import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "danger";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  icon?: ReactNode;
  variant?: ButtonVariant;
};

const variants: Record<ButtonVariant, string> = {
  primary:
    "border-zinc-950 bg-zinc-950 text-white hover:bg-zinc-800 hover:border-zinc-800",
  secondary:
    "border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50 hover:border-zinc-300",
  danger:
    "border-red-200 bg-white text-red-700 hover:bg-red-50 hover:border-red-300",
};

export function Button({
  children,
  className = "",
  icon,
  variant = "secondary",
  ...props
}: ButtonProps) {
  return (
    <button
      className={[
        "inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-colors",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-950",
        "disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        className,
      ].join(" ")}
      type="button"
      {...props}
    >
      {icon}
      <span>{children}</span>
    </button>
  );
}
