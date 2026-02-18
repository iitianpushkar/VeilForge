import { Barretenberg, Fr, UltraHonkBackend } from "@aztec/bb.js";
import { ethers } from "ethers";
import { Noir } from "@noir-lang/noir_js";
import axios from "axios";


export async function generateWithdrawProof(toToken:string,dstEid:string,slippageBps:string,nullifier:string, secret:string, balance:string, recipient:string, withdraw_amount : string) {

  const res = await fetch("/api/withdrawProof");
  const { circuit } = await res.json();

  // Initialize Barretenberg
  const bb = await Barretenberg.new();

  const _nullifier = new Fr(ethers.getBytes(nullifier));
  const _secret = new Fr(ethers.getBytes(secret));

  console.log("Generating balance proof with:");
  console.log("Nullifier:", _nullifier);
  console.log("Secret:", _secret);
  console.log("got recipient", recipient)

  const commitment = await bb.poseidon2Hash([_nullifier, _secret,new Fr(ethers.parseUnits(balance,6))]); 
  console.log("Generating balance proof for commitment:", commitment.toString());

  const new_nullifier = Fr.random();
  const new_secret = Fr.random();

  const nullifierHash = await bb.poseidon2Hash([_nullifier]);
  const new_nullifierHash = await bb.poseidon2Hash([new_nullifier]);

  const response = await axios.post('http://localhost:5000/getBalanceMerkleProof', {
    commitment:commitment.toString()
  });
  const merkleProof = response.data;
  console.log("Merkle Proof:", merkleProof);

  try {
    const noir = new Noir(circuit);
    const honk = new UltraHonkBackend(circuit.bytecode, { threads: 1 });
    const input = {
      // Public inputs
      toToken:toToken,
      dstEid:dstEid,
      slippageBps:slippageBps,
      root: merkleProof.root,
      nullifier_hash: nullifierHash.toString(),
      recipient: recipient.toString(),
      withdraw_amount: ethers.parseUnits(withdraw_amount,6).toString(),
      new_nullifier_hash: new_nullifierHash.toString(),

      // Private inputs
      nullifier: nullifier.toString(),
      secret: secret.toString(),
      merkle_proof: merkleProof.pathElements.map((i:string) => i.toString()), // Convert to string
      is_even: merkleProof.pathIndices.map((i:number) => i % 2 == 0), // if the proof indicie is even, set to false as the hash will be odd
      balance: ethers.parseUnits(balance,6).toString(),
      new_nullifier: new_nullifier.toString(),
      new_secret: new_secret.toString(),
    };
  //  console.log("Circuit Input:", input);
    const { witness } = await noir.execute(input);

    const originalLog = console.log; // Save original
    // Override to silence all logs
    console.log = () => {};

    const { proof, publicInputs } = await honk.generateProof(witness, { keccak: true });
    // Restore original console.log
    console.log = originalLog;

    const new_commitment = publicInputs[8];

    console.log("New commitment:", new_commitment.toString());

    const result = {
      proof: proof,
      publicInputs: publicInputs,
      new_nullifier: new_nullifier.toString(),
      new_secret: new_secret.toString(),
      new_balance: ethers.formatUnits(ethers.parseUnits(balance,6) - ethers.parseUnits(withdraw_amount,6),6),
    }

    return result;

  } catch (error) {
    console.log(error);
    throw error;
  }
}