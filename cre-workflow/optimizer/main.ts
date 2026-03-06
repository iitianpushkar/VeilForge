import { HTTPCapability, handler, type Runtime, type HTTPPayload, Runner, HTTPSendRequester, ok, cre, consensusIdenticalAggregation, decodeJson} from "@chainlink/cre-sdk"
import {Config, req} from "./types"
import {askLLM} from "./llm"
import { route, parseLLmResponse } from "./route"

const onHttpTrigger = (runtime: Runtime<Config>, payload: HTTPPayload): any => {
  runtime.log(`HTTP trigger received`)

  const reqData = decodeJson(payload.input) as req
  const secret = runtime.getSecret({ id: "CG_API_KEY" }).result().value

  const httpClient = new cre.capabilities.HTTPClient()

  // 1️⃣ Fetch pool details (already consensus-safe)
  const response = httpClient
    .sendRequest(
      runtime,
      discoverPools(runtime, secret, reqData),
      consensusIdenticalAggregation()
    )(runtime.config)
    .result()

  const poolDetails = response?.data ?? []

  runtime.log(`Winning dex: ${poolDetails[0].dex}`)

  const result = askLLM(runtime, reqData, poolDetails[0].dex);

  const parsedResponse = parseLLmResponse(runtime,result);
  
  const encodedRoute = route(runtime,parsedResponse.routerAddress,parsedResponse.Interface,parsedResponse.parameters);

  return {
	encodedRoute:encodedRoute,
	winningDex: poolDetails[0].dex
  };
}


const discoverPools = (runtime: Runtime<Config>,secret:string, payload: req)=>(sendRequester: HTTPSendRequester, config:Config) : any => {

  const url = `${config.url}/networks/${payload.network}/tokens/${payload.fromToken.address}/pools`

  const discovered = sendRequester.sendRequest({
    url: url,
	method: 'GET' as const, 
	headers : {
		'x-cg-demo-api-key':secret
	}
  }).result()

  const discoveredText = new TextDecoder().decode(discovered.body);

  if (!ok(discovered)) throw new Error(`HTTP request failed with status: ${discovered.statusCode}. Error :${discoveredText}`);

  const poolsData = JSON.parse(discoveredText)

  const pools = Array.isArray(poolsData?.data) ? poolsData.data : [];

  const toLc = String(payload.toToken.address).toLowerCase();

  const matchedPools = pools.filter((pool:any) => {
    const baseTokenId = pool?.relationships?.base_token?.data?.id || '';
    const quoteTokenId = pool?.relationships?.quote_token?.data?.id || '';
    const baseAddr = baseTokenId.split('_')[1] || '';
    const quoteAddr = quoteTokenId.split('_')[1] || '';

      return baseAddr.toLowerCase() === toLc || quoteAddr.toLowerCase() === toLc;
    });

	runtime.log(`Matched ${matchedPools.length} pools for pair ${payload.fromToken.address}/${payload.toToken.address}`);

	const poolAddresses = matchedPools
      .map((pool:any) => pool?.attributes?.address)
      .filter(Boolean); // Remove any undefined addresses

	  const chunkSize = 50;
	  let results = [];
	 
	  for (let i = 0; i < poolAddresses.length; i += chunkSize) {
		const chunk = poolAddresses.slice(i, i + chunkSize);
		// Format addresses as comma-separated string for multi endpoint
		const addressesParam = chunk.join(',');

		const url = `${config.url}/networks/${payload.network}/pools/multi/${addressesParam}`
		const detail = sendRequester.sendRequest({
			url: url,
			method: 'GET' as const, 
			headers : {
				'x-cg-demo-api-key':secret
			}
		  }).result()

		  const detailText = new TextDecoder().decode(detail.body);

		  if (!ok(detail)) throw new Error(`HTTP request failed with status: ${detail.statusCode}. Error :${detailText}`);
		
		  const details = JSON.parse(detailText)

		if (Array.isArray(details?.data)) results.push(...details.data);
	  }

	runtime.log(`result ${results.length} pools for pair ${payload.fromToken}/${payload.toToken}`);

	const sorted = calculateBestQuotes(results,{
		amountIn:payload.amountIn,
		fromToken:payload.fromToken.address,
		toToken:payload.toToken.address
	})

	runtime.log(`sorted ${sorted.length} pools for pair ${payload.fromToken}/${payload.toToken}`);
	  
	  return {
		data: sorted
	  }	  
}

function calculateBestQuotes(
	poolDetails: any[],
	params: { amountIn: string; fromToken: string; toToken: string }
  ) {
	const { amountIn, fromToken, toToken } = params
	const results: any[] = []
  
	const fromLc = fromToken.toLowerCase()
	const toLc = toToken.toLowerCase()
  
	for (const pool of poolDetails) {
	  const attr = pool.attributes || {}
	  const rel = pool.relationships || {}
  
	  const baseId = rel.base_token?.data?.id || ''
	  const quoteId = rel.quote_token?.data?.id || ''
	  const baseAddr = baseId.split('_')[1]?.toLowerCase() || ''
	  const quoteAddr = quoteId.split('_')[1]?.toLowerCase() || ''
  
	  let priceFactor: number | null = null
  
	  if (baseAddr === fromLc && quoteAddr === toLc) {
		priceFactor = Number(attr.base_token_price_quote_token)
	  } else if (baseAddr === toLc && quoteAddr === fromLc) {
		priceFactor = Number(attr.quote_token_price_base_token)
	  }
  
	  if (priceFactor === null || !Number.isFinite(priceFactor) || priceFactor <= 0) continue
  
	  const feePercent = Number(attr.pool_fee_percentage) || 0
	  const estimatedOutput =Number(amountIn) * priceFactor * (1 - feePercent / 100)
  
	  const poolAddress = attr.address

	  if (!isValidEvmAddress(poolAddress)) {
		continue // ❌ reject non-EVM pool identifiers
	  }
	  
	  results.push({
		poolAddress,
		dex: rel.dex?.data?.id ?? 'unknown',
		estimatedOutput,
		pricePerToken: priceFactor,
		feePercent,
		liquidityUsd: Number(attr.reserve_in_usd) || 0,
	  })
	  
	}
  
	return results.sort((a, b) => b.estimatedOutput - a.estimatedOutput)
  }

  const isValidEvmAddress = (addr: string | null | undefined): boolean => {
	if (!addr) return false
	return /^0x[a-fA-F0-9]{40}$/.test(addr)
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
