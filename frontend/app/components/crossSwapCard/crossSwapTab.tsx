"use client";

import { useState, useEffect } from "react";
import TokenBox from "./tokenBox";
import { Divider, Footer, PrimaryButton } from "../divider";
import { CHAINS } from "./chains";
import { ChainWithTokens } from "@/app/types/chains";
import { ethers } from "ethers";
import { withdraw } from "@/app/lib/withdraw";
import TxToast from "./txToast";

const RELAYER_URL = "http://localhost:8000/crossSwapQuery";

type Props = {
  slippageBps: number; // ✅ controlled by parent (settings modal)
};

export default function CrossSwapTab({ slippageBps }: Props) {
  const [toChain, setToChain] = useState<ChainWithTokens>(CHAINS[0]);
  const [toToken, setToToken] = useState(toChain.tokens[0]);

  const [txHash, setTxHash] = useState<string | null>(null);

  const [amount, setAmount] = useState("");
  const [receiveAmount, setReceiveAmount] = useState("0");
  const [recipient, setRecipient] = useState("");

  const [loading, setLoading] = useState(false);

  async function fetchQuote() {
    if (!amount || Number(amount) <= 0) {
      setReceiveAmount("0");
      return;
    }

    try {
      setLoading(true);

      const scaledAmount = ethers.parseUnits(amount, 6).toString();

      const res = await fetch(RELAYER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dstEid: toChain.eid,
          toToken: toToken.address,
          scaledAmount,
          slippageBps, // ✅ from props
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Quote failed");

      setReceiveAmount(
        ethers.formatUnits(data.toTokenAmount, Number(toToken.decimals))
      );
    } catch (err) {
      console.error("Cross swap quote failed", err);
      setReceiveAmount("—");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchQuote();
    const id = setInterval(fetchQuote, 5000);
    return () => clearInterval(id);
  }, [amount, toChain, toToken, slippageBps]);

  async function handleCrossSwap() {
    if (!amount || Number(amount) <= 0 || !recipient) return;

    try {
      setLoading(true);
      const txHash = await withdraw(
        "crossSwap",
        recipient,
        amount,
        toToken.address,
        toChain.eid,
        slippageBps.toString()
      );

      setTxHash(txHash);
      setAmount("");
      setRecipient("");
    } catch (err) {
      console.error("Cross swap failed", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* FROM */}
      <TokenBox
        label="From"
        chain="Mantle"
        token="USDC"
        value={amount}
        onChange={setAmount}
      />

      <Divider />

      {/* TO */}
      <TokenBox
        label="To"
        chain={toChain.name}
        token={toToken.symbol}
        value={receiveAmount}
        readOnly
        hint="Estimated receive"
        availableTokens={toChain.tokens}
        onSelectChain={(chain) => {
          setToChain(chain);
          setToToken(chain.tokens[0]);
        }}
        onSelectToken={setToToken}
      />

      {/* RECIPIENT */}
      <div className="rounded-2xl border border-black/5 bg-white/70 backdrop-blur px-4 py-3">
        <label className="text-xs text-black/40">Recipient</label>
        <input
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          placeholder="0x…"
          className="mt-2 w-full bg-transparent text-sm text-black outline-none placeholder:text-black/30"
        />
      </div>

      <Footer />

      <PrimaryButton
        disabled={!amount || Number(amount) <= 0 || !recipient || loading}
        onClick={handleCrossSwap}
      >
        {loading ? "Processing..." : "Cross-swap privately"}
      </PrimaryButton>

      {txHash && (
  <TxToast
    hash={txHash}
    onClose={() => setTxHash(null)}
  />
)}
    </div>
  );
}
