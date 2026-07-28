"use client";

import { useState } from "react";
import V1 from "./components/V1";
import V2 from "./components/V2";

const VERSIONS = [V1, V2];

export default function Home() {
  const [v, setV] = useState(0);
  const Active = VERSIONS[v];

  return (
    <>
      <Active />
      {/* version switcher */}
      <div className="fixed bottom-4 right-4 z-50 flex gap-1 rounded-full bg-black/70 backdrop-blur-md border border-white/15 p-1 shadow-xl">
        {VERSIONS.map((_, i) => (
          <button
            key={i}
            onClick={() => setV(i)}
            className={`w-8 h-8 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
              v === i
                ? "bg-white text-black"
                : "text-white/70 hover:text-white hover:bg-white/10"
            }`}
          >
            v{i + 1}
          </button>
        ))}
      </div>
    </>
  );
}
