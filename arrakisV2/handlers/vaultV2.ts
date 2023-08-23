import { formatUnits, getContract } from 'npm:viem'
import { type BlockHandler } from 'https://deno.land/x/robo_arkiver@v0.4.21/mod.ts'
import { VaultAddress, VaultSnapshot } from '../entities/vault.ts'
import { ArrakisFactoryABI } from '../abis/factory.ts'
import { ArrakisHelper } from '../abis/helper.ts'
import { VaultABI } from '../abis/vault.ts'
import { UniV3Pool } from "../abis/uniV3pool.ts"
import { Erc20Abi } from "../abis/erc20.ts";
import { length } from 'https://deno.land/x/valibot@v0.8.0/mod.ts'
import { EventHandler } from 'https://deno.land/x/robo_arkiver@v0.4.21/src/arkiver/types.ts'
import { EventHandlerFor } from '../deps.ts'
import { findBreakingChanges } from 'npm:graphql'



export const onVaultCreated : EventHandlerFor<typeof ArrakisFactoryABI, "VaultCreated"> = async (ctx) => {
  const { vault } = ctx.event.args
  const newVault = new VaultAddress({
    address : vault
  })
  await newVault.save()
}

const HELPER_ADDRESS = '0x07d2CeB4869DFE17e8D48c92A71eDC3AE564449f' as const

export const snapshotVault: BlockHandler = async ({
  block,
  client,
  store,
  logger,
}): Promise<void> => {
  // Filter out vaults that haven't been deployed yet
  ///const liveVaults = VAULTS.filter((e) => e.block < Number(block.number))
  const liveVaults = await VaultAddress.find() 
  // Get vault info from cache or onchain
  const vaults = await Promise.all(liveVaults.map(async (vault) => {
    const contract = getContract({
      address: vault.address,
      abi: VaultABI,
      publicClient: client,
      
    })
    return {
      address: vault.address,
      vault: { address: vault.address, abi: VaultABI } as const,
      contract,
      name: await store.retrieve(
        `${vault.address}:name`,
        async () => await contract.read.name(),
      ),
      symbol: await store.retrieve(
        `${vault.address}:symbol`,
        async () => await contract.read.symbol(),
      ),
      decimals: await store.retrieve(
        `${vault.address}:decimals`,
        async () => await contract.read.decimals(),
      ),
      token0: await store.retrieve(
        `${vault.address}:token0`,
        async () => await contract.read.token0(),
      ),
      token1: await store.retrieve(
        `${vault.address}:token1`,
        async () => await contract.read.token1(),
      ),

      pools: await store.retrieve(
        `${vault.address}:pool`,
        async () => await contract.read.getPools(),
      ),      

      // TO DO fetch relevant data for token0 & token1 i.e. symbol & decimals 
    }
    

  }))

  // fetch public Variables for this block
  const totalUnderlying = await Promise.all(vaults.map((e) => {
    return client.readContract({
      address: HELPER_ADDRESS,
      abi: ArrakisHelper,
      functionName: 'totalUnderlyingWithFeesAndLeftOver',
      args : [e.address],
      blockNumber: block.number,
    })
  }))

  // TO DO Convert to correct data to pass into entity 


  const ranges = await Promise.all(vaults.map((e) => {
    return client.readContract({
      address: e.address,
      abi: VaultABI,
      functionName: 'getRanges',
      blockNumber: block.number,
    })
  }))
  console.log(ranges)
  
  
  for (let i = 0; i < ranges.length; i++) {
    // Loop through & get Range Info 
    
    const rangeResults = await Promise.all(vaults.map((e) => {
      console.log(e.address) 
      return client.readContract({
          address: HELPER_ADDRESS,
          abi: ArrakisHelper,
          functionName: 'token0AndToken1ByRange',
          args : [ranges[i], e.token0, e.token1, e.address],
          blockNumber: block.number,
        })
        
      }))
      console.log(rangeResults)
      // need to pull out Amount outputs from amount0s & amount1s 
  }
  
  

  const totalSupply = await Promise.all(vaults.map((e) => {
    return client.readContract({
      address: e.address,
      abi: VaultABI,
      functionName: 'totalSupply',
      blockNumber: block.number,
    })
  }))

  // Save the vault snapshots
  vaults.map((vault, i) => {
    /*
    const sharePrice = parseFloat(
      formatUnits(sharePrices[i], Number(vault.decimals)),
    )
    */

    const totalSupplyVault = parseFloat(
      formatUnits(totalSupply[i], Number(vault.decimals)),
    )    

    logger.info(`${vault.name} updated`)
    return new VaultSnapshot({
      // id: `${vault.address}-${Number(block.number)}`,
      block: Number(block.number),
      timestamp: Number(block.timestamp),
      vault: vault.address,
      name: vault.name,
      symbol: vault.symbol,
      token0 : vault.token0, // TO DO -> make this symbol not address 
      token1 : vault.token1, 
      totalSupply : totalSupplyVault,
      //underlyingBalance0 : underlyingBalances[0],
      //underlyingBalance1 : underlyingBalances[1],
    })
  }).map((e) => e.save())
}
