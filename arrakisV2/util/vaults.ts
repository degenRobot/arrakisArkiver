import { VAULT_ABI } from "../abis/vault.ts"
import { PublicClient, Address, toHex } from "../deps.ts"
import { Vault } from "../entities/vault.ts"
import { getToken } from "./token.ts"

export const createVault = async (client: PublicClient, address: Address) => {
	const abi = VAULT_ABI
	const [
		name, 
		symbol, 
		decimals,
		token0,
		token1,
		init0,
		init1,
		owner,
		manager
	] = await client.multicall({
		contracts: [
			{ address, abi, functionName: 'name' },
			{ address, abi, functionName: 'symbol' },
			{ address, abi, functionName: 'decimals' },
			{ address, abi, functionName: 'token0' },
			{ address, abi, functionName: 'token1' },
			{ address, abi, functionName: 'init0' },
			{ address, abi, functionName: 'init1' },
			{ address, abi, functionName: 'owner' },
			{ address, abi, functionName: 'manager' },
		]
	})

	await Vault.create({
		address: address,
		name: name.result!,
		symbol: symbol.result!,	
		decimals: Number(decimals.result!),
		token0: await getToken(client, token0.result!),
		token1: await getToken(client, token1.result!),
		init0: toHex(init0.result!),
		init1: toHex(init1.result!),
		owner: owner.result!,
		manager: manager.result!,		
	})
}

export const getVaults = async () => {
	return await Vault.find({}).populate('token0 token1') 
}

export const getVault = async (address: Address) => {
	return (await Vault.findOne({ address }).populate('token0 token1'))!
}