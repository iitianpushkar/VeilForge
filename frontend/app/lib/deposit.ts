import { generateIDProof } from "../lib/idProof";
import { getCurrentWallet, updateWallet } from "../lib/walletStore";
import { WriteContractMutateAsync } from "wagmi/query";
import { pool_abi } from "../utils/poolAbi";
import { generateDepositProof } from "../lib/depositProof";
import { Config } from "wagmi";
import {ethers} from "ethers";
import {ERC20_ABI} from "../utils/ERC20_ABI";

const USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
export const POOL = "0x271a99F3f1B14D6E0C8eBA5Ad304504b0df6BE23";

export async function deposit(writeContractAsync:WriteContractMutateAsync<Config,unknown>,depositor:`0x${string}`,deposit_amount:string){
    
    const idData = localStorage.getItem("zkID")
    const parsedIDdata = JSON.parse(idData!)

    const {idProof,idPublicInputs} = await generateIDProof(parsedIDdata.uuid,parsedIDdata.secret);

    const idFormattedProof = `0x${Buffer.from(idProof).toString("hex")}`

    const walletData = getCurrentWallet();

    if (!walletData) {
      throw new Error("No wallet selected");
    }

    const nullifier = walletData.nullifier;
    const secret = walletData.secret;
    const balance = walletData.balance;

    const {proof, publicInputs, new_nullifier, new_secret, new_balance} = await generateDepositProof(nullifier,secret,balance,depositor,deposit_amount);

    const balanceFormattedProof = `0x${Buffer.from(proof).toString("hex")}`

    console.log("balance formatted proof", balanceFormattedProof);
    console.log("balance publicInputs", publicInputs);

    /* ================= USDC APPROVE ================= */
    console.log("Approving USDC...");

    const approvedTx = await writeContractAsync({
      address: USDC,
      abi: ERC20_ABI,
      functionName: "approve",
      args: [POOL, ethers.parseUnits(deposit_amount,6)]
    });

    console.log("approved tx", approvedTx);
        
    const tx = await writeContractAsync({
      address: '0x271a99F3f1B14D6E0C8eBA5Ad304504b0df6BE23',
      abi: pool_abi,
      functionName: 'deposit',
      args: [
        {
          idProof: idFormattedProof,
          idRoot: idPublicInputs[0],
          idNullifier: idPublicInputs[1]
        },
        {
          _proof : balanceFormattedProof,
          _root : publicInputs[0],
          _nullifierHash : publicInputs[1],
          _depositer: depositor,
          _amount : ethers.parseUnits(deposit_amount,6),
          _newNullifierHash: publicInputs[4],
          _newCommitment: publicInputs[5]
        }
      ]
    });

    console.log("deposited",tx);

    walletData.nullifier = new_nullifier;
    walletData.secret = new_secret;
    walletData.balance = new_balance;

    console.log("new wallet data", walletData);

    updateWallet(walletData.id,walletData.nullifier,walletData.secret,walletData.balance);

    return tx.toString();
  
}