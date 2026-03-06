import { generateIDProof } from "../lib/idProof";
import { getCurrentWallet } from "../lib/walletStore";
import { generateWithdrawProof } from "../lib/withdrawProof";
import { ethers } from "ethers";
import { updateWallet } from "../lib/walletStore";
import axios from "axios";
import { swapPayload } from "./types";

export async function swap(type:string,swapPayload:swapPayload, withdraw_amount:string) {
    
    const idData = localStorage.getItem("zkID")
    const parsedIDdata = JSON.parse(idData!)

    const {idProof,idPublicInputs} = await generateIDProof(parsedIDdata.uuid,parsedIDdata.secret);

    const idFormattedProof = `0x${Buffer.from(idProof).toString("hex")}`

    const walletData = getCurrentWallet();

    console.log("old wallet data", walletData);

    if (!walletData) {
      throw new Error("No wallet selected");
    }

    const nullifier = walletData.nullifier;
    const secret = walletData.secret;
    const balance = walletData.balance;

    const {proof, publicInputs, new_nullifier, new_secret, new_balance} = await generateWithdrawProof(nullifier,secret,balance,swapPayload.recipient,withdraw_amount);

    const balanceFormattedProof = `0x${Buffer.from(proof).toString("hex")}`

    console.log("publicInputs", publicInputs);

    let hash;
    
    try {
    const response = await axios.post(`http://localhost:8000/${type}`,{
        swapPayload:swapPayload,
        idProof: idFormattedProof,
        idRoot: idPublicInputs[0],
        idNullifier: idPublicInputs[1],
        balanceFormattedProof:balanceFormattedProof,
        root: publicInputs[0],
        nullifierHash: publicInputs[1],
        recipient: swapPayload.recipient,
        scaledAmount: ethers.parseUnits(withdraw_amount,6).toString(),
        newNullifierHash: publicInputs[4],
        newCommitment: publicInputs[5],
    })

    const tx = response.data.txHash;

    console.log("swapped",tx);

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