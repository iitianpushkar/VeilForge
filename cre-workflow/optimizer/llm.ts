import {
    cre,
    ok,
    consensusIdenticalAggregation,
    type Runtime,
    type HTTPSendRequester,
  } from "@chainlink/cre-sdk";
  import { Config, type OpenrouterReq, type OpenrouterRes, type req, type llmResponse } from "./types";
  import {parseLLmResponse} from "./executor";
  
  const systemPrompt = `
  You are an onchain execution planner for EVM-based decentralized exchanges.
  
  Your task:
  - Given a DEX name and swap parameters, identify the correct router contract.
  - Identify the correct swap function interface.
  - Produce ABI-encoded calldata suitable for a low-level EVM call.
  - Do NOT invent new contracts or functions.
  
  EXAMPLE DEXES:
  - Uniswap V2
  - SushiSwap
  - Uniswap V3
  - PancakeSwap V3
  - fluid
  
  OUTPUT FORMAT (CRITICAL):
  Return a SINGLE minified JSON object with EXACTLY these fields and order:
  
  {
    "routerAddress": "0x...",
    "interface": " ",
    "parameters": [],
    "value": "0",
    "dex": "<string>",
    "confidence": <integer 0-10000>
  }
  
  INTERFACE RULES:
  - Return the EXACT function signature as a string (e.g., "function swapExactTokensForTokens(...)")
  - Include the full function signature with parameter types and names
  - For payable functions, include "payable" keyword
  - For view/pure functions, include "view" or "pure" keyword
  - Include return types if any
  
  PARAMETERS RULES:
  - "parameters" MUST be an array of values matching the function signature parameter order
  - Each parameter value MUST be a string representation of the value
  - For uint256: use decimal string (e.g., "100000000" for 100000000 wei)
  - For address: use hex string with 0x prefix (e.g., "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48")
  - For address[]: use array of address strings (e.g., ["0x...", "0x..."])
  - For deadline: calculate current timestamp + 20 minutes (current time + 1200 seconds)
  - Path array MUST contain [fromToken, toToken] addresses in order
  
  VALUE RULES:
  - "value" is the ETH amount (in wei as decimal string) to send with the transaction
  - For token-to-token swaps: "0"
  - For ETH-to-token swaps: use amountIn as decimal string
  - For token-to-ETH swaps: "0" (ETH is received, not sent)
  
  STRICT RULES:
  - Output MUST be valid JSON, one line, no whitespace.
  - NO explanations, NO markdown, NO comments.
  - routerAddress MUST be a valid Ethereum address (0x...)
  - interface MUST be a valid Solidity function signature
  - parameters MUST match the function signature parameter order exactly
  - If unsure or unsupported, output EXACTLY:
  {"routerAddress":"0x0000000000000000000000000000000000000000","interface":"function unknown()","parameters":[],"value":"0","dex":"UNKNOWN","confidence":0}
  `;
  
  const userPrompt = `
  Identify the router contract address, swap function interface, and ALL parameters needed to call the swap function for the given DEX.
  
  You MUST:
  1. Identify the correct router contract address for the DEX on the specified network
  2. Identify the correct swap function signature
  3. Construct the parameters array matching the function signature order and produce minAmountOut based on slippage
  4. Set value field: "0" for token swaps
  
  Return ONLY the JSON object with routerAddress, interface, parameters, value, dex, and confidence fields as described in the system instructions like:
  {
    "routerAddress": "0x...",
    "interface": " ",
    "parameters": [],
    "value": "0",
    "dex": "<string>",
    "confidence": <integer 0-10000>
  }

  and nothing else other than that. Make no mistakes. Don't give me your reasoning or anything, just the JSON object that i can just parse.
  Also, if there is anything like deadline for swap, use 1800000000. 
  
  Swap request:
  `;
    
  export const askLLM = (runtime: Runtime<Config>, params: req, dex:string): llmResponse => {
      // API key for the outbound LLM request (stored in CRE secrets)
      const openrouterApiKey = runtime.getSecret({ id: "OPENROUTER_API_KEY" }).result();

      runtime.log(`prompt: ${userPrompt+JSON.stringify(params)+dex}`);
  
        // Fan out the HTTP request through CRE; aggregate identical responses
      const httpClient = new cre.capabilities.HTTPClient();
  
      const result: llmResponse = httpClient
        .sendRequest(
          runtime,
          PostGeminiData(params, dex, openrouterApiKey.value),
          consensusIdenticalAggregation<llmResponse>()
        )(runtime.config)
        .result();


      runtime.log(`llm response: ${result.Response}`);

    return result;
  }
  
  const PostGeminiData =
    (params:req, dex:string , openrouterApiKey: string) =>
    (sendRequester: HTTPSendRequester, config: Config): llmResponse => {

        const prompt = userPrompt+JSON.stringify(params)+dex;

        const dataToSend: OpenrouterReq = {
        model:config.Model,
        messages:[
            {
                role:"system",
                content:systemPrompt
            },
            {
                role:"user",
                content: prompt
            }
        ],
        plugins: [{id:"web"}]
      };
  
      // Encode request body as base64 (required by CRE HTTP capability)
      const bodyBytes = new TextEncoder().encode(JSON.stringify(dataToSend));
      const body = Buffer.from(bodyBytes).toString("base64");
  
      const Req = {
        url: `https://openrouter.ai/api/v1/chat/completions`,
        method: "POST" as const,
        body,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openrouterApiKey}`
        }
      };
  
      // Perform the request within CRE infra; result() yields the response
      const resp = sendRequester.sendRequest(Req).result();
      const bodyText = new TextDecoder().decode(resp.body);
  
      if (!ok(resp)) throw new Error(`HTTP request failed with status: ${resp.statusCode}. Error :${bodyText}`);
  
      // Parse and extract the model text
      const externalResp = JSON.parse(bodyText);
  
      const text = externalResp.choices[0].message.content;
      if (!text) throw new Error("Malformed LLM response: missing response");
  
      return {
        Response: text,
      };
    };