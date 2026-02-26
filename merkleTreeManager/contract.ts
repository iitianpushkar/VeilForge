import {WebSocketProvider, Wallet, Contract} from "ethers";
import dotenv from "dotenv";
import {pool_abi} from "./balanceTree/abi.ts";
import { idmixer_abi } from "./identityTree/abi.ts";

dotenv.config();

// Connect to mantle blockchain
const provider = new WebSocketProvider(process.env.arc_rpc_url || "");
export const wallet = new Wallet(process.env.private_key!, provider);

export const pool = new Contract(process.env.pool!, pool_abi , wallet);
export const idmixer = new Contract(process.env.idmixer!, idmixer_abi, wallet);
