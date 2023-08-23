import { Manifest } from 'https://deno.land/x/robo_arkiver@v0.4.21/mod.ts'
import { VaultSnapshot } from './entities/vault.ts'
import { onVaultCreated, snapshotVault } from './handlers/vaultV2.ts'
//import { VaultABI } from '../abis/vaultV2.ts'
import { ArrakisFactoryABI } from './abis/factory.ts'


const manifest = new Manifest('arrakis-vaults')

manifest
  .addEntity(VaultSnapshot)
  .addChain('mainnet', (chain) =>
    chain
    .setOptions(
      {
        blockRange : 100n,
        rpcUrl : 'https://rpc.ankr.com/eth'
      }
    )
      .addContract({
          abi: ArrakisFactoryABI,
          name: "factory",
          sources : {
            "0xECb8Ffcb2369EF188A082a662F496126f66c8288" : 16534507n
          },
        eventHandlers : {
          VaultCreated : onVaultCreated

        }
        }
      )
      /*
      .addContract({
        abi : VaultABI,
        name : "ArrakisV2Vault",
        factorySources :{
          factory : {
            VaultCreated : 'vault'
          }
        }
      })
      */
      .addBlockHandler({
        blockInterval: 1000,
        startBlockHeight: 16593701n,
        handler: snapshotVault,
      }))

export default manifest
  .build()
