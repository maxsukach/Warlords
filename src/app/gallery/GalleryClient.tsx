'use client';

import { useEffect, useMemo, useState } from "react";
import { PLACEHOLDER } from "@/lib/cardArtRegistry";
import type { ExpectedFile } from "@/lib/cardArtExpected";

type Status = "CHECKING" | "OK" | "MISSING";

type Props = {
  items: ExpectedFile[];
};

export function GalleryClient({ items }: Props) {
  const [statusMap, setStatusMap] = useState<Record<string, Status>>(() =>
    Object.fromEntries(items.map((i) => [i.expectedPath, "CHECKING"]))
  );

  const missingList = useMemo(
    () => items.filter((i) => statusMap[i.expectedPath] === "MISSING").map((i) => i.expectedPath),
    [items, statusMap],
  );

  useEffect(() => {
    let cancelled = false;
    const check = async (path: string) => {
      try {
        const res = await fetch(path, { method: "HEAD", cache: "no-store" });
        if (cancelled) return;
        setStatusMap((prev) => ({ ...prev, [path]: res.ok ? "OK" : "MISSING" }));
      } catch {
        if (cancelled) return;
        setStatusMap((prev) => ({ ...prev, [path]: "MISSING" }));
      }
    };
    items.forEach((item) => check(item.expectedPath));
    return () => {
      cancelled = true;
    };
  }, [items]);

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.warn("Clipboard copy failed", err);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <button
          onClick={() => copyText(JSON.stringify(missingList, null, 2))}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold uppercase tracking-widest"
        >
          Copy missing list
        </button>
        <span className="text-[11px] uppercase tracking-widest opacity-60">
          Missing: {missingList.length} / {items.length}
        </span>
      </div>

      <div className="space-y-2">
        {items.map((item) => {
          const status = statusMap[item.expectedPath] ?? "CHECKING";
          const previewSrc = status === "OK" ? item.expectedPath : PLACEHOLDER;
          const mismatch = item.expectedPath !== item.resolvedPath;
          return (
            <div
              key={`${item.faction}-${item.key}`}
              className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3"
            >
              <div
                className={[
                  "px-2 py-1 text-[10px] font-black uppercase tracking-widest rounded",
                  status === "OK"
                    ? "bg-green-500/20 text-green-200"
                    : status === "MISSING"
                    ? "bg-red-500/20 text-red-200"
                    : "bg-yellow-500/20 text-yellow-100",
                ].join(" ")}
              >
                {status}
              </div>

              <div className="flex flex-col gap-1 flex-1">
                <div className="text-sm font-semibold">
                  {item.faction.toUpperCase()} • {item.unit}
                </div>
                <div className="text-[11px] opacity-60 font-mono">{item.key}</div>
                <div className="text-[11px] opacity-80 font-mono break-all">
                  Expected: {item.expectedPath}
                  {mismatch && <span className="ml-2 rounded bg-orange-500/20 px-2 py-0.5 text-orange-100">Mismatch</span>}
                </div>
                {mismatch && (
                  <div className="text-[11px] opacity-80 font-mono break-all">Resolved: {item.resolvedPath}</div>
                )}
                <div className="flex gap-2 mt-1">
                  <button
                    onClick={() => copyText(item.expectedPath)}
                    className="rounded border border-white/10 bg-white/5 px-2 py-1 text-[11px]"
                  >
                    Copy expected path
                  </button>
                  <button
                    onClick={() => copyText(item.key)}
                    className="rounded border border-white/10 bg-white/5 px-2 py-1 text-[11px]"
                  >
                    Copy registry key
                  </button>
                </div>
              </div>

              <div className="h-16 w-12 overflow-hidden rounded-lg bg-black/30 border border-white/10 shadow">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  key={previewSrc}
                  src={previewSrc}
                  alt={item.key}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = PLACEHOLDER;
                    setStatusMap((prev) => ({ ...prev, [item.expectedPath]: "MISSING" }));
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
