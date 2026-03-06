"use client";

type Props = {
  hash: string;
  onClose: () => void;
};

export default function TxToast({ hash, onClose }: Props) {
  return (
    <div className="fixed bottom-6 right-6 z-50 animate-slide-in">
      <div
        className="
          flex items-center gap-3
          rounded-2xl bg-white/90 backdrop-blur-xl
          border border-black/5
          px-4 py-3
          shadow-lg
        "
      >
        <div className="h-8 w-8 rounded-full bg-green-500/20 flex items-center justify-center">
          ✅
        </div>

        <div className="text-sm text-black">
          <div className="font-medium">Transaction successful</div>
          <a
            href={`https://basescan.com/tx/${hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-black/60 hover:text-black underline"
          >
            View on BaseScan
          </a>
        </div>

        <button
          onClick={onClose}
          className="ml-2 text-black/40 hover:text-black transition"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
