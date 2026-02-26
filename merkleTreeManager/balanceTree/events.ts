import { pool } from "../contract";
import { BalanceTree } from "..";

export function PoolEvents() {

  pool.on("WalletCreated", async (commitment, leafIndex, timestamp) => {
    console.log("🆕 WalletCreated event detected:");
    console.log("Commitment:", commitment);
    console.log("Leaf Index:", leafIndex.toString());
    console.log("Timestamp:", timestamp.toString());
  
    await BalanceTree.insert(commitment.toString());
    console.log("Updated Merkle BalanceTree Root:", BalanceTree.root());
  });
  
  pool.on("Deposit", async (commitment, value, leafIndex, timestamp) => {
    console.log("📥 Deposit event detected:");
    console.log("Commitment:", commitment);
    console.log("Value:", value.toString());
    console.log("Leaf Index:", leafIndex.toString());
    console.log("Timestamp:", timestamp.toString());
  
    await BalanceTree.insert(commitment.toString());
    console.log("Updated Merkle BalanceTree Root:", BalanceTree.root());
  });

  pool.on("Withdrawal", async (to, amount, commitment, leafIndex, timestamp) => {
    console.log("💸 Withdrawal event detected:");
    console.log("To:", to);
    console.log("Amount:", amount.toString());
    console.log("Commitment:", commitment);
    console.log("Leaf Index:", leafIndex.toString());
    console.log("Timestamp:", timestamp.toString());
  
    await BalanceTree.insert(commitment.toString());
    console.log("Updated Merkle BalanceTree Root:", BalanceTree.root());
  });  
}