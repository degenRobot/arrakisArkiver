import { formatUnits, getContract } from 'npm:viem'
import { VaultAddress, VaultSnapshot } from '../entities/vault.ts'
import { FeeSnapshot, FeeSnapshotHistorical } from '../entities/fees.ts'
import { ArrakisFactoryABI } from '../abis/factory.ts'
import { ArrakisHelper } from '../abis/helper.ts'
import { VaultABI } from '../abis/vault.ts'
import { UniV3Pool } from "../abis/uniV3pool.ts"
import { Erc20Abi } from "../abis/erc20.ts";
import { length } from 'https://deno.land/x/valibot@v0.8.0/mod.ts'
import { EventHandler } from 'https://deno.land/x/robo_arkiver@v0.4.21/src/arkiver/types.ts'
import { EventHandlerFor } from '../deps.ts'
import { findBreakingChanges } from 'npm:graphql'
import { RangeSnapshot } from "../entities/ranges.ts";

export const FeeHandler : EventHandlerFor<typeof VaultABI, "LogCollectedFees"> = async (
    {event, client, store,contract
    }, 
) => {
	const block = await store.retrieve(`getBlock:${event.blockNumber}`, async () => await client.getBlock({ blockNumber: event.blockNumber }))
    const {fee0, fee1} = event.args; 
    console.log("Fee Collected" + fee0.toString()  + " - " + fee1.toString())

    // await FeeSnapshot.updateOne({
    //     _id: contract.address
    // }, { $inc: { amount0: Number(formatUnits(fee0,18)) , amount1: Number(formatUnits(fee1,18))}}, { upsert: true })
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

    totalFees.amount0 += Number(formatUnits(fee0,18))
    totalFees.amount1 += Number(formatUnits(fee1,18))
    totalFees.save()
    const rec = new FeeSnapshotHistorical({
        vault: contract.address,
        amount0 : Number(formatUnits(fee0,18)),
        amount1 : Number(formatUnits(fee1,18)),
        total0 : totalFees.amount0,
        total1 : totalFees.amount1,
        //block: Number(block.number),
        timestamp: Number(block.timestamp),      
    })

    await rec.save()


}