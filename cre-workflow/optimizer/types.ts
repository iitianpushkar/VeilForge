import {z} from "zod";

const evmConfigSchema = z.object({
  chainSelectorName: z.string().min(1)
});

export const configSchema = z.object({
    authorizedEVMAddress: z.string(),
    url:z.string(),
    geminiModel:z.string(),
    evms: z.array(evmConfigSchema).min(1, "At least one EVM config is required"),
  });
  
  /** Type inferred from the validated config schema. */
  export type Config = z.infer<typeof configSchema>;
  
  export type req = {
    network:string,
    fromToken: string,
    toToken: string,
    amountIn: string,
    minAmountOut:string,
    recipient:string
  } 

  export type GeminiResponse = {
    statusCode: number;
    geminiResponse: string; // Parsed JSON string from Gemini
    responseId: string; // Unique identifier for this request
    rawJsonString: string; // Full raw response body
  };
  
  /**
   * Request payload structure for Gemini API.
   * Includes system instructions, tools (search grounding), and user content.
   */
  export interface GeminiData {
    system_instruction: {
      parts: { text: string }[];
    };
    tools: any[];
    contents: {
      parts: { text: string }[];
    }[];
  }
  
  /**
   * Response structure from Gemini API.
   * Contains the generated content and a unique response ID.
   */
  export interface GeminiApiResponse {
    candidates: {
      content: {
        parts: { text: string }[];
      };
    }[];
    responseId: string;
  }