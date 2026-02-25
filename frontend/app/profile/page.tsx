"use client";

import { useState } from "react";
import Navbar from "../components/navbar";
import { v4 as uuidv4 } from "uuid";
import { Barretenberg, Fr } from "@aztec/bb.js";
import { useWriteContract } from "wagmi";
import { idmixer_abi } from "../utils/IDMixerAbi";
import {
  IDKitWidget,
  VerificationLevel,
  ISuccessResult,
} from "@worldcoin/idkit";

type Step = "idle" | "uuid" | "verified" | "tx" | "success";

export default function ProfilePage() {
  const [uuid, setUuid] = useState<string | null>(null);
  const [nullifierHash, setNullifierHash] = useState<string | null>(null);
  const [step, setStep] = useState<Step>("idle");
  const [txHash, setTxHash] = useState<string | null>(null);

  const { writeContractAsync } = useWriteContract();

  const loading = step === "tx";

  const app_id=process.env.NEXT_PUBLIC_APP_ID as `app_${string}`; 

  function generateUUID() {
    const id = uuidv4();
    setUuid(id);
    setStep("uuid");
  }

  async function handleVerify(proof: ISuccessResult) {
    
    const res = await fetch("http://localhost:8000/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(proof),
    });

    if (!res.ok) {
      throw new Error("Verification failed.");
    }
    console.log(res);
    setStep("verified");
  }

  const onSuccess = () => {
    console.log("World ID verified");
  };

  async function registerID() {
    if (!uuid || !nullifierHash) return;

    try {
      setStep("tx");

      const bb = await Barretenberg.new();

      const uuidField = Fr.fromBufferReduce(
        Buffer.from(uuid)
      );

      const commitment = await bb.poseidon2Hash([
        uuidField,
      ]);

      localStorage.setItem(
        "zkID",
        JSON.stringify({
          uuid,
          nullifierHash,
          commitment: commitment.toString(),
        })
      );

      setTxHash("");
      setStep("success");
    } catch {
      setStep("verified");
    }
  }

  return (
    <>
      <Navbar />

      <div className="min-h-screen flex justify-center items-center px-4 bg-[#f7f7f5]">
        <div className="w-full max-w-md rounded-3xl bg-white/70 backdrop-blur-xl border border-black/5 p-8">

          <h2 className="text-lg font-semibold mb-6">
            Create Private zk-ID
          </h2>

          {/* Step 1 — Generate UUID */}
          {!uuid && (
            <button
              onClick={generateUUID}
              className="w-full rounded-full py-3 bg-black text-white text-sm font-medium hover:bg-black/90 transition"
            >
              Generate Random User ID
            </button>
          )}

          {uuid && (
            <div className="mt-4 rounded-2xl bg-white border border-black/5 p-4 text-xs break-all">
              <div className="text-black/40 mb-2">
                Your Private UUID
              </div>
              {uuid}
            </div>
          )}

          {/* Step 2 — World ID */}
          {step === "uuid" && (
            <div className="mt-6">
              <IDKitWidget
                app_id={app_id}
                action={process.env.NEXT_PUBLIC_ACTION!}
                verification_level={VerificationLevel.Device}
                handleVerify={handleVerify}
                onSuccess={onSuccess}
              >
                {({ open }) => (
                  <button
                    onClick={open}
                    className="w-full mt-4 rounded-full py-3 bg-black text-white text-sm font-medium hover:bg-black/90 transition"
                  >
                    Verify with World ID
                  </button>
                )}
              </IDKitWidget>
            </div>
          )}

          {/* Step 3 — Register */}
          {step === "verified" && (
            <button
              onClick={registerID}
              disabled={loading}
              className="w-full mt-6 rounded-full py-3 bg-black text-white text-sm font-medium hover:bg-black/90 transition"
            >
              {loading ? "Registering..." : "Register zk-ID"}
            </button>
          )}

          {step === "success" && (
            <div className="mt-6 rounded-2xl bg-green-500/10 border border-green-500/20 px-4 py-3 text-green-700 text-sm">
              ✔ zk-ID registered successfully
            </div>
          )}
        </div>
      </div>
    </>
  );
}