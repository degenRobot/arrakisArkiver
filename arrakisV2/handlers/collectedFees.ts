import { formatUnits} from 'npm:viem'
import { FeeSnapshot, FeeSnapshotHistorical } from '../entities/fees.ts'
import { VAULT_ABI } from '../abis/vault.ts'
import { EventHandlerFor } from '../deps.ts'
import { getVault } from '../util/vaults.ts'

export const FeeHandler : EventHandlerFor<typeof VAULT_ABI, "LogCollectedFees"> = async (
    {
			event, 
			client, 
			store,
			contract,
			logger,
    }, 
) => {
	const vault = await getVault(event.address)
	const block = await store.retrieve(`getBlock: ${event.blockNumber}`, async () => await client.getBlock({ blockNumber: event.blockNumber }))
	const {fee0, fee1} = event.args; 

	logger.debug(`Fee Collected: ${fee0.toString()} - ${fee1.toString()}`)

	let totalFees = await FeeSnapshot.findOne({
			_id: contract.address
	})

	if (!totalFees) {
		totalFees = new FeeSnapshot({
				_id : contract.address,
				amount0 : 0,
				amount1 : 0,
		})
	}

	totalFees.amount0 += Number(formatUnits(fee0, vault.token0.decimals))
	totalFees.amount1 += Number(formatUnits(fee1, vault.token0.decimals))
	totalFees.save()
	await FeeSnapshotHistorical.create({
		vault: contract.address,
		amount0 : Number(formatUnits(fee0, vault.token0.decimals)),
		amount1 : Number(formatUnits(fee1, vault.token1.decimals)),
		total0 : totalFees.amount0,
		total1 : totalFees.amount1,
		block: Number(block.number),
		timestamp: Number(block.timestamp),      
	})
}