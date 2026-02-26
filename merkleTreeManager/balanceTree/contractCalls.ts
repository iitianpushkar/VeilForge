import { pool } from "../contract";

/**
 * Get all commitments stored on-chain
 */
export async function getBalanceCommitments() {
  try {
    const commitments: string[] = await pool.getCommitments();
    console.log("balance Commitments:", commitments);
    return commitments;
  } catch (err: any) {
    console.error("❌ Failed to fetch balance commitments:", err);
    throw err;
  }
}