import {WebSocketProvider, Wallet, Contract} from "ethers";
import dotenv from "dotenv";
import {pool_abi} from "./Pool/abi.ts";
import { idmixer_abi } from "./Id/abi.ts";

dotenv.config();

const provider = new WebSocketProvider(process.env.base_rpc_url || "");
export const wallet = new Wallet(process.env.private_key!, provider);

export const pool = new Contract(process.env.pool!, pool_abi , wallet);
export const idmixer = new Contract(process.env.idmixer!, idmixer_abi, wallet);
