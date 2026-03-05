"use client";

import { useEffect, useState } from "react";
import { ethers } from "ethers";
import {
  getWallets,
  getCurrentWallet,
  setCurrentWallet,
  saveWallets,
  Wallet,
} from "../lib/walletStore";
import { pool_abi } from "../utils/poolAbi";
import { Barretenberg, Fr } from "@aztec/bb.js";
import { generateIDProof } from "../lib/idProof";
import { useWriteContract } from "wagmi";
import TxToast from "./txToast";
import Navbar from "../components/navbar";

type CreateStep =
  | "idle"
  | "proof"
  | "tx";

export default function WalletsPage() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);

  const [step, setStep] = useState<CreateStep>("idle");

  const [txHash, setTxHash] = useState<string | null>(null);

  const creating = step !== "idle";

  const { writeContractAsync } = useWriteContract();

  useEffect(() => {
    setWallets(getWallets());
    setCurrentId(getCurrentWallet()?.id || null);
  }, []);

  function selectWallet(id: string) {
    setCurrentWallet(id);
    setCurrentId(id);
    window.dispatchEvent(new Event("storage"));
  }

  async function createWallet() {
    if (creating) return;

    try {
      setStep("proof");

      const idData = localStorage.getItem("zkID");
      const parsedIDdata = JSON.parse(idData!);

      const { idProof, idPublicInputs } = await generateIDProof(
        parsedIDdata.uuid,
        parsedIDdata.secret
      );

      const formattedProof = `0x${Buffer.from(idProof).toString("hex")}`;

      const nullifier = Fr.random();
      const secret = Fr.random();
      const balance = "0";

      const bb = await Barretenberg.new();
      const commitment = await bb.poseidon2Hash([
        nullifier,
        secret,
        new Fr(ethers.parseUnits(balance, 6)),
      ]);

      const newWallet: Wallet = {
        id: crypto.randomUUID(),
        nullifier: nullifier.toString(),
        secret: secret.toString(),
        balance: "0",
      };

      setStep("tx");

      const tx = await writeContractAsync({
        address: "0x271a99F3f1B14D6E0C8eBA5Ad304504b0df6BE23",
        abi: pool_abi,
        functionName: "createWallet",
        args: [
          {
            idProof: formattedProof,
            idRoot: idPublicInputs[0],
            idNullifier: idPublicInputs[1],
          },
          commitment.toString(),
        ],
      });

      const updated = [...wallets, newWallet];
      saveWallets(updated);
      setWallets(updated);

      setCurrentWallet(newWallet.id);
      setCurrentId(newWallet.id);

      setTxHash(tx);
    } finally {
      setStep("idle");
    }
  }

  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-[#f7f7f5] flex justify-center items-start pt-24 px-4">
        <div
          className="
            relative
            w-full
            max-w-[480px]
            rounded-3xl
            bg-white/70
            backdrop-blur-xl
            border border-black/5
            p-8
          "
        >
          <div className="absolute inset-x-0 -top-24 h-40 bg-linear-to-b from-black/5 to-transparent blur-3xl pointer-events-none" />

          <h2 className="text-lg font-medium text-black mb-6">Your Wallets</h2>

          <button
            onClick={createWallet}
            disabled={creating}
            className="
              mb-4
              w-full
              rounded-full
              py-3
              text-sm
              font-medium
              transition
              disabled:bg-black/10 disabled:text-black/40 disabled:cursor-not-allowed
              bg-black text-white hover:bg-black/90
            "
          >
            {creating ? (
              <div className="flex items-center justify-center gap-3">
                <span
                  className="h-4 w-4 rounded-full border-2
                  border-white/30 border-t-white animate-spin"
                />
                <span className="text-sm">
                  {step === "proof" && "Generating proof…"}
                  {step === "tx" && "Submitting transaction…"}
                </span>
              </div>
            ) : (
              "+ Create new wallet"
            )}
          </button>

          {wallets.length === 0 && !creating && (
            <p className="text-xs text-black/40">
              No wallets created yet.
            </p>
          )}

          <div className="space-y-3 mt-4">
            {wallets.map((wallet) => (
              <div
                key={wallet.id}
                className={`
                  flex items-center justify-between rounded-2xl border px-4 py-3 transition
                  ${
                    currentId === wallet.id
                      ? "border-black/10 bg-black/5"
                      : "border-black/5 bg-white/50"
                  }
                `}
              >
                <div className="max-w-[300px] min-w-0">
                  <div className="font-medium text-black truncate text-sm">
                    Nullifier: {wallet.nullifier}
                  </div>
                  <div className="text-xs text-black/40 truncate">
                    Secret: {wallet.secret}
                  </div>
                  <div className="text-xs text-black/60 mt-1">
                    Balance: {wallet.balance}
                  </div>
                </div>

                {currentId === wallet.id ? (
                  <span className="text-xs text-black/60 font-semibold shrink-0">
                    Active
                  </span>
                ) : (
                  <button
                    onClick={() => selectWallet(wallet.id)}
                    className="rounded-full bg-black text-white px-3 py-1.5 text-xs font-medium shrink-0 hover:bg-black/90 transition"
                  >
                    Use
                  </button>
                )}
              </div>
            ))}
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
