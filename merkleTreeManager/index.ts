import express, { Request, Response } from "express";
import { PoolEvents } from "./balanceTree/events.ts";
import { IDMixerEvents } from "./identityTree/events.ts";
import { merkleTree as balanceMT } from "./balanceTree/merkle.js";
import { merkleTree as identityMT } from "./identityTree/merkle.js";
import { getBalanceCommitments } from "./balanceTree/contractCalls.ts";
import { getIdentityCommitments } from "./identityTree/contractCalls.ts";
import cors from "cors";

const app = express();
const PORT = 5000;

app.use(cors())

app.use(express.json());

let BalanceTree: any;
let IdentityTree: any;

async function startServer() {

  // Initialize Merkle Tree with empty leaves or from contract
  BalanceTree = await balanceMT(await getBalanceCommitments());
  console.log("Initial Pool Merkle Tree Root:", BalanceTree.root());

  IdentityTree = await identityMT(await getIdentityCommitments());
  console.log("Initial Identity Merkle Tree Root", IdentityTree.root());

  app.post("/getBalanceMerkleProof", async (req: Request, res: Response) => {
    const commitment = req.body.commitment;
    try {
      const index = BalanceTree.getIndex(commitment);
      const balanceMerkleProof = BalanceTree.proof(index);
      console.log(`Merkle proof:${balanceMerkleProof}`);
      res.json(balanceMerkleProof);
    } catch (err) {
      res.status(500).json({ error: "Failed to get balance Merkle proof" });
    }
  });

  app.post("/getIdentityMerkleProof", async (req: Request, res: Response) => {
    const commitment = req.body.commitment;
    try {
      const index =IdentityTree.getIndex(commitment);
      const IdentityMerkleProof = IdentityTree.proof(index);
      console.log(`Merkle proof:${IdentityMerkleProof}`);
      res.json(IdentityMerkleProof);
    } catch (err) {
      res.status(500).json({ error: "Failed to get Identity Merkle proof" });
    }
  });

  // Start server
  app.listen(PORT, () => {
    console.log(`✅ Server running at http://localhost:${PORT}`);
    PoolEvents(); 
    IDMixerEvents();
  });
}

// Start the async initialization
startServer().catch((err) => {
  console.error("❌ Failed to start server:", err);
});

export { app, BalanceTree, IdentityTree };