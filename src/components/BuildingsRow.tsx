'use client';

import type { Building } from "@/game/gameState";

const BUILDING_ORDER: Array<{ type: Building["type"]; label: string }> = [
  { type: "FORT", label: "FORT" },
  { type: "BARRACKS", label: "BARRACKS" },
  { type: "STABLES", label: "STABLES" },
  { type: "ARCHERY_RANGE", label: "ARCHERY YARD" },
];

type Props = {
  title: string;
  buildings: Building[];
};

export function BuildingsRow({ title, buildings }: Props) {
  const byType = (type: Building["type"]) => buildings.find((b) => b.type === type);

  return (
    <div className="space-y-1">
      <div className="text-[10px] uppercase tracking-wider font-black opacity-40">{title}</div>
      <div className="flex flex-wrap gap-2">
        {BUILDING_ORDER.map(({ type, label }) => {
          const b = byType(type);
          const level = b ? b.level : 0;
          const active = b ? b.isActive : false;
          return (
            <div
              key={type}
              className={[
                "flex items-center gap-2 rounded-lg border px-3 py-2 text-[10px] uppercase tracking-wider",
                active ? "border-white/20 bg-white/10 text-white" : "border-white/10 bg-white/5 text-white/60",
              ].join(" ")}
            >
              <span className="font-bold">{label}</span>
              <span className="rounded bg-black/40 px-2 py-0.5 text-[9px] font-black">L{level}</span>
              {active && <span className="h-2 w-2 rounded-full bg-green-400" aria-label="active" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
