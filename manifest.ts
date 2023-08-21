import { Manifest } from 'https://deno.land/x/robo_arkiver@v0.4.21/mod.ts'
import { VaultSnapshot } from './entities/vault.ts'
import { snapshotVault } from './handlers/vault.ts'

const manifest = new Manifest('arrakis-vaults')

manifest
  .addEntity(VaultSnapshot)
  .addChain('mainnet', (chain) =>
    chain
      .addBlockHandler({
        blockInterval: 1000,
        startBlockHeight: 17661035n,
        handler: snapshotVault,
      }))

export default manifest
  .build()
