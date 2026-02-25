import { HTTPCapability, handler, type Runtime, type HTTPPayload, Runner, HTTPSendRequester, ok, cre, consensusIdenticalAggregation, decodeJson} from "@chainlink/cre-sdk"
import {Config, llmResponse, req} from "./types"

const onHttpTrigger = (runtime: Runtime<Config>, encryptedPayload: HTTPPayload): any => {
  runtime.log(`HTTP trigger received`)

  const decryptedPayload = decrypt();
 
  const {proof,userId} = decryptedPayload

  const httpClient = new cre.capabilities.HTTPClient()

  const result: any = httpClient
        .sendRequest(
          runtime,
          verifyProof(proof),
          consensusIdenticalAggregation()
        )(runtime.config)
        .result();

  // now add userid in verifiedusers array in the contract

  return "processed"
}

const verifyProof = (proof:any) => (sendRequester:HTTPSendRequester,config:Config):any =>{

	const dataToSend = { ...proof, action: "test"}

	const bodyBytes = new TextEncoder().encode(JSON.stringify(dataToSend));
    const body = Buffer.from(bodyBytes).toString("base64");

	const Req = {
        url: `https://developer.world.org/api/v2/verify/app_staging_129259332fd6f93d4fabaadcc5e4ff9d`,
        method: "POST" as const,
        body,
        headers: {
          "Content-Type": "application/json",
        }
      };
  
      // Perform the request within CRE infra; result() yields the response
      const resp = sendRequester.sendRequest(Req).result();
      const bodyText = new TextDecoder().decode(resp.body);
  
      if (!ok(resp)) throw new Error(`HTTP request failed with status: ${resp.statusCode}. Error :${bodyText}`);
  
      return {
        Response: bodyText
      };
  };

const decrypt =()=>{

	return {
		proof:"",
		userId:""
	}

}

const initWorkflow = (config: Config) => {
  const httpTrigger = new HTTPCapability();

  return [
    handler(
      httpTrigger.trigger({
        authorizedKeys: [],
      }),
      onHttpTrigger
    ),
  ]
}

export async function main() {
  const runner = await Runner.newRunner<Config>()
  await runner.run(initWorkflow)
}
