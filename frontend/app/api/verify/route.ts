import { type IVerifyResponse, verifyCloudProof } from "@worldcoin/idkit";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const proof = await request.json();
  const app_id = "app_812b3faf89ee1a672e8913c69ce528c0";
  const action = "anonymous-identity";

  console.log("proof", proof);
  const verifyRes = (await verifyCloudProof(
    proof,
    app_id,
    action
  )) as IVerifyResponse;

  if (verifyRes.success) {
    // This is where you should perform backend actions if the verification succeeds
    // Such as, setting a user as "verified" in a database
    return NextResponse.json(verifyRes, { status: 200 });
  } else {
    // This is where you should handle errors from the World ID /verify endpoint.
    // Usually these errors are due to a user having already verified.
    return NextResponse.json(verifyRes, { status: 400 });
  }
}
