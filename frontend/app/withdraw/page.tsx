"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { withdraw } from "../lib/withdraw";
import Navbar from "../components/navbar";
import TxToast from "./txToast";

export default function WithdrawModal() {
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [loading, setLoading] = useState(false);

  const [txHash, setTxHash] = useState<string | null>(null);

  const TYPE = "withdraw";
  const DST_EID = "0";
  const SLIPPAGE_BPS = "0";
  const TO_TOKEN = "0x0000000000000000000000000000000000000000";

  const { address, isConnected } = useAccount();

  async function handleWithdraw() {
    if (!isConnected || !address || !amount || !recipient) return;

    try {
      setLoading(true);

      const txHash = await withdraw(
        TYPE,
        recipient,
        amount,
        TO_TOKEN,
        DST_EID,
        SLIPPAGE_BPS
      );

      setTxHash(txHash);
      setAmount("");
      setRecipient("");
    } catch (err) {
      console.error("Withdraw failed:", err);
    } finally {
      setLoading(false);
    }
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
              Withdraw USDC
            </h3>
          </div>

          <div className="p-8 pt-6 space-y-5">
            <div className="rounded-2xl border border-black/5 bg-white/70 backdrop-blur px-4 py-3">
              <div className="flex justify-between text-xs text-black/40">
                <span>To</span>
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
                Private withdrawal · Relayer protected
              </div>
            </div>

            <div className="rounded-2xl border border-black/5 bg-white/70 backdrop-blur px-4 py-3">
              <label className="text-xs text-black/40">Recipient</label>
              <input
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="0x…"
                className="mt-2 w-full bg-transparent text-sm text-black outline-none placeholder:text-black/30"
              />
            </div>

            <button
              disabled={
                !isConnected ||
                !amount ||
                Number(amount) <= 0 ||
                !recipient ||
                loading
              }
              onClick={handleWithdraw}
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
              {loading ? "Withdrawing…" : "Withdraw USDC"}
            </button>

            {!isConnected && (
              <p className="text-xs text-black/40 text-center">
                Connect wallet to withdraw
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
