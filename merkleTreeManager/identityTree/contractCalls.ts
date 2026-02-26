import { idmixer } from "../contract";

/**
 * Get all commitments stored on-chain
 */
export async function getIdentityCommitments() {
  try {
    const commitments: string[] = await idmixer.getCommitments();
    console.log("Identity Commitments:", commitments);
    return commitments;
  } catch (err: any) {
    console.error("❌ Failed to fetch identity commitments:", err);
    throw err;
  }
}