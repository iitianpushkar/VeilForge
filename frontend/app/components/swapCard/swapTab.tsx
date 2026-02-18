"use client";

import { useState, useEffect } from "react";
import { usePublicClient } from "wagmi";
import TokenBox from "./tokenBox";
import { Divider, Footer, PrimaryButton } from "../divider";
import { TOKENS } from "./tokens";
import { Token } from "@/app/types/tokens";
import { pool_abi } from "../../utils/poolAbi";
import { ethers } from "ethers";
import { withdraw } from "@/app/lib/withdraw";
import TxToast from "./txToast";

export const POOL = "0x37741c6A9C54C0f8A8D659AB2386CFB5b3d318e8";

type Props = {
  slippageBps: number;
};

export default function SwapTab({ slippageBps }: Props) {
  const client = usePublicClient();

  const [toToken, setToToken] = useState<Token>(TOKENS[0]);
  const [amount, setAmount] = useState("");
  const [receiveAmount, setReceiveAmount] = useState("0");
  const [recipient, setRecipient] = useState("");
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  async function fetchSwapQuote() {
    if (!amount || Number(amount) <= 0 || !client) return;

    try {
      const result = (await client.readContract({
        address: POOL as `0x${string}`,
        abi: pool_abi,
        functionName: "getSwapQuote",
        args: [
          toToken.address as `0x${string}`,
          ethers.parseUnits(amount, 6),
        ],
      })) as bigint;

      setReceiveAmount(
        ethers.formatUnits(result, Number(toToken.decimals))
      );
    } catch {
      setReceiveAmount("—");
    }
  }

  useEffect(() => {
    fetchSwapQuote();
    const id = setInterval(fetchSwapQuote, 5000);
    return () => clearInterval(id);
  }, [amount, toToken, slippageBps]);

  async function handleSwap() {
    if (!amount || !recipient) return;

    try {
      setLoading(true);

      const hash = await withdraw(
        "swap",
        recipient,
        amount,
        toToken.address,
        "0",
        slippageBps.toString()
      );

      setTxHash(hash);
      setAmount("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* From */}
      <TokenBox
        label="From"
        chain="Mantle"
        token="USDC"
        value={amount}
        onChange={setAmount}
      />

      <Divider />

      {/* To */}
      <TokenBox
        label="To"
        chain="Mantle"
        token={toToken.symbol}
        value={receiveAmount}
        readOnly
        hint="Estimated receive"
        onSelectToken={setToToken}
      />

      {/* Recipient */}
      <div className="rounded-2xl border border-black/5 bg-white/70 backdrop-blur px-4 py-3">
        <label className="text-xs text-black/40">
          Recipient
        </label>
        <input
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          placeholder="0x…"
          className="
            mt-2
            w-full
            bg-transparent
            text-sm
            text-black
            placeholder-black/30
            outline-none
          "
        />
      </div>

      <Footer />

      {/* CTA */}
      <PrimaryButton
        disabled={!amount || !recipient || loading}
        onClick={handleSwap}
      >
        {loading ? "Swapping…" : "Swap privately"}
      </PrimaryButton>

      {/* TX Toast */}
      {txHash && (
        <TxToast
          hash={txHash}
          onClose={() => setTxHash(null)}
        />
      )}
    </div>
  );
}
