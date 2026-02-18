"use client";

import { useState } from "react";
import ChainTokenSelect from "./chainTokenSelect";
import { Chain } from "../../types/chains";

type Props = {
  label: string;
  chain: string;
  token: string;
  value?: string;
  readOnly?: boolean;
  hint?: string;
  onChange?: (v: string) => void;
  onSelectChain?: (chain: Chain) => void;
};

export default function TokenBox({
  label,
  chain,
  token,
  value,
  readOnly,
  hint,
  onChange,
  onSelectChain,
}: Props) {
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
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-black/5" />
            <span className="font-medium text-black">{token}</span>
          </div>

          <input
            value={value}
            readOnly={readOnly}
            onChange={(e) => onChange?.(e.target.value)}
            placeholder="0"
            inputMode="decimal"
            className="w-28 bg-transparent text-right text-lg font-medium text-black outline-none placeholder:text-black/30"
          />
        </div>

        {hint && (
          <div className="mt-1 text-xs text-black/40">
            {hint}
          </div>
        )}
      </div>

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
