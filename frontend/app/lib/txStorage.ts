import { TxRecord } from "../types/tx";

const KEY = "txHistory";

export function saveTx(tx: TxRecord) {
  const existing = localStorage.getItem(KEY);

  const txs: TxRecord[] = existing ? JSON.parse(existing) : [];

  txs.unshift(tx);

  localStorage.setItem(KEY, JSON.stringify(txs));
}

export function getTxs(): TxRecord[] {
  const data = localStorage.getItem(KEY);
  return data ? JSON.parse(data) : [];
}