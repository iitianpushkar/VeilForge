"use client";

import { useState } from "react";
import Navbar from "../components/navbar";
import SwapTab from "../components/swapCard/swapTab";
import CrossSwapTab from "../components/crossSwapCard/crossSwapTab";
import BridgeTab from "../components/bridgeCard/bridgeTab";
import SettingsModal from "../components/settingModal";

type Tab = "swap" | "cross" | "bridge";

export default function SwapModal() {
  const [tab, setTab] = useState<Tab>("swap");
  const [showSettings, setShowSettings] = useState(false);
  const [slippageBps, setSlippageBps] = useState(150); // 1.5%

  return (
    <>
      <Navbar />

      {/* Page background */}
      <div className="min-h-screen flex justify-center items-start pt-24 bg-[#f7f7f5]">
        {/* Glass card */}
        <div
          className="
            relative
            w-[420px]
            rounded-3xl
            bg-white/70
            backdrop-blur-xl
            border border-black/5
          "
        >
          {/* Soft ambient glow */}
          <div className="absolute inset-x-0 -top-24 h-40 bg-linear-to-b from-black/5 to-transparent blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="relative flex justify-between items-center px-8 pt-8">
            <div className="flex gap-6">
              <TabButton active={tab === "swap"} onClick={() => setTab("swap")}>
                Swap
              </TabButton>
              <TabButton active={tab === "cross"} onClick={() => setTab("cross")}>
                Cross-chain
              </TabButton>
              <TabButton active={tab === "bridge"} onClick={() => setTab("bridge")}>
                Bridge
              </TabButton>
            </div>

            <button
              onClick={() => setShowSettings(true)}
              className="text-black/40 hover:text-black transition"
            >
              ⚙
            </button>
          </div>

          {/* Content */}
          <div className="px-8 pt-6 pb-8">
            {tab === "swap" && <SwapTab slippageBps={slippageBps} />}
            {tab === "cross" && <CrossSwapTab slippageBps={slippageBps} />}
            {tab === "bridge" && <BridgeTab slippageBps={slippageBps} />}
          </div>
        </div>
      </div>

      {/* Settings modal */}
      {showSettings && (
        <SettingsModal
          slippageBps={slippageBps}
          onSave={setSlippageBps}
          onClose={() => setShowSettings(false)}
        />
      )}
    </>
  );
}

/* ---------------- UI Atoms ---------------- */

function TabButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        relative
        pb-2
        text-sm
        font-medium
        transition
        ${active ? "text-black" : "text-black/40 hover:text-black"}
      `}
    >
      {children}

      {active && (
        <span
          className="
            absolute
            left-0
            -bottom-1
            h-[1.5px]
            w-full
            bg-black
            rounded-full
          "
        />
      )}
    </button>
  );
}
