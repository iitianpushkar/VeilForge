import { Barretenberg, Fr, UltraHonkBackend } from "@aztec/bb.js";
import { ethers, sha256 } from "ethers";
import { Noir } from "@noir-lang/noir_js";
import axios from "axios";


export async function generateIDProof(document:string, secret:string) {

  const res = await fetch("/api/idProof");
  const { circuit } = await res.json();


  // Initialize Barretenberg
  const bb = await Barretenberg.new();

  // 2️⃣ Reduce hash → field element
  const _document = Fr.fromBufferReduce(
    Buffer.from(document)
  );
  const _secret = new Fr(ethers.getBytes(secret));

  console.log("Generating idproof with:");
  console.log("document:", _document);
  console.log("Secret:", _secret)

  const commitment = await bb.poseidon2Hash([_document, _secret]);   // use this for merkle proof
  console.log("Generating idproof for commitment:", commitment.toString());

  const nullifier = Fr.random();

  const response = await axios.post('http://localhost:5000/getIdentityMerkleProof', {
    commitment:commitment.toString()
  });
  const merkleProof = response.data;
  console.log("id Merkle Proof:", merkleProof);

  try {
    const noir = new Noir(circuit);
    const honk = new UltraHonkBackend(circuit.bytecode, { threads: 1 });
    const input = {
      // Public inputs
      root: merkleProof.root,
      nullifier: nullifier.toString(),

      // Private inputs
      document: _document.toString(),
      secret: _secret.toString(),
      merkle_proof: merkleProof.pathElements.map((i:string) => i.toString()),
      is_even: merkleProof.pathIndices.map((i:number) => i % 2 == 0)
    };

    const { witness } = await noir.execute(input);

    const originalLog = console.log; // Save original
    // Override to silence all logs
    console.log = () => {};

    const { proof, publicInputs } = await honk.generateProof(witness, { keccak: true });
    // Restore original console.log
    console.log = originalLog;

    const result = {
      idProof: proof,
      idPublicInputs: publicInputs
    }

    return result;

  } catch (error) {
    console.log(error);
    throw error;
  }
}