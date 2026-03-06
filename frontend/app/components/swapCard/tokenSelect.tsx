"use client";

import Image from "next/image";
import { Token } from "../../types/tokens";
import { TOKENS } from "./tokens";

function getTokenLogo(symbol: string): string | null {
  const upper = symbol.toUpperCase();
  if (upper === "ETH") return "/eth.png";
  if (upper === "WETH") return "/weth.png";
  if (upper === "USDC") return "/usdc.png";
  if(upper === "USDT") return "/jj.png"
  return null;
}

export default function TokenSelect({
  onClose,
  onSelect,
}: {
  onClose: () => void;
  onSelect: (token: Token) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div className="w-[360px] rounded-3xl bg-white/70 backdrop-blur-xl border border-black/5 p-5 shadow-lg">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-black font-medium">Select a token</h2>
          <button
            onClick={onClose}
            className="text-black/40 hover:text-black transition"
          >
            ✕
          </button>
        </div>

        <div className="space-y-1">
          {TOKENS.map((token) => {
            const logoSrc = getTokenLogo(token.symbol);
            return (
              <button
                key={token.symbol}
                onClick={() => onSelect(token)}
                className="
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl
                  hover:bg-black/5 transition
                "
              >
                {logoSrc ? (
                  <Image
                    src={logoSrc}
                    alt={token.symbol}
                    width={32}
                    height={32}
                    className="h-8 w-8 rounded-full"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-black/5" />
                )}
                <div className="text-left">
                  <div className="text-sm font-medium text-black">
                    {token.symbol}
                  </div>
                  <div className="text-xs text-black/40">{token.name}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
