import Link from "next/link";
import { notFound } from "next/navigation";
import { GalleryClient } from "./GalleryClient";
import { EXPECTED_FILES } from "@/lib/cardArtExpected";

export default function GalleryPage() {
  if (process.env.NODE_ENV !== "development") {
    return notFound();
  }

  return (
    <main className="min-h-screen w-full bg-neutral-950 text-white pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] flex flex-col">
      <div className="mx-auto w-full max-w-[480px] flex-1 px-4 py-6 space-y-4">
        <header className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-widest opacity-40 font-black">Developer Tool</div>
            <h1 className="text-2xl font-black">Card Art Diagnostics</h1>
            <p className="text-sm opacity-70">
              Validate expected assets under <code className="font-mono">/public/cards/&lt;faction&gt;/</code>
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/"
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold uppercase tracking-widest"
            >
              Home
            </Link>
          </div>
        </header>

        <GalleryClient items={EXPECTED_FILES} />

        <footer className="pt-4 border-t border-white/10 text-[11px] uppercase tracking-wider opacity-40">
          Registry source: src/lib/cardArtRegistry.ts • Expected list: src/lib/cardArtExpected.ts
        </footer>
      </div>
    </main>
  );
}
