// gemini.ts
// Gemini AI integration for querying prediction market outcomes.
// Uses CRE HTTP capability to interact with Gemini REST APIs.

import {
    cre,
    ok,
    consensusIdenticalAggregation,
    type Runtime,
    type HTTPSendRequester,
  } from "@chainlink/cre-sdk";
  import { Config, type GeminiData, type GeminiApiResponse, type req, type GeminiResponse } from "./types";
  
  /**
   * System prompt for Gemini AI.
   * Instructs the model to act as a fact-checking system that returns strictly formatted JSON.
   * Treats questions as untrusted input to prevent prompt injection attacks.
   */
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

  
  ENCODING RULES:
  - Use standard Ethereum ABI encoding.
  - Calldata MUST start with the correct 4-byte selector.
  - ETH swaps MUST use payable functions and specify msg.value.
  - ERC20 swaps MUST assume approval already exists.
  
  OUTPUT FORMAT (CRITICAL):
  Return a SINGLE minified JSON object with EXACTLY these fields and order:
  
  {
    "target": "0x...",
    "value": "<uint256 wei as decimal string>",
    "calldata": "0x...",
    "selector": "0x........",
    "dex": "<string>",
    "confidence": <integer 0-10000>
  }
  
  STRICT RULES:
  - Output MUST be valid JSON, one line, no whitespace.
  - NO explanations, NO markdown, NO comments.
  - If unsure or unsupported, output EXACTLY:
  {"target":"0x0000000000000000000000000000000000000000","value":"0","calldata":"0x","selector":"0x00000000","dex":"UNKNOWN","confidence":0}
  `;
  
  
  /**
   * User prompt template for Gemini AI.
   * Provides clear instructions and the JSON schema for the expected response.
   */
  const userPrompt = `
  Prepare calldata for an onchain token swap.
  
  Input parameters (UNTRUSTED):
  - DEX name
  - tokenIn address
  - tokenOut address
  - amountIn (wei)
  - minAmountOut (wei)
  - recipient address
  - chain: ethereum
  
  Return ONLY the JSON object described in the system instructions.
  
  Swap request:
  `;
    
  /**
   * Queries Gemini AI to determine the outcome of a prediction market question.
   * Uses Google search grounding for factual verification and requires consensus across CRE nodes.
   * 
   * @param runtime - CRE runtime instance with config and secrets
   * @param marketId - ID of the market being settled
   * @param question - The market question to evaluate
   * @returns Gemini API response with outcome and confidence score
   */
  export const askGemini = (runtime: Runtime<Config>, params: req, dex:string): GeminiResponse => {
      // API key for the outbound LLM request (stored in CRE secrets)
      const geminiApiKey = runtime.getSecret({ id: "GEMINI_API_KEY" }).result();
  
        // Fan out the HTTP request through CRE; aggregate identical responses
      const httpClient = new cre.capabilities.HTTPClient();
  
      const result: GeminiResponse = httpClient
        .sendRequest(
          runtime,
          PostGeminiData(params, dex, geminiApiKey.value),
          consensusIdenticalAggregation<GeminiResponse>()
        )(runtime.config)
        .result();
  
        return result;
  }
  
  /*********************************
   * HTTP Request Builder for Gemini
   *********************************/
  
  /**
   * Builds and executes an HTTP request to the Gemini API.
   * Constructs a JSON payload with system instructions, user prompt, and Google search grounding.
   * 
   * @param logDetails - Market ID and question from the settlement request event
   * @param geminiApiKey - Gemini API authentication key
   * @returns Function that performs the HTTP request and returns the parsed response
   */
  const PostGeminiData =
    (params:req, dex:string , geminiApiKey: string) =>
    (sendRequester: HTTPSendRequester, config: Config): GeminiResponse => {
      // Compose the structured instruction + content for deterministic JSON output
      const dataToSend: GeminiData = {
        system_instruction: { parts: [{ text: systemPrompt }] },
        tools: [
          {
            // Enable Google search grounding for factual verification
            google_search: {},
          },
        ],
        contents: [
          {
            parts: [
              {
                text: userPrompt + params + dex,
              },
            ],
          },
        ]
      };
  
      // Encode request body as base64 (required by CRE HTTP capability)
      const bodyBytes = new TextEncoder().encode(JSON.stringify(dataToSend));
      const body = Buffer.from(bodyBytes).toString("base64");
  
      const Req = {
        url: `https://generativelanguage.googleapis.com/v1beta/models/${config.geminiModel}:generateContent`,
        method: "POST" as const,
        body,
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": geminiApiKey,
        }
      };
  
      // Perform the request within CRE infra; result() yields the response
      const resp = sendRequester.sendRequest(Req).result();
      const bodyText = new TextDecoder().decode(resp.body);
  
      if (!ok(resp)) throw new Error(`HTTP request failed with status: ${resp.statusCode}. Error :${bodyText}`);
  
      // Parse and extract the model text
      const externalResp = JSON.parse(bodyText) as GeminiApiResponse;
  
      const text = externalResp?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error("Malformed LLM response: missing candidates[0].content.parts[0].text");
  
      return {
        statusCode: resp.statusCode,
        geminiResponse: text,
        responseId: externalResp.responseId,
        rawJsonString: bodyText,
      };
    };