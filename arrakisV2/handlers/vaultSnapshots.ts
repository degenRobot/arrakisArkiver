import { Address, formatUnits } from 'npm:viem'
import { type BlockHandler } from 'https://deno.land/x/robo_arkiver@v0.4.21/mod.ts'
import { ARRAKIS_HELPER_ABI } from '../abis/helper.ts'
import { VAULT_ABI } from '../abis/vault.ts'
import { getVaults } from '../util/vaults.ts'
import { HELPER_ADDRESS } from '../config.ts'
import { VaultSnapshot } from '../entities/vaultsnapshot.ts'

export const snapshotVault: BlockHandler = async ({
  block,
  client,
  logger,
}): Promise<void> => {
  const vaults = await getVaults()
	logger.debug(`Taking Vault Snapshot for ${vaults.length} vaults`)

	const snapshots = await Promise.all(vaults.map(async (vault) => {
		const helperContract = { address: HELPER_ADDRESS, abi: ARRAKIS_HELPER_ABI }
		const vaultContract = { address: vault.address as Address, abi: VAULT_ABI }
		const [
			totalUnderlying,
			totalSupply,
			// pools, // TODO: Do we need pools?
			ranges,
		] = await client.multicall({
			contracts: [
				{ ...helperContract, functionName: 'totalUnderlyingWithFeesAndLeftOver', args: [vault.address as Address] },
				{ ...vaultContract, functionName: 'totalSupply' },
				// { ...vaultContract, functionName: 'getPools' },
				{ ...vaultContract, functionName: 'getRanges' },
			],
			blockNumber: block.number,
		})
		console.log('range')
		console.log(ranges.result![0])
		const token0 = vault.token0.address
		const token1 = vault.token1.address
		console.log(token0, token1, vault.address)


		const rangeInfo = await client.readContract({
			address: HELPER_ADDRESS,
			abi: ARRAKIS_HELPER_ABI,
			functionName: 'token0AndToken1ByRange',
			args: [
				ranges.result!, 
				token0, 
				token1, 
				vault.address as Address
			],
		})
		const decimals = [vault.token0.decimals, vault.token1.decimals]
		const [token0Ranges, token1Ranges] = rangeInfo.map((e, i) => {
			return e.map((e) => ({ ...e, amount: Number(formatUnits(e.amount, decimals[i])) }))
		})  

		return new VaultSnapshot({
			vault,
			totalSupply: parseFloat(formatUnits(totalSupply.result!, 18)),
			underlyingBalance0 : parseFloat(formatUnits(totalUnderlying.result!.amount0, 18)),
			underlyingBalance1 :  parseFloat(formatUnits(totalUnderlying.result!.amount1, 18)),
			fees0 : parseFloat(formatUnits(totalUnderlying.result!.fee0, 18)),
			fees1 : parseFloat(formatUnits(totalUnderlying.result!.fee1, 18)),
			token0Ranges,
			token1Ranges,
			block: Number(block.number),
			timestamp: Number(block.timestamp),
		})
	}))

	await VaultSnapshot.insertMany(snapshots)
}
