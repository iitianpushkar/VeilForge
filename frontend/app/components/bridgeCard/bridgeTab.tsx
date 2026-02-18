"use client";

import { useState, useEffect } from "react";
import { usePublicClient } from "wagmi";
import TokenBox from "./tokenBox";
import { Divider, Footer, PrimaryButton } from "../divider";
import { CHAINS } from "./chains";
import { Chain } from "../../types/chains";
import { pool_abi } from "../../utils/poolAbi";
import { ethers } from "ethers";
import { withdraw } from "@/app/lib/withdraw";
import TxToast from "./txToast";

export const POOL = "0x37741c6A9C54C0f8A8D659AB2386CFB5b3d318e8";

type Props = {
  slippageBps: number; // ✅ from settings modal
};

type PrepareTakeTaxiResult = readonly [
  unknown,
  {
    minAmountLD: bigint;
  },
  unknown
];

export default function BridgeTab({ slippageBps }: Props) {
  const client = usePublicClient();

  const [toChain, setToChain] = useState<Chain>(CHAINS[0]);
  const [amount, setAmount] = useState("");
  const [receiveAmount, setReceiveAmount] = useState("0");
  const [recipient, setRecipient] = useState("");

  const [txHash, setTxHash] = useState<string | null>(null);


  const [loading, setLoading] = useState(false);

  async function fetchQuote() {
    if (!amount || Number(amount) <= 0 || !client) {
      setReceiveAmount("0");
      return;
    }

    try {
      const result = (await client.readContract({
        address: POOL as `0x${string}`,
        abi: pool_abi,
        functionName: "prepareTakeTaxi",
        args: [
          toChain.eid,
          ethers.parseUnits(amount, 6),
          POOL,
        ],
      })) as PrepareTakeTaxiResult;

      setReceiveAmount(
        ethers.formatUnits(result[1].minAmountLD, 6)
      );
    } catch (err) {
      console.error("Bridge quote failed", err);
      setReceiveAmount("—");
    }
  }

  /* 🔁 auto refresh */
  useEffect(() => {
    fetchQuote();
    const id = setInterval(fetchQuote, 5000);
    return () => clearInterval(id);
  }, [amount, toChain, slippageBps]);

  async function handleBridge() {
    if (!amount || Number(amount) <= 0 || !recipient) return;

    try {
      setLoading(true);

      const txHash = await withdraw(
        "bridge",
        recipient,
        amount,
        "0x0000000000000000000000000000000000000000", // token unused for bridge
        toChain.eid,
        slippageBps.toString()
      );

      setTxHash(txHash);
      setAmount("");
    } catch (err) {
      console.error("Bridge failed", err);
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
        token="USDC"
        value={receiveAmount}
        readOnly
        hint="Estimated receive"
        onSelectChain={setToChain}
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
        onClick={handleBridge}
      >
        {loading ? "Processing..." : "Bridge privately"}
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
