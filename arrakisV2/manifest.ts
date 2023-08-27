import { Manifest } from './deps.ts'
import { VAULT_ABI } from './abis/vault.ts'
import { ARRAKIS_FACTORY_ABI } from './abis/factory.ts'
import { Vault } from './entities/vault.ts'
import { RangeSnapshot } from './entities/ranges.ts'
import { FeeSnapshot, FeeSnapshotHistorical } from "./entities/fees.ts";
import { Token } from './entities/token.ts'
import { VaultSnapshot } from './entities/vaultsnapshot.ts'
import { FeeHandler } from './handlers/collectedFees.ts'
import { snapshotVault } from './handlers/vaultSnapshots.ts'
import { onVaultCreated } from './handlers/vaultCreated.ts'


const manifest = new Manifest('arrakis-vaults')

manifest
  .addEntities([Vault, Token, VaultSnapshot, RangeSnapshot, FeeSnapshot, FeeSnapshotHistorical])
  .addChain('mainnet', (chain) =>
    chain
			.setOptions(
				{
					blockRange : 100n,
					rpcUrl : 'https://nd-266-887-751.p2pify.com/eff2e208e3d6b166bc048d9b531350be'
				}
			)
			.addBlockHandler({
				blockInterval: 100,
				startBlockHeight: 16593701n,
				handler: snapshotVault,
			})
			.addContract({
					abi: ARRAKIS_FACTORY_ABI,
					name: "factory",
					sources : {
						"0xECb8Ffcb2369EF188A082a662F496126f66c8288" : 16543496n
					},
					eventHandlers : {
						VaultCreated : onVaultCreated
					}
				}
			)
			.addContract({
				abi : VAULT_ABI,
				name : "ArrakisV2Vault",
				factorySources :{
					factory : {
						VaultCreated : 'vault'
					}
				},
				eventHandlers : { LogCollectedFees : FeeHandler }
			})
	)

export default manifest
  .build()
