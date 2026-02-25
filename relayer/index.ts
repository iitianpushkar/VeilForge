import express, { type Request, type Response } from "express";
import { ethers, isAddress } from "ethers";
import cors from "cors";
import dotenv from "dotenv";
import { runCreWorkflow } from "./childProcess";

dotenv.config();

const app = express();
const PORT = 8000;

app.use(cors());
app.use(express.json());

async function startServer() {

  app.get("/verify", async (req: Request, res: Response) => {

    const {proof} = req.body

    console.log("proof", proof)

    await runCreWorkflow(proof);

    res.json({status:"simulated"})
  });
  


  /* ------------------------- SERVER ------------------------- */
  app.listen(PORT, () => {
    console.log(`✅ Server running at http://localhost:${PORT}`);
    });
}

startServer().catch((err) => {
  console.error("❌ Failed to start server:", err);
});