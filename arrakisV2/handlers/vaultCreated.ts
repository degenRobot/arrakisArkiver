import { ARRAKIS_FACTORY_ABI } from '../abis/factory.ts'
import { EventHandlerFor } from '../deps.ts'
import { createVault } from '../util/vaults.ts'

/**
 * Create a vault entity in the db each time a vault is created
 * @param ctx event context
 */
export const onVaultCreated : EventHandlerFor<typeof ARRAKIS_FACTORY_ABI, "VaultCreated"> = async (ctx) => {
	ctx.logger.debug(`Vault Created: ${ctx.event.args.vault}`)
  const { vault } = ctx.event.args
	await createVault(ctx.client, vault)
}

