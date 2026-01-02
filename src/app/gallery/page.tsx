'use client';

import Link from "next/link";
import { useState } from "react";
import {
  getCardArtCandidates,
  getCardArtUrl,
  listCardsByFaction,
  type CardDefinition,
  type Faction,
} from "@/domain/cards";

export default function GalleryPage() {
  const [refresh, setRefresh] = useState(0);

  const factions: Faction[] = ["COSSACKS", "TATARS", "POLAND", "MUSCOVY", "NEUTRAL"];
  const rows = factions.map((faction) => ({
    faction,
    defs: listCardsByFaction(faction),
    refreshKey: refresh,
  }));

  return (
    <main className="min-h-screen w-full bg-neutral-950 text-white pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] flex flex-col">
      <div className="mx-auto w-full max-w-[420px] flex-1 px-4 py-6 space-y-4">
        <header className="flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-widest opacity-40 font-black">Developer Tool</div>
            <h1 className="text-2xl font-black">Asset Gallery</h1>
            <p className="text-sm opacity-70">Validate card art assets under /public/cards/&lt;faction&gt;/</p>
          </div>
          <div className="flex gap-2">
            <Link href="/" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold uppercase tracking-widest">
              Home
            </Link>
            <button
              onClick={() => setRefresh((x) => x + 1)}
              className="rounded-lg border border-white/10 bg-white px-3 py-2 text-xs font-black uppercase tracking-widest text-black"
            >
              Refresh
            </button>
          </div>
        </header>

        {rows.map(({ faction, defs }) => (
          <section key={faction} className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-widest opacity-80">{faction}</h2>
              {defs.length === 0 && <span className="text-[11px] uppercase tracking-wider opacity-40">0 cards registered</span>}
            </div>
            <div className="space-y-3">
              {defs.map((def) => (
                <AssetRow key={`${def.id}-${refresh}`} def={def} />
              ))}
            </div>
          </section>
        ))}

        <footer className="pt-4 border-t border-white/10 text-[11px] uppercase tracking-wider opacity-40">
          Registry source: src/domain/cards/registry.ts
        </footer>
      </div>
    </main>
  );
}

type AssetRowProps = {
  def: CardDefinition;
};

function AssetRow({ def }: AssetRowProps) {
  const [status, setStatus] = useState<"PENDING" | "FOUND" | "MISSING">("PENDING");
  const [sourceIndex, setSourceIndex] = useState(0);
  const sources = getCardArtCandidates(def.id);
  const src = getCardArtUrl(def.id, { attempt: sourceIndex });

  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
      <div
        className={[
          "px-2 py-1 text-[10px] font-black uppercase tracking-widest rounded",
          status === "FOUND" ? "bg-green-500/20 text-green-200" : status === "MISSING" ? "bg-red-500/20 text-red-200" : "bg-yellow-500/20 text-yellow-100",
        ].join(" ")}
      >
        {status === "PENDING" ? "LOADING" : status}
      </div>
      <div className="flex-1">
        <div className="text-sm font-semibold">{def.displayName ?? def.id}</div>
        <div className="text-[10px] uppercase tracking-wider opacity-50">{def.faction} • {def.unitType} • {def.kind}</div>
      </div>
      <div className="h-16 w-12 overflow-hidden rounded-lg bg-black/30 border border-white/10 shadow">
        <AssetThumb
          src={src}
          onFound={() => setStatus("FOUND")}
          onMissing={() => setStatus("MISSING")}
          onFallback={() => setSourceIndex((prev) => Math.min(prev + 1, sources.length - 1))}
          isFallback={sourceIndex >= sources.length - 1}
        />
      </div>
    </div>
  );
}

function AssetThumb({
  src,
  onFound,
  onMissing,
  onFallback,
  isFallback,
}: {
  src: string;
  onFound: () => void;
  onMissing: () => void;
  onFallback: () => void;
  isFallback: boolean;
}) {
  // Try candidates in order; mark missing if all fail.
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={src}
        src={src}
        alt="Card art"
        className="h-full w-full object-cover"
        onLoad={() => {
          if (isFallback) {
            onMissing();
          } else {
            onFound();
          }
        }}
        onError={() => {
          if (!isFallback) {
            onFallback();
          } else {
            onMissing();
          }
        }}
      />
    </>
  );
}
