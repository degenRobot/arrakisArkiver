import { createEntity } from '../deps.ts'
import { Types } from 'npm:mongoose'

type Range = {
	range: { 
		lowerTick: number, 
		upperTick: number, 
		feeTier: number 
	},
	amount: number
}

const RangeSchema = { 
	range: { lowerTick: Number, upperTick: Number, feeTier: Number },
	amount: Number
}

export interface IVaultSnapshot {
  vault: any
  totalSupply : number
  underlyingBalance0 : number
  underlyingBalance1 : number 
  fees0 : number 
  fees1 : number 
  block: number
  timestamp: number
	token0Ranges: Range,
	token1Ranges: Range,
}

export const VaultSnapshot = createEntity<IVaultSnapshot>('VaultSnapshot', {
	vault: { type: Types.ObjectId, ref: 'Vault'},
  underlyingBalance0: { type: Number, index: true },
  underlyingBalance1: { type: Number, index: true },
  fees0: { type: Number, index: true },
  fees1: { type: Number, index: true },
  totalSupply : { type: Number, index: true },
  block: { type: Number, index: true },
  timestamp: { type: Number, index: true },
	token0Ranges: [RangeSchema],
	token1Ranges: [RangeSchema],
})
