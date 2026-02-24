"use client";

import Image from "next/image";
import { useState } from "react";
import TokenSelect from "./tokenSelect";
import { Token } from "../../types/tokens";
import { Chain } from "../../types/chains";

type Props = {
  label: string;
  chain: string;
  token: string;
  value?: string;
  onChange?: (v: string) => void;
  readOnly?: boolean;
  hint?: string;
  onSelectToken?: (token: Token) => void;
  onSelectChain?: (chain: Chain) => void;
};

function getTokenLogo(symbol: string): string | null {
  const upper = symbol.toUpperCase();
  if (upper === "ETH") return "/eth.png";
  if (upper === "WETH") return "/weth.png";
  if (upper === "USDC") return "/usdc.png";
  if(upper === "USDT") return "/usdt.png"
  return null;
}

export default function TokenBox({
  label,
  chain,
  token,
  value,
  readOnly,
  onChange,
  onSelectToken,
  onSelectChain,
}: Props) {
  const [openToken, setOpenToken] = useState(false);
  const [openChain, setOpenChain] = useState(false);

  const logoSrc = getTokenLogo(token);

  return (
    <>
      <div
        className="
          rounded-2xl
          border border-black/5
          bg-white/70
          backdrop-blur
          px-4
          py-3
        "
      >
        {/* Header */}
        <div className="flex justify-between items-center text-xs text-black/40">
          <span>{label}</span>

          {/* Chain selector */}
          <button
            onClick={() => onSelectChain && setOpenChain(true)}
            className="
              flex items-center gap-1
              text-black/50
              hover:text-black
              transition
            "
          >
            {chain}
            {onSelectChain && <span className="text-[10px]">▾</span>}
          </button>
        </div>

        {/* Main Row */}
        <div className="mt-2 flex items-center justify-between gap-3">
          {/* Token selector */}
          <button
            onClick={() => onSelectToken && setOpenToken(true)}
            className="
              flex items-center gap-2
              rounded-lg
              px-2
              py-1
              hover:bg-black/5
              transition
            "
          >
            {logoSrc ? (
              <Image
                src={logoSrc}
                alt={token}
                width={32}
                height={32}
                className="h-8 w-8 rounded-full"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-black/5" />
            )}

            <span className="text-sm font-medium text-black">
              {token}
            </span>

            {onSelectToken && (
              <span className="text-black/40 text-xs">▾</span>
            )}
          </button>

          {/* Amount */}
          <input
            placeholder="0"
            value={value}
            readOnly={readOnly}
            onChange={(e) => onChange?.(e.target.value)}
            className="
              w-28
              bg-transparent
              text-right
              text-lg
              font-medium
              text-black
              outline-none
              placeholder:text-black/30
            "
          />
        </div>
      </div>

      {/* Token modal */}
      {openToken && onSelectToken && (
        <TokenSelect
          onClose={() => setOpenToken(false)}
          onSelect={(t) => {
            onSelectToken(t);
            setOpenToken(false);
          }}
        />
      )}
    </>
  );
}
