import { generateIDProof } from "../lib/idProof";
import { getCurrentWallet } from "../lib/walletStore";
import { generateWithdrawProof } from "../lib/withdrawProof";
import { ethers } from "ethers";
import { updateWallet } from "../lib/walletStore";
import axios from "axios";

export async function withdraw(type:string,recipient:string,withdraw_amount:string,toToken:string,dstEid:string,slippageBps:string) {
    
    const idData = localStorage.getItem("zkID")
    const parsedIDdata = JSON.parse(idData!)

    const {idProof,idPublicInputs} = await generateIDProof(parsedIDdata.document,parsedIDdata.secret);

    const idFormattedProof = `0x${Buffer.from(idProof).toString("hex")}`

    const walletData = getCurrentWallet();

    console.log("old wallet data", walletData);

    if (!walletData) {
      throw new Error("No wallet selected");
    }

    const nullifier = walletData.nullifier;
    const secret = walletData.secret;
    const balance = walletData.balance;

    const {proof, publicInputs, new_nullifier, new_secret, new_balance} = await generateWithdrawProof(toToken,dstEid,slippageBps,nullifier,secret,balance,recipient,withdraw_amount);

    const balanceFormattedProof = `0x${Buffer.from(proof).toString("hex")}`

    console.log("publicInputs", publicInputs);

    let hash;
    
    try {
    const response = await axios.post(`http://localhost:8000/${type}`,{
        toToken:toToken,
        dstEid:dstEid,
        slippageBps:slippageBps,
        idProof: idFormattedProof,
        idRoot: idPublicInputs[0],
        idNullifier: idPublicInputs[1],
        balanceFormattedProof:balanceFormattedProof,
        root: publicInputs[3],
        nullifierHash: publicInputs[4],
        recipient: recipient,
        scaledAmount: ethers.parseUnits(withdraw_amount,6).toString(),
        newNullifierHash: publicInputs[7],
        newCommitment: publicInputs[8],
    })

    const tx = response.data;

    console.log("withdrew",tx);

    hash = tx;

    const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL!);
    const receipt = await provider.waitForTransaction(tx);
    if (!receipt || receipt.status !== 1) {
      throw new Error("Withdraw transaction failed");
    }
          
  } catch (error) {
    console.log("error in withdrawing", error); 
    return;
  }

    walletData.nullifier = new_nullifier;
    walletData.secret = new_secret;
    walletData.balance = new_balance;

    console.log("new wallet data", walletData);

    updateWallet(walletData.id,walletData.nullifier,walletData.secret,walletData.balance);

    return hash;

}