"use client";

import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <main className="bg-[#f7f7f5] text-black overflow-hidden">

      {/* ================= NAVBAR ================= */}
      <nav className="flex justify-between items-center px-8 py-6">
        <div className="text-sm font-semibold tracking-tight">
          VeilForge
        </div>

        <button
          onClick={() => router.push("/swap")}
          className="text-sm px-5 py-2 rounded-full border border-black/10 hover:bg-black/5 transition"
        >
          Launch App
        </button>
      </nav>

      {/* ================= HERO ================= */}
      <section className="min-h-[80vh] flex flex-col items-center justify-center text-center px-6">
        <h1 className="text-5xl md:text-7xl font-semibold tracking-tight leading-[1.1] max-w-4xl">
          Private execution.
          <br />
          Intelligent routing.
        </h1>

        <p className="mt-8 text-lg md:text-xl text-black/60 max-w-2xl leading-8">
          Swap, bridge, and move liquidity across chains
          without revealing identity, balances, or intent.
        </p>

        <button
          onClick={() => router.push("/swap")}
          className="mt-12 h-12 px-10 rounded-full bg-black text-white text-sm font-medium hover:bg-black/90 transition"
        >
          Launch App
        </button>
      </section>

      {/* ================= FEATURES GRID ================= */}
      <section className="py-32 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-10">

          <div className="p-8 rounded-3xl bg-white/70 backdrop-blur-xl border border-black/5">
            <h3 className="text-lg font-semibold mb-4">Zero-Knowledge Core</h3>
            <p className="text-sm text-black/60 leading-6">
              Authorize swaps using zk balance proofs.
              No identity. No public balance exposure.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-white/70 backdrop-blur-xl border border-black/5">
            <h3 className="text-lg font-semibold mb-4">Intelligent CRE Routing</h3>
            <p className="text-sm text-black/60 leading-6">
              Encrypted trade intent is optimized off-chain
              and executed through verified routers.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-white/70 backdrop-blur-xl border border-black/5">
            <h3 className="text-lg font-semibold mb-4">Cross-Chain Native</h3>
            <p className="text-sm text-black/60 leading-6">
              Private liquidity on Base with seamless
              cross-chain settlement.
            </p>
          </div>

        </div>
      </section>

      {/* ================= HOW IT WORKS ================= */}
      <section className="py-32 px-6 bg-black/[0.02]">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl font-semibold tracking-tight mb-20">
            How It Works
          </h2>

          <div className="grid md:grid-cols-4 gap-10 text-sm text-black/60">

            <div>
              <div className="text-black font-medium mb-3">01</div>
              Deposit USDC into a private pool.
            </div>

            <div>
              <div className="text-black font-medium mb-3">02</div>
              Generate zero-knowledge balance proof.
            </div>

            <div>
              <div className="text-black font-medium mb-3">03</div>
              CRE determines optimal execution path.
            </div>

            <div>
              <div className="text-black font-medium mb-3">04</div>
              Tokens settle privately and unlinkably.
            </div>

          </div>
        </div>
      </section>

      {/* ================= SPLIT SECTION ================= */}
      <section className="py-32 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-20 items-center">

          <div>
            <h2 className="text-3xl font-semibold tracking-tight leading-tight">
              Privacy should be invisible.
            </h2>

            <p className="mt-8 text-black/60 leading-7">
              The protocol never stores personal data.
              Identity verification, balance ownership,
              and trade authorization are handled
              through zero-knowledge primitives.
            </p>

            <button
              onClick={() => router.push("/swap")}
              className="mt-10 h-12 px-8 rounded-full bg-black text-white text-sm font-medium hover:bg-black/90 transition"
            >
              Launch App
            </button>
          </div>

          <div className="h-80 rounded-3xl bg-gradient-to-br from-black/5 to-black/10 border border-black/5" />
        </div>
      </section>

      {/* ================= FINAL CTA ================= */}
      <section className="py-40 text-center border-t border-black/5">
        <h2 className="text-4xl font-semibold tracking-tight">
          DeFi without exposure.
        </h2>

        <button
          onClick={() => router.push("/swap")}
          className="mt-12 h-12 px-10 rounded-full bg-black text-white text-sm font-medium hover:bg-black/90 transition"
        >
          Launch App
        </button>
      </section>

    </main>
  );
}