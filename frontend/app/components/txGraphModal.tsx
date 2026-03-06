"use client";

export default function TxGraphModal({
  fromToken,
  toToken,
  DEX,
  onClose,
}: {
  fromToken: string;
  toToken: string;
  DEX: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-md z-50">

      <div className="relative bg-white/90 backdrop-blur-xl border border-black/10 rounded-3xl p-8 w-[340px] shadow-xl">

        {/* header */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-semibold text-black text-lg">
            Swap Route
          </h3>

          <button
            onClick={onClose}
            className="text-black/40 hover:text-black text-lg"
          >
            ✕
          </button>
        </div>

        {/* route */}
        <div className="flex flex-col items-center gap-4">

          {/* FROM TOKEN */}
          <div className="flex items-center gap-3 bg-blue-50 px-4 py-2 rounded-xl">
            <img
              src={`/${fromToken.toLowerCase()}.png`}
              className="w-7 h-7 rounded-full"
            />
            <span className="font-medium">{fromToken}</span>
          </div>

          {/* arrow */}
          <div className="text-black/40 text-lg">
            ↓
          </div>

          {/* DEX NODE */}
          <div className="flex items-center gap-2 bg-purple-50 px-4 py-2 rounded-xl border border-purple-200">
            <span className="text-sm font-medium text-purple-700">
              {DEX}
            </span>
          </div>

          {/* arrow */}
          <div className="text-black/40 text-lg">
            ↓
          </div>

          {/* TO TOKEN */}
          <div className="flex items-center gap-3 bg-green-50 px-4 py-2 rounded-xl">
            <img
              src={`/${toToken.toLowerCase()}.png`}
              className="w-7 h-7 rounded-full"
            />
            <span className="font-medium">{toToken}</span>
          </div>

        </div>

        {/* footer */}
        <button
          onClick={onClose}
          className="
            mt-8
            w-full
            rounded-full
            py-2
            text-sm
            font-medium
            bg-black
            text-white
            hover:bg-black/90
            transition
          "
        >
          Close
        </button>

      </div>
    </div>
  );
}