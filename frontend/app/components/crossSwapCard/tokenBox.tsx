"use client";

import { useState } from "react";
import TokenSelect from "./tokenSelect";
import { Token } from "../../types/tokens";
import { ChainWithTokens } from "../../types/chains";
import ChainTokenSelect from "./chainTokenSelect"

type Props = {
  label: string;
  chain: string;
  token: string;
  value?: string;
  readOnly?: boolean;
  hint?: string;
  onChange?: (v: string) => void;
  availableTokens?: Token[];
  onSelectToken?: (token: Token) => void;
  onSelectChain?: (chain: ChainWithTokens) => void; // ✅ FIX
};


export default function TokenBox({
  label,
  chain,
  token,
  value,
  readOnly,
  hint,
  onChange,
  availableTokens,
  onSelectToken,
  onSelectChain,
}: Props) {
  const [openToken, setOpenToken] = useState(false);
  const [openChain, setOpenChain] = useState(false);

  return (
    <>
      <div className="rounded-2xl border border-black/5 bg-white/70 backdrop-blur px-4 py-3">
        <div className="flex justify-between text-xs text-black/40">
          <span>{label}</span>

          <button
            onClick={() => onSelectChain && setOpenChain(true)}
            className="text-black/50 hover:text-black transition"
          >
            {chain} ▾
          </button>
        </div>

        <div className="mt-2 flex items-center justify-between">
          <button
            onClick={() => onSelectToken && setOpenToken(true)}
            className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-black/5 transition"
          >
            <div className="h-8 w-8 rounded-full bg-black/5" />
            <span className="font-medium text-black">{token}</span>
            {onSelectToken && <span className="text-black/40 text-xs">▾</span>}
          </button>

          <input
            value={value}
            readOnly={readOnly}
            onChange={(e) => onChange?.(e.target.value)}
            placeholder="0"
            inputMode="decimal"
            className="w-28 bg-transparent text-right text-lg font-medium text-black outline-none placeholder:text-black/30"
          />
        </div>
      </div>

      {/* Token modal */}
      {openToken && onSelectToken && availableTokens && (
        <TokenSelect
          tokens={availableTokens}
          onClose={() => setOpenToken(false)}
          onSelect={(t) => {
            onSelectToken(t);
            setOpenToken(false);
          }}
        />
      )}

      {/* Chain */}
      {openChain && onSelectChain && (
        <ChainTokenSelect
          onClose={() => setOpenChain(false)}
          onSelectChain={(c) => {
            onSelectChain(c);
            setOpenChain(false);
          }}
        />
      )}
    </>
  );
}
