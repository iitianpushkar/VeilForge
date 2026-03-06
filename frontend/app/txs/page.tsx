"use client";

import { useEffect, useState } from "react";
import Navbar from "../components/navbar";
import { getTxs } from "../lib/txStorage";
import { TxRecord } from "../types/tx";
import TxGraphModal from "../components/txGraphModal";

export default function TxsPage() {
  const [txs, setTxs] = useState<TxRecord[]>([]);
  const [graphTx, setGraphTx] = useState<TxRecord | null>(null);

  useEffect(() => {
    setTxs(getTxs());
  }, []);

  function shortHash(hash: string) {
    return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
  }

  return (
    <>
      <Navbar />

      <div className="min-h-screen flex justify-center pt-24 px-4 bg-[#f7f7f5]">

        <div className="w-full max-w-4xl">

          <h2 className="text-lg font-semibold mb-6">
            Transactions
          </h2>

          <div className="overflow-x-auto rounded-2xl border border-black/5 bg-white/70 backdrop-blur">

            <table className="w-full text-sm">

              <thead className="text-left text-black/50 border-b border-black/5">
                <tr>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Details</th>
                  <th className="px-4 py-3">Tx Hash</th>
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>

              <tbody>

                {txs.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="text-center py-6 text-black/40"
                    >
                      No transactions yet
                    </td>
                  </tr>
                )}

                {txs.map((tx, i) => {

                  const time = new Date(tx.timestamp).toLocaleString();

                  return (
                    <tr
                      key={i}
                      className="border-b border-black/5"
                    >
                      <td className="px-4 py-3 capitalize">
                        {tx.type.replace("_", " ")}
                      </td>

                      <td className="px-4 py-3 text-black/70">

                        {tx.type === "swap" && (
                          <>
                            {tx.fromToken} → {tx.toToken}
                          </>
                        )}

                        {(tx.type === "deposit" ||
                          tx.type === "withdraw") && (
                          <>
                            {tx.amount} {tx.token}
                          </>
                        )}

                        {tx.type === "wallet_creation" && (
                          <>zk-ID Created</>
                        )}

                      </td>

                      <td className="px-4 py-3 font-mono text-xs">
                        {shortHash(tx.txHash)}
                      </td>

                      <td className="px-4 py-3 text-black/50">
                        {time}
                      </td>

                      <td className="px-4 py-3 flex gap-3">

                        {tx.type === "swap" && (
                          <button
                            onClick={() => setGraphTx(tx)}
                            className="text-xs underline"
                          >
                            Graph
                          </button>
                        )}

                        <a
                          href={`https://basescan.org/tx/${tx.txHash}`}
                          target="_blank"
                          className="text-xs underline"
                        >
                          Explorer
                        </a>

                      </td>
                    </tr>
                  );
                })}

              </tbody>
            </table>

          </div>
        </div>
      </div>

      {graphTx && (
        <TxGraphModal
          fromToken={graphTx.fromToken!}
          toToken={graphTx.toToken!}
          DEX={graphTx.dex!}
          onClose={() => setGraphTx(null)}
        />
      )}
    </>
  );
}