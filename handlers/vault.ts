import { formatUnits, getContract } from 'npm:viem'
import { type BlockHandler } from 'https://deno.land/x/robo_arkiver@v0.4.21/mod.ts'
import { VaultSnapshot } from '../entities/vault.ts'
import { ArrakisVault } from '../abis/arrakisVault.ts'
import { UniV3Pool } from "../abis/uniV3pool.ts";
import { Erc20Abi } from "../abis/erc20.ts";


const VAULTS = [
  { address: '0xAbDDAfB225e10B90D798bB8A886238Fb835e2053', block: 17661035 }, // DAI/USDC G-UNI
] as const

export const snapshotVault: BlockHandler = async ({
  block,
  client,
  store,
  logger,
}): Promise<void> => {
  // Filter out vaults that haven't been deployed yet
  const liveVaults = VAULTS.filter((e) => e.block < Number(block.number))

  // Get vault info from cache or onchain
  const vaults = await Promise.all(liveVaults.map(async (vault) => {
    const contract = getContract({
      address: vault.address,
      abi: ArrakisVault,
      publicClient: client,
    })
    return {
      address: vault.address,
      vault: { address: vault.address, abi: ArrakisVault } as const,
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

      pool: await store.retrieve(
        `${vault.address}:pool`,
        async () => await contract.read.pool(),
      ),      

      // TO DO fetch relevant data for token0 & token1 i.e. symbol & decimals 
    }
    

  }))

  // fetch public Variables for this block


  const [underlyingBalances, ]  = await Promise.all(vaults.map((e) => {
    return client.readContract({
      address: e.address,
      abi: ArrakisVault,
      functionName: 'getUnderlyingBalances',
      blockNumber: block.number,
    })
  }))

  console.log(underlyingBalances)
  // TO DO -> split this array into underlyingBalance0 & undelryingBalance1 -> then adjust based on totalSupply to get share Price (i.e. underlyingBalance0 / totalSupply)

  const [poolInfo] = await Promise.all(vaults.map((e) => {
    return client.readContract({
      address: e.pool,
      abi: UniV3Pool,
      functionName: 'slot0',
      blockNumber: block.number,
    })
  }))

  console.log("Pool Info ")
  console.log(poolInfo)
  // TO DO -> split this into sqrtPriceX96 & conver to actual price + track current tick on pair 

  const lowerTick = await Promise.all(vaults.map((e) => {
    return client.readContract({
      address: e.address,
      abi: ArrakisVault,
      functionName: 'lowerTick',
      blockNumber: block.number,
    })
  }))




  const upperTick = await Promise.all(vaults.map((e) => {
    return client.readContract({
      address: e.address,
      abi: ArrakisVault,
      functionName: 'upperTick',
      blockNumber: block.number,
    })
  }))

  const totalSupply = await Promise.all(vaults.map((e) => {
    return client.readContract({
      address: e.address,
      abi: ArrakisVault,
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
      lowerTick : lowerTick[i],
      upperTick : upperTick[i],
      //underlyingBalance0 : underlyingBalances[0],
      //underlyingBalance1 : underlyingBalances[1],
    })
  }).map((e) => e.save())
}
