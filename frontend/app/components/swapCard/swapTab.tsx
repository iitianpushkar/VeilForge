"use client";

import { useState, useEffect } from "react";
import TokenBox from "./tokenBox";
import { Divider, Footer, PrimaryButton } from "../divider";
import { TOKENS } from "./tokens";
import { Token } from "@/app/types/tokens";
import { pool_abi } from "../../utils/poolAbi";
import { ethers } from "ethers";
import { swap } from "@/app/lib/swap";
import TxToast from "./txToast";
import { useAccount } from "wagmi";
import { swapPayload } from "@/app/lib/types";

export const POOL = "0x271a99F3f1B14D6E0C8eBA5Ad304504b0df6BE23";

type Props = {
  slippageBps: number;
};

export default function SwapTab({ slippageBps }: Props) {

  const { address } = useAccount();


  const [toToken, setToToken] = useState<Token>(TOKENS[0]);
  const [amount, setAmount] = useState("");
  const [receiveAmount, setReceiveAmount] = useState("0");
  const [recipient, setRecipient] = useState("");
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  async function fetchSwapQuote() {
    if (!amount || Number(amount) <= 0 || !toToken) return;

    try {
      const res = await fetch("https://trade-api.uniswap.org/v1/quote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.NEXT_PUBLIC_UNISWAP_API_KEY!,
        },
        body: JSON.stringify({
          tokenInChainId: 8453,
          tokenOutChainId: 8453,
          tokenIn: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
          tokenOut: toToken.address,
          amount: ethers.parseUnits(amount, 6).toString(),
          type: 'EXACT_INPUT',
          swapper: recipient || address,
          slippageTolerance: slippageBps / 100,
        }),
      });

      const data = await res.json();
      console.log("quote", data)

      if (!data?.quote?.output.amount) {
        setReceiveAmount("—");
        return;
      }

      setReceiveAmount(
        ethers.formatUnits(
          data.quote.output.amount,
          18
        )
      );
    } catch (err) {
      console.error(err);
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

      const swapPayload: swapPayload = {
        network: "base",
        fromToken: {
          symbol: "USDC",
          address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
          decimals: "6",
        },
        toToken: {
          symbol: toToken.symbol,
          address: toToken.address,
          decimals: toToken.decimals,
        },
        amountIn: ethers.parseUnits(amount, 6).toString(),
        minAmountOut: (() => {
          try {
            const rawOut = ethers.parseUnits(receiveAmount, 18);
            const slippageFactor = BigInt(10_000 - slippageBps);
            return (rawOut * slippageFactor / BigInt(10_000)).toString();
          } catch {
            return "0";
          }
        })(),
        recipient: recipient || address!,
      };

      console.log("SWAP JSON:", swapPayload);

      const tx = await swap("swap", swapPayload, amount);

      setTxHash(tx);
      setAmount("0")
      setReceiveAmount("0")
      setRecipient("")

    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* From */}
      <TokenBox
        label="From"
        chain="Base"
        token="USDC"
        value={amount}
        onChange={setAmount}
      />

      <Divider />

      {/* To */}
      <TokenBox
        label="To"
        chain="Base"
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
