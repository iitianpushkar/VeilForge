import type { llmResponse, Config } from "./types";
import { type Runtime, getNetwork, bytesToHex, cre, hexToBase64 } from "@chainlink/cre-sdk";
import { encodeAbiParameters, parseAbiParameters } from "viem";
import { Interface as EthersInterface, AbiCoder, Interface } from "ethers";

export function route(
  runtime: Runtime<Config>,
  routerAddress: string,
  interfaceString: string,
  parameters: any[]
) {

  runtime.log(`Router: ${routerAddress}`);
  runtime.log(`Interface: ${interfaceString}`);
  runtime.log(`parameters: ${parameters}`)

  const iface = new EthersInterface([interfaceString]);
  const functionName = iface.getFunctionName(interfaceString)

  runtime.log(`Detected function: ${functionName}`);

  const callData = iface.encodeFunctionData(functionName,parameters);

  runtime.log(`Encoded router calldata: ${callData}`);

  const abiCoder = AbiCoder.defaultAbiCoder();

  const route = abiCoder.encode(
    ["address", "uint256", "bytes"],
    [
      routerAddress,
      0n,       
      callData
    ]
  );

  runtime.log(`Encoded route: ${route}`);

  return route;
}

export function parseLLmResponse(runtime:Runtime<Config>,llmResponse: llmResponse): {
  routerAddress: string,
  Interface: string,
  parameters: any[]
} {
  try {
    const parsed = JSON.parse(llmResponse.Response);

    const routerAddress:string = parsed.routerAddress;
    const Interface:string = parsed.interface;
    const parameters:any[] = parsed.parameters;

    runtime.log(`router: ${routerAddress} , interface: ${Interface}, parameters: ${parameters}`)

    return {
      routerAddress: routerAddress,
      Interface: Interface,
      parameters: parameters
    };
  } catch (error) {
    throw new Error(`Failed to parse llm response: ${error}`);
  }
}
