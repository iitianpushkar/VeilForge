"use client";

import { useState } from "react";
import { PrimaryButton } from "./divider";

type Props = {
  slippageBps: number;
  onSave: (bps: number) => void;
  onClose: () => void;
};

export default function SettingsModal({
  slippageBps,
  onSave,
  onClose,
}: Props) {
  const [value, setValue] = useState((slippageBps / 100).toString());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div className="w-[360px] rounded-3xl bg-white/70 backdrop-blur-xl border border-black/5 p-6 shadow-lg">
        <h2 className="text-black font-medium mb-4">Settings</h2>

        <label className="text-xs text-black/40">Slippage tolerance (%)</label>

        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          inputMode="decimal"
          className="
            mt-2 w-full rounded-2xl bg-white/70 border border-black/5
            px-4 py-3 text-black outline-none placeholder:text-black/30
          "
        />

        <div className="mt-5 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-full border border-black/10 py-2.5 text-sm font-medium text-black/60 hover:text-black transition"
          >
            Cancel
          </button>

          <PrimaryButton
            onClick={() => {
              const bps = Math.floor(Number(value) * 100);
              onSave(bps);
              onClose();
            }}
          >
            Save
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
