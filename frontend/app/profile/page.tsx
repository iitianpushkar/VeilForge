"use client";

import { useState } from "react";
import Navbar from "../components/navbar";
import { initworker } from "../lib/mrzWorker";
import { Barretenberg, Fr } from "@aztec/bb.js";
import { sha256 } from "ethers";
import { useWriteContract } from "wagmi";
import { idmixer_abi } from "../utils/IDMixerAbi";
import TxToast from "./txToast";

type Step = "idle" | "commitment" | "tx" | "success";

export default function ProfilePage() {
  const [image, setImage] = useState<string | null>(null);
  const [mrzData, setMrzData] = useState<any>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [step, setStep] = useState<Step>("idle");

  const loading = step === "commitment" || step === "tx";

  const { writeContractAsync } = useWriteContract();

  function handleUpload(file: File) {
    const url = URL.createObjectURL(file);
    setImage(url);

    const worker = initworker((parsed) => {
      const f = parsed.fields;

      setMrzData({
        documentType: f.documentCode,
        country: f.issuingState,
        surname: f.lastName,
        givenNames: f.firstName,
        passportNumber: f.documentNumber,
        nationality: f.nationality,
        sex: f.sex,
      });

      worker.terminate();
      URL.revokeObjectURL(url);
    });

    const reader = new FileReader();
    reader.onload = () => {
      worker.postMessage({
        cmd: "process",
        image: reader.result,
      });
    };
    reader.readAsDataURL(file);
  }

  async function handleIDCreation() {
    if (!mrzData || loading || step === "success") return;

    try {
      setStep("commitment");

      const bb = await Barretenberg.new();

      const passportHash = sha256(
        new TextEncoder().encode(mrzData.passportNumber)
      );

      const document = Fr.fromBufferReduce(
        Buffer.from(passportHash)
      );

      const secret = Fr.random();

      const commitment = await bb.poseidon2Hash([
        document,
        secret,
      ]);

      const zkIDdata = {
        document: mrzData.passportNumber,
        commitment: commitment.toString(),
        secret: secret.toString(),
      };

      setStep("tx");

      const tx = await writeContractAsync({
        address: "0xA9fE25E95D5F47FC6028d6760b64e4811DB3c4a9",
        abi: idmixer_abi,
        functionName: "createID",
        args: [commitment.toString()],
      });

      localStorage.setItem("zkID", JSON.stringify(zkIDdata));
      setTxHash(tx);
      setStep("success");
    } catch {
      setStep("idle");
    }
  }

  return (
    <>
      <Navbar />

      <div className="min-h-screen flex justify-center items-start px-4 pt-24 bg-[#f7f7f5]">
        <div
          className="
            relative
            w-full
            max-w-[520px]
            rounded-3xl
            bg-white/70
            backdrop-blur-xl
            border border-black/5
            p-8
          "
        >
          <div className="absolute inset-x-0 -top-24 h-40 bg-linear-to-b from-black/5 to-transparent blur-3xl pointer-events-none" />

          <h2 className="text-sm font-medium text-black mb-6">
            zk-ID Verification
          </h2>

          <label
            className={`
              block rounded-2xl border border-dashed px-4 py-4 text-center cursor-pointer transition
              ${
                step === "success"
                  ? "border-green-500/30 bg-green-500/5"
                  : "border-black/10 bg-white/50 hover:border-black/20"
              }
            `}
          >
            <input
              type="file"
              accept="image/*"
              hidden
              disabled={loading || step === "success"}
              onChange={(e) =>
                e.target.files && handleUpload(e.target.files[0])
              }
            />

            {image ? (
              <img
                src={image}
                className="mx-auto h-36 rounded-xl object-cover"
              />
            ) : (
              <p className="text-sm text-black/40">
                Upload passport photo (MRZ visible)
              </p>
            )}
          </label>

          {mrzData && (
            <div className="mt-5 grid grid-cols-2 gap-3">
              <Field label="Document Type" value={mrzData.documentType} />
              <Field label="Issuing Country" value={mrzData.country} />
              <Field label="Surname" value={mrzData.surname} />
              <Field label="Given Names" value={mrzData.givenNames} />
              <Field label="Passport No" value={mrzData.passportNumber} />
              <Field label="Nationality" value={mrzData.nationality} />
              <Field label="Sex" value={mrzData.sex} />
            </div>
          )}

          {mrzData && (
            <div className="mt-6">
              {step === "success" ? (
                <div className="flex items-center gap-3 rounded-2xl bg-green-500/10 border border-green-500/20 px-4 py-3 text-green-700">
                  <span className="text-lg">✔</span>
                  <span className="text-sm font-medium">
                    zk-ID created successfully
                  </span>
                </div>
              ) : (
                <button
                  onClick={handleIDCreation}
                  disabled={loading}
                  className="
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
                  {loading ? (
                    <div className="flex items-center justify-center gap-3">
                      <span
                        className="h-4 w-4 rounded-full border-2
                        border-white/30 border-t-white animate-spin"
                      />
                      <span className="text-sm">
                        {step === "commitment" &&
                          "Generating cryptographic commitment…"}
                        {step === "tx" &&
                          "Submitting transaction…"}
                      </span>
                    </div>
                  ) : (
                    "Create zk-ID"
                  )}
                </button>
              )}
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
    <div className="rounded-2xl bg-white/70 border border-black/5 p-3">
      <div className="text-xs text-black/40">{label}</div>
      <div className="text-sm text-black mt-1 truncate">{value}</div>
    </div>
  );
}
