'use client';

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CARD_REGISTRY, getCardsByFaction, getCardArtUrl, type CardDefinition, type Faction } from "@/domain/cards";

export default function GalleryPage() {
  const [mounted, setMounted] = useState(false);
  const [refresh, setRefresh] = useState(0);

  // Hydration guard: render only after client mount to avoid SSR/CSR mismatch for dev-only gallery.
  useEffect(() => {
    setMounted(true);
  }, []);

  const rows = useMemo(() => {
    const factions: Faction[] = ["COSSACKS", "TATARS", "POLAND"];
    return factions.map((faction) => ({
      faction,
      defs: getCardsByFaction(faction),
    }));
  }, [refresh]);

  if (!mounted) return null;

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

  const sources = [
    getCardArtUrl(def.art, { preferredExt: "webp", fallbackExts: ["png"], faction: def.faction }),
    getCardArtUrl(def.art, { preferredExt: "png", faction: def.faction }),
  ];
  const src = sources[sourceIndex] ?? getCardArtUrl(def.art, { preferredExt: "png", faction: def.faction });

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
        <div className="text-sm font-semibold">{def.label || def.id}</div>
        <div className="text-[10px] uppercase tracking-wider opacity-50">{def.faction} • {def.unitType} • {def.tier}</div>
      </div>
      <div className="h-16 w-12 overflow-hidden rounded-lg bg-black/30 border border-white/10 shadow">
        <AssetThumb
          src={src}
          fallbackSrc={getCardArtUrl(def.art, { preferredExt: "png", faction: def.faction })}
          onFound={() => setStatus("FOUND")}
          onMissing={() => setStatus("MISSING")}
          onFallback={() => setSourceIndex(1)}
          isFallback={sourceIndex === 1}
        />
      </div>
    </div>
  );
}

function AssetThumb({
  src,
  fallbackSrc,
  onFound,
  onMissing,
  onFallback,
  isFallback,
}: {
  src: string;
  fallbackSrc: string;
  onFound: () => void;
  onMissing: () => void;
  onFallback: () => void;
  isFallback: boolean;
}) {
  // First try WEBP, then fall back to PNG; mark missing if both fail.
  return (
    <img
      key={src}
      src={src}
      alt="Card art"
      className="h-full w-full object-cover"
      onLoad={onFound}
      onError={() => {
        if (!isFallback) {
          onFallback();
        } else {
          onMissing();
        }
      }}
    />
  );
}
