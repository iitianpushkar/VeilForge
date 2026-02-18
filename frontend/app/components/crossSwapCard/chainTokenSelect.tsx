"use client";

import {CHAINS} from "./chains"
import { ChainWithTokens } from "@/app/types/chains";

export default function ChainTokenSelect({
  onClose,
  onSelectChain,
}: {
  onClose: () => void;
  onSelectChain: (chain: ChainWithTokens) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div className="w-[340px] rounded-3xl bg-white/70 backdrop-blur-xl border border-black/5 p-5 shadow-lg">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-black font-medium">Select chain</h2>
          <button onClick={onClose} className="text-black/40 hover:text-black transition">
            ✕
          </button>
        </div>

        <div className="space-y-1">
          {CHAINS.map((chain) => (
            <button
              key={chain.eid}
              onClick={() => onSelectChain(chain)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl hover:bg-black/5 transition"
            >
              <div className="h-8 w-8 rounded-full bg-black/5" />
              <span className="text-sm font-medium text-black">{chain.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
