import type { HTMLAttributes, ReactNode } from "react";

type CardProps = HTMLAttributes<HTMLElement> & {
  children: ReactNode;
  title?: string;
  description?: string;
};

export function Card({
  children,
  className = "",
  description,
  title,
  ...props
}: CardProps) {
  return (
    <section
      className={[
        "rounded-xl border border-zinc-200 bg-white p-6 shadow-[0_12px_30px_rgba(24,24,27,0.05)]",
        className,
      ].join(" ")}
      {...props}
    >
      {(title || description) && (
        <div className="mb-5">
          {title && (
            <h2 className="text-base font-semibold tracking-normal text-zinc-950">
              {title}
            </h2>
          )}
          {description && (
            <p className="mt-1 text-sm leading-6 text-zinc-500">{description}</p>
          )}
        </div>
      )}
      {children}
    </section>
  );
}
