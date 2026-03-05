import express, { type Request, type Response } from "express";
import { ethers, isAddress } from "ethers";
import cors from "cors";
import dotenv from "dotenv";
import { IdWorkflow } from "./childProcess";
import { pool, idmixer } from "./contract";

dotenv.config();

const app = express();
const PORT = 8000;

app.use(cors());
app.use(express.json());

async function startServer() {

  app.post("/verify", async (req: Request, res: Response) => {

    console.log(req.body)
    
    const userData = req.body;

    const result =  await IdWorkflow(userData);

    console.log("result:",result);

    const json = JSON.parse(result.Response)

    console.log("success", json.success)

    const success:boolean = json.success;
    
    if(!success) return;

    console.log("executing id creation onchain", userData.commitment);

    console.log("idmixer", await idmixer.getAddress())

    const tx = await idmixer.createID!(userData.commitment)

    await tx.wait();

    console.log("id created", tx.hash)

    res.json({txHash:tx.hash})
  });

  app.post("/withdraw", async (req: Request, res: Response) => {
    try {
      console.log("Received withdraw request");

      const {
        idProof,
        idRoot,
        idNullifier,
        balanceFormattedProof,
        root,
        nullifierHash,
        recipient,
        scaledAmount,
        newNullifierHash,
        newCommitment
      } = req.body;

      if (!isAddress(recipient)) {
        return res.status(400).json({ error: "Invalid recipient address" });
      }

      console.log("executing tx");

      const tx = await pool.withdraw!(
        { idProof, idRoot, idNullifier },
        {
            _proof: balanceFormattedProof,
            _root: root,
            _nullifierHash: nullifierHash,
            _recipient: recipient,
            _amount: scaledAmount,
            _newNullifierHash: newNullifierHash,
            _newCommitment: newCommitment
          
        }
      );

      await tx.wait();
      console.log(`Withdraw tx: ${tx.hash}`);

      res.json(tx.hash);
    } catch (err: any) {
      console.error("Withdraw failed:", err);
      res.status(500).json({
        error: "Withdraw failed",
        reason: err?.reason || err?.message
      });
    }
  });


  /* ------------------------- SERVER ------------------------- */
  app.listen(PORT, () => {
    console.log(`✅ Server running at http://localhost:${PORT}`);
    });
}

startServer().catch((err) => {
  console.error("❌ Failed to start server:", err);
});