"use client";

import { TxRecord } from "../types/tx";
import { useState } from "react";
import TxGraphModal from "./txGraphModal";

export default function TxCard({ tx }: { tx: TxRecord }) {

  const [showGraph, setShowGraph] = useState(false);

  const time = new Date(tx.timestamp).toLocaleTimeString();

  return (
    <>
      <div className="rounded-2xl border border-black/5 bg-white/70 backdrop-blur p-4">

        <div className="flex justify-between">

          <div>
            <div className="font-medium capitalize">
              {tx.type.replace("_", " ")}
            </div>

            {tx.type === "swap" && (
              <div className="text-sm text-black/60">
                {tx.fromToken} → {tx.toToken}
              </div>
            )}

            {tx.amount && (
              <div className="text-sm text-black/60">
                {tx.amount} {tx.token}
              </div>
            )}

            <div className="text-xs text-black/40">
              {time}
            </div>

          </div>

          <div className="flex flex-col gap-2 items-end">

            {tx.type === "swap" && (
              <button
                onClick={() => setShowGraph(true)}
                className="text-xs text-black underline"
              >
                View Graph
              </button>
            )}

            <a
              href={`https://basescan.org/tx/${tx.txHash}`}
              target="_blank"
              className="text-xs text-black underline"
            >
              Explorer
            </a>

          </div>

        </div>
      </div>

      {showGraph && (
        <TxGraphModal
          fromToken={tx.fromToken!}
          toToken={tx.toToken!}
          DEX={tx.dex!}
          onClose={() => setShowGraph(false)}
        />
      )}
    </>
  );
}