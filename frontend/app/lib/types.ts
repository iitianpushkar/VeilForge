  export type swapPayload = {
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
    recipient:string
  } 
