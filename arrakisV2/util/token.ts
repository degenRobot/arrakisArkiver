import { ERC20_ABI } from "../abis/erc20.ts"
import { PublicClient, Address } from "../deps.ts"
import { Token } from "../entities/token.ts"

export const getToken = async (client: PublicClient, address: Address) => {
	// check if it's already in the db
	const record = await Token.findOne({ address })
	if (record)
		return record

	// get the pair data.. todo, add symbol
	const abi = ERC20_ABI
	const [ decimals, symbol ] = await client.multicall({
		contracts: [
			{ address, abi, functionName: 'decimals' },
			{ address, abi, functionName: 'symbol' }
		]
	})

	const token = {
		address: address,
		chain: client.chain?.name as string,
		decimals: Number(decimals.result!),
		symbol: symbol.result!,
	}
	
	const doc = new Token(token)
	await doc.save()
	return doc
}