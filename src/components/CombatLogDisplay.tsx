'use client';

type Props = {
  lines: string[];
  maxLines?: number;
  variant?: "compact" | "overlay";
  className?: string;
};

export function CombatLogDisplay({ lines, maxLines = 3, variant = "compact", className = "" }: Props) {
  if (!lines || lines.length === 0) return null;
  const slice = lines.slice(-maxLines);

  const base =
    "rounded-xl border text-[10px] font-mono leading-relaxed transition-all duration-200";
  const style =
    variant === "overlay"
      ? "bg-black/60 border-white/15 text-white shadow-lg"
      : "bg-white/5 border-white/10 text-white/80";

  return (
    <div className={[base, style, className].join(" ")}>
      <ul className="space-y-1 px-3 py-2">
        {slice.map((line, idx) => (
          <li key={idx} className="truncate">
            • {line}
          </li>
        ))}
      </ul>
    </div>
  );
}
