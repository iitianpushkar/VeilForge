// chains.ts
import { ChainWithTokens } from "@/app/types/chains";

export const CHAINS: ChainWithTokens[] = [
  {
    eid: "30110",
    name: "Arbitrum",
    tokens: [
      { symbol: "ETH", name: "Ethereum", address: "", decimals:"18" },
      { symbol: "USDC", name: "USD Coin", address: "", decimals:"6" },
      {symbol: "ARB", name: "Arbitrum token", address: "", decimals:""}
    ],
  },
  {
    eid: "30184",
    name: "Base",
    tokens: [
      { symbol: "ETH", name: "Ethereum", address: "0x4200000000000000000000000000000000000006", decimals:"18" },
      { symbol: "DAI", name: "Dai", address: "" , decimals:"6"},
    ],
  },
];
