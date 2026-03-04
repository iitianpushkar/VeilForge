import type { Config } from "./types";
import { type Runtime, getNetwork, bytesToHex, cre, hexToBase64 } from "@chainlink/cre-sdk";
import { encodeAbiParameters, parseAbiParameters } from "viem";

export const createID = (
  runtime: Runtime<Config>,
  commitment:string
):any => {

  runtime.log(`commitment: ${commitment}`);

  const evmCfg = runtime.config.evms[0];

  const network = getNetwork({
    chainFamily: "evm",
    chainSelectorName: evmCfg.chainSelectorName,
    isTestnet: false,
  });

  if (!network) {
    throw new Error(`Unknown chain name: ${evmCfg.chainSelectorName}`);
  }

  runtime.log(`Preparing identity creation via executor: ${evmCfg.executorAddress}`);

  const evmClient = new cre.capabilities.EVMClient(network.chainSelector.selector);

  const reportData = makeReportData(commitment)

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

    runtime.log(`write result: ${writeResult?.txHash}`);
  if(writeResult.txHash){
    const txHash = bytesToHex(writeResult.txHash);

    runtime.log(`ID creation tx sent: ${txHash}`);

    return txHash;
  }
  else{
    runtime.log(`Tx error: ${writeResult.errorMessage}`)
  }
}

const makeReportData = (commitment:string) =>
    encodeAbiParameters(parseAbiParameters("bytes32 _commitment"), [
      commitment as `0x${string}`
    ]);

