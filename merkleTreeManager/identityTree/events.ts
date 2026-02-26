import { idmixer } from "../contract";
import { IdentityTree } from "..";

export function IDMixerEvents() {
  idmixer.on("IDCreated", async (commitment, leafIndex, timestamp) => {
    console.log("🆔 IDCreated event detected:");
    console.log("Commitment:", commitment);
    console.log("Leaf Index:", leafIndex.toString());
    console.log("Timestamp:", timestamp.toString());

    await IdentityTree.insert(commitment.toString());
    console.log("Updated IdentityTree Root:", IdentityTree.root());
  });
}
