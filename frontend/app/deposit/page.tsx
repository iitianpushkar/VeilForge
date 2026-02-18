"use client";

import { useState } from "react";
import { useWriteContract, useAccount } from "wagmi";
import { deposit } from "../lib/deposit";
import Navbar from "../components/navbar";
import TxToast from "./txToast";

export default function DepositModal() {
  const [amount, setAmount] = useState("");
  const [txHash, setTxHash] = useState<string | null>(null);

  const { writeContractAsync, isPending } = useWriteContract();
  const { address, isConnected } = useAccount();

  async function handleDeposit() {
    if (!address || !amount) return;

    const txHash = await deposit(writeContractAsync, address, amount);

    console.log("deposited tx:", txHash);

    setTxHash(txHash);
    setAmount("");

    setTimeout(() => setTxHash(null), 6000);
  }

  return (
    <>
      <Navbar />

      <div className="min-h-screen flex justify-center items-start pt-24 bg-[#f7f7f5] px-4">
        <div
          className="
            relative
            w-full
            max-w-[420px]
            rounded-3xl
            bg-white/70
            backdrop-blur-xl
            border border-black/5
          "
        >
          <div className="absolute inset-x-0 -top-24 h-40 bg-linear-to-b from-black/5 to-transparent blur-3xl pointer-events-none" />

          <div className="px-8 pt-8">
            <h3 className="text-sm font-medium text-black">
              Deposit USDC
            </h3>
          </div>

          <div className="p-8 pt-6 space-y-5">
            <div className="rounded-2xl border border-black/5 bg-white/70 backdrop-blur px-4 py-3">
              <div className="flex justify-between text-xs text-black/40">
                <span>From</span>
                <span>Mantle</span>
              </div>

              <div className="mt-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-black/5" />
                  <span className="font-medium text-black">USDC</span>
                </div>

                <input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  inputMode="decimal"
                  className="w-28 bg-transparent text-right text-lg font-medium text-black outline-none placeholder:text-black/30"
                />
              </div>

              <div className="mt-1 text-xs text-black/40">
                Private deposit · ZK protected
              </div>
            </div>

            <button
              disabled={!isConnected || !amount || Number(amount) <= 0 || isPending}
              onClick={handleDeposit}
              className="
                w-full
                rounded-full
                py-3
                text-sm
                font-medium
                transition
                disabled:bg-black/10 disabled:text-black/40 disabled:cursor-not-allowed
                bg-black text-white hover:bg-black/90 cursor-pointer
              "
            >
              {isPending ? "Depositing…" : "Deposit USDC"}
            </button>

            {!isConnected && (
              <p className="text-xs text-black/40 text-center">
                Connect wallet to deposit
              </p>
            )}
          </div>
        </div>
      </div>

      {txHash && (
        <TxToast
          hash={txHash}
          onClose={() => setTxHash(null)}
        />
      )}
    </>
  );
}
