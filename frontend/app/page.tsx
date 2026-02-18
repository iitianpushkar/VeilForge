"use client";

import Image from "next/image";
import {
  IDKitWidget,
  VerificationLevel,
  ISuccessResult,
} from "@worldcoin/idkit";

export default function Home() {
  const handleVerify = async (proof: ISuccessResult) => {
    const res = await fetch("/api/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(proof),
    });

    if (!res.ok) {
      throw new Error("Verification failed.");
    }
  };

  const onSuccess = () => {
    console.log("World ID verified");
  };

  return (
    <div className="min-h-screen bg-[#f7f7f5] flex justify-center items-center px-4">
      {/* Glass Card */}
      <div
        className="
          relative
          w-full
          max-w-md
          rounded-3xl
          bg-white/70
          backdrop-blur-xl
          border border-black/5
          px-8
          py-10
        "
      >
        {/* Ambient glow */}
        <div className="absolute inset-x-0 -top-24 h-40 bg-linear-to-b from-black/5 to-transparent blur-3xl pointer-events-none" />

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Image
            src="/next.svg"
            alt="Logo"
            width={90}
            height={18}
            className="opacity-80"
          />
        </div>

        {/* Heading */}
        <div className="text-center space-y-3 mb-10">
          <h1 className="text-2xl font-semibold tracking-tight text-black">
            Private access, verified.
          </h1>
          <p className="text-sm leading-6 text-black/50">
            Prove you’re human without revealing who you are.
            Secure, anonymous, and protocol-native.
          </p>
        </div>

        {/* World ID Button */}
        <IDKitWidget
          app_id="app_812b3faf89ee1a672e8913c69ce528c0"
          action="anonymous-identity"
          verification_level={VerificationLevel.Device}
          handleVerify={handleVerify}
          onSuccess={onSuccess}
        >
          {({ open }) => (
            <button
              onClick={open}
              className="
                w-full
                h-12
                rounded-full
                bg-black
                text-white
                text-sm
                font-medium
                transition
                hover:bg-black/90
              "
            >
              Verify with World ID
            </button>
          )}
        </IDKitWidget>

        {/* Divider */}
        <div className="my-8 h-px bg-black/5" />

        {/* Footer copy */}
        <p className="text-xs text-center text-black/60 leading-5">
          This protocol never stores personal data.
          Verification is zero-knowledge and unlinkable.
        </p>
      </div>
    </div>
  );
}
