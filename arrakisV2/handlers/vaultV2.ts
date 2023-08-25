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
import { RangeSnapshot } from "../entities/ranges.ts";



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

      /*
      token0decimals: await client.readContract({
        address : `${vault.address}:token0`,
        abi : Erc20Abi,
        functionName: 'decimals' 
      }
      )

      token1decimals: await client.readContract({
        address : `${vault.address}:token1`,
        abi : Erc20Abi,
        functionName: 'decimals' 
      }
      )
      */
      init0: await store.retrieve(
        `${vault.address}:token1`,
        async () => await contract.read.init0(),
      ),      

      init1: await store.retrieve(
        `${vault.address}:token1`,
        async () => await contract.read.init1(),
      ),

      owner: await store.retrieve(
        `${vault.address}:token1`,
        async () => await contract.read.owner(),
      ),

      manager: await store.retrieve(
        `${vault.address}:token1`,
        async () => await contract.read.manager(),
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

  
  // TO DO Store Pool Address together with ranges 
  const pools = await Promise.all(vaults.map(async (e) => {
    return {range: await client.readContract({
      address: e.address,
      abi: VaultABI,
      functionName: 'getPools',
      blockNumber: block.number,
    }), vault: e}
  }))
  


  const ranges = await Promise.all(vaults.map(async (e) => {
    return {range: await client.readContract({
      address: e.address,
      abi: VaultABI,
      functionName: 'getRanges',
      blockNumber: block.number,
    }), vault: e}
  }))
  
  
  for (let i = 0; i < ranges.length; i++) {
    try {
    const {range, vault} = ranges[i]

    const rangeResults = await client.readContract({
            address: HELPER_ADDRESS,
            abi: ArrakisHelper,
            functionName: 'token0AndToken1ByRange',
            args : [range, vault.token0, vault.token1, vault.address],
            blockNumber: block.number,
          })
      

      const RangeEntities = []

      // for (const res of rangeResults) {
        const [ token0Ranges, token1Ranges ] = rangeResults
        const amount1s = []
        const amount0s = []
        const rangeOuts = []

        for (const tokenRes of token0Ranges) {
        const { amount, range } = tokenRes 
        amount0s.push(amount)
        rangeOuts.push(range)
        } 
        for (const tokenRes of token1Ranges) {
          const { amount } = tokenRes 
          amount1s.push(amount)

        } 

        for (let j =0; j < amount0s.length; j++) {
          RangeEntities.push(new RangeSnapshot({
            block: Number(block.number),
            timestamp: Number(block.timestamp),
            vault: vault.address,
            name: vault.name,
            symbol: vault.symbol,
            token0 : vault.token0,
            token1 : vault.token1,
            lowerTick : rangeOuts[j].lowerTick,
            upperTick : rangeOuts[j].upperTick,
            // TO DO Format Units by correct decimals Token0decimals / Token1decimals
            underlyingBalance0 : formatUnits(amount0s[j],18),
            underlyingBalance1 : formatUnits(amount1s[j],18),
            rangeNumber : j
          }))
        }

        await RangeSnapshot.insertMany(RangeEntities)


      // }
    } catch{
      console.log('ERROR IN RANGE !!!!!!!')
    }
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
      owner : vault.owner,
      manager : vault.manager,
      init0 : vault.init0,
      init1 : vault.init1,
      token0 : vault.token0, // TO DO -> make this symbol not address 
      token1 : vault.token1, 
      totalSupply : totalSupplyVault,
      // TO DO Format Units by correct decimals Token0decimals / Token1decimals
      underlyingBalance0 : formatUnits(totalUnderlying[i].amount0, 18),
      underlyingBalance1 :  formatUnits(totalUnderlying[i].amount1, 18),
      fees0 : formatUnits(totalUnderlying[i].fee0,18),
      fees1 : formatUnits(totalUnderlying[i].fee1,18),
    })
  }).map((e) => e.save())
}
