import {z} from "zod";

const evmConfigSchema = z.object({
  chainSelectorName: z.string().min(1),
  executorAddress: z.string(),
  gasLimit:z.string()
});

export const configSchema = z.object({
    authorizedEVMAddress: z.string(),
    evms: z.array(evmConfigSchema).min(1, "At least one EVM config is required"),
  });
  
  /** Type inferred from the validated config schema. */
  export type Config = z.infer<typeof configSchema>;
  
  export type userDataSchema = {
    proof:any,
    commitment:string
  } 
