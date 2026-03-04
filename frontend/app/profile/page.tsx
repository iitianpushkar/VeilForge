"use client";

import { useState } from "react";
import Navbar from "../components/navbar";
import { v4 as uuidv4 } from "uuid";
import { Barretenberg, Fr } from "@aztec/bb.js";
import {
  IDKitWidget,
  VerificationLevel,
  ISuccessResult,
} from "@worldcoin/idkit";
import TxToast from "./txToast";

type Step = "idle" | "generated" | "verified" | "success";

export default function ProfilePage() {
  const [step, setStep] = useState<Step>("idle");
  const [txHash, setTxHash] = useState<string | null>(null);

  const [uuid, setUuid] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [commitment, setCommitment] = useState<string | null>(null);

  const app_id = process.env.NEXT_PUBLIC_APP_ID as `app_${string}`;

  // ================= STEP 1 =================
  async function generateIdentity() {
    const bb = await Barretenberg.new();

    const uuid = uuidv4();
    const secret = Fr.random();

    const commitment = await bb.poseidon2Hash([
      Fr.fromBufferReduce(Buffer.from(uuid)),
      secret,
    ]);

    setUuid(uuid);
    setSecret(secret.toString());
    setCommitment(commitment.toString());

    setStep("generated");
  }

  // ================= STEP 2 =================
  async function handleVerify(proof: ISuccessResult) {
    if (!commitment) throw new Error("Commitment missing");

    const userData = {
      proof:proof,
      commitment:commitment
    }

    const res = await fetch("http://localhost:8000/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });

    if (!res.ok) {
      throw new Error("WorldID verification failed");
    }

    localStorage.setItem(
      "zkID",
      JSON.stringify({
        uuid,
        secret,
        commitment
      })
    );

    const data = await res.json();
    console.log("response", data);
    const tx = data.txHash;
    
    setTxHash(tx);
    setStep("success");
  }

  const onSuccess = () => {
     console.log("profile created")
  }

  return (
    <>
      <Navbar />

      <div className="min-h-screen flex justify-center items-start pt-24 px-4 bg-[#f7f7f5]">
        <div className="w-full max-w-md rounded-3xl bg-white/70 backdrop-blur-xl border border-black/5 p-8">

          <h2 className="text-lg font-semibold mb-6">
            Create Private zk-ID
          </h2>

          {/* STEP 1 */}
          {step === "idle" && (
            <button
              onClick={generateIdentity}
              className="w-full rounded-full py-3 bg-black text-white text-sm font-medium hover:bg-black/90 transition"
            >
              Generate Private Identity
            </button>
          )}

          {/* SHOW GENERATED DATA */}
          {step !== "idle" && (
            <div className="mt-4 space-y-2 text-xs break-all">
              <Field label="UUID" value={uuid!} />
              <Field label="Secret" value={secret!} />
              <Field label="Commitment" value={commitment!} />
            </div>
          )}

          {/* STEP 2 */}
          {step === "generated" && (
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
                    className="w-full rounded-full py-3 bg-black text-white text-sm font-medium hover:bg-black/90 transition"
                  >
                    Verify with World ID
                  </button>
                )}
              </IDKitWidget>
            </div>
          )}

          {/* SUCCESS */}
          {step === "success" && (
            <div className="mt-6 rounded-2xl bg-green-500/10 border border-green-500/20 px-4 py-3 text-green-700 text-sm">
              ✔ zk-ID created and verified
            </div>
          )}
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

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white border border-black/5 p-3">
      <div className="text-black/40">{label}</div>
      <div className="text-black mt-1 truncate">{value}</div>
    </div>
  );
}