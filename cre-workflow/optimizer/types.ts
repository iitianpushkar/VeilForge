import {z} from "zod";

const evmConfigSchema = z.object({
  chainSelectorName: z.string().min(1),
  executorAddress: z.string(),
  gasLimit:z.string()
});

export const configSchema = z.object({
    authorizedEVMAddress: z.string(),
    url:z.string(),
    Model:z.string(),
    evms: z.array(evmConfigSchema).min(1, "At least one EVM config is required"),
  });
  
  /** Type inferred from the validated config schema. */
  export type Config = z.infer<typeof configSchema>;
  
  export type req = {
    network:string,
    fromToken: {
      symbol:string,
      address:string,
      decimals:string
    },
    toToken: {
      symbol:string,
      address:string,
      decimals:string
    },
    amountIn: string,
    minAmountOut:string,
    recipient:string,
    idProof:string,
    withdrawProof:string
  } 

  export type llmResponse = {
    Response: string;
  };

 export type OpenrouterReq = {
  messages:Message[];
  model?: string;
  response_format?: OpenrouterRes;
  plugins?: Plugin[];
};

type Message =
  | {
      role: 'user' | 'system';
      content: string;
      name?: string;
    }
  | {
      role: 'tool';
      content: string;
      tool_call_id: string;
      name?: string;
    };

 export type OpenrouterRes = { type: 'json_object' }

 type Plugin = {
  id: string; // 'web', 'file-parser', 'response-healing'
  enabled?: boolean;
  // Additional plugin-specific options
  [key: string]: unknown;
};
