export type TxType =
  | "wallet_creation"
  | "deposit"
  | "withdraw"
  | "swap"
  | "bridge";

export type TxRecord = {
  txHash: string;
  type: TxType;
  timestamp: number;

  amount?: string;
  token?: string;

  fromToken?: string;
  toToken?: string;
  dex?:string;

  recipient?: string;
};