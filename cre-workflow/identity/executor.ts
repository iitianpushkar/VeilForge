import type { llmResponse, Config } from "./types";
import { type Runtime, getNetwork, bytesToHex, cre, hexToBase64 } from "@chainlink/cre-sdk";
import { encodeAbiParameters, parseAbiParameters } from "viem";
import { Interface as EthersInterface, AbiCoder } from "ethers";
import { write } from "bun";

export function settleTrade(
  runtime: Runtime<Config>,
  routerAddress: string,
  interfaceString: string,
  parameters: any[]
) {

  const evmCfg = runtime.config.evms[0];

  const network = getNetwork({
    chainFamily: "evm",
    chainSelectorName: evmCfg.chainSelectorName,
    isTestnet: false,
  });

  if (!network) {
    throw new Error(`Unknown chain name: ${evmCfg.chainSelectorName}`);
  }

  runtime.log(`Preparing trade execution via executor: ${evmCfg.executorAddress}`);
  runtime.log(`Router: ${routerAddress}`);
  runtime.log(`Interface: ${interfaceString}`);
  runtime.log(`parameters: ${parameters}`)

  const evmClient = new cre.capabilities.EVMClient(network.chainSelector.selector);


  const iface = new EthersInterface([interfaceString]);
  const functionName = iface.getFunctionName(interfaceString)

  runtime.log(`Detected function: ${functionName}`);

  const callData = iface.encodeFunctionData(functionName,parameters);

  runtime.log(`Encoded router calldata: ${callData}`);

  const abiCoder = AbiCoder.defaultAbiCoder();

  const payload = abiCoder.encode(
    ["address", "uint256", "bytes"],
    [
      routerAddress,
      0n,       
      callData
    ]
  );

  runtime.log(`Encoded executor payload: ${payload}`);

  const reportData = makeReportData(payload as `0x${string}`)

  runtime.log(`report data: ${reportData}`);

    const reportResponse = runtime
    .report({
      encodedPayload: hexToBase64(reportData),
      encoderName: "evm",
      signingAlgo: "ecdsa",
      hashingAlgo: "keccak256",
    })
    .result();
   
    runtime.log(`report response got`);


  const writeResult = evmClient
    .writeReport(runtime,{
      receiver: evmCfg.executorAddress,
      report: reportResponse,
      gasConfig: {
        gasLimit: evmCfg.gasLimit,
      },
    })
    .result();

   // runtime.log(`write result: ${writeResult?.txHash}`);
  if(writeResult.txHash){
    const txHash = bytesToHex(writeResult.txHash);

    runtime.log(`Trade execution tx sent: ${txHash}`);

    return txHash;
  }
  else{
    runtime.log(`Tx error: ${writeResult.errorMessage}`)
  }
}

export function parseLLmResponse(runtime:Runtime<Config>,llmResponse: llmResponse): any {
  try {
    const parsed = JSON.parse(llmResponse.Response);

    const routerAddress:string = parsed.routerAddress;
    const Interface:string = parsed.interface;
    const parameters:any[] = parsed.parameters;

    runtime.log(`router: ${routerAddress} , interface: ${Interface}, parameters: ${parameters}`)

    settleTrade(runtime,routerAddress, Interface, parameters);
  } catch (error) {
    throw new Error(`Failed to parse llm response: ${error}`);
  }
}

const makeReportData = (payload: `0x${string}`) =>
    encodeAbiParameters(parseAbiParameters("bytes memory payload"), [
      payload
    ]);

