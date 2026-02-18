import { Token } from "./tokens";

export type Chain = {
    eid: string;
    name: string;
  };

export type ChainWithTokens = {
  eid: string;
  name: string;
  tokens: Token[];
};
  