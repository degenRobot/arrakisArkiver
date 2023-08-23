import { createEntity } from '../deps.ts'

export interface IVaultAddress {
  address : string
}

export const VaultAddress = createEntity<IVaultAddress>('VaultAddress',{
  address : String,
})

export interface IVaultSnapshot {
  vault: string
  name: string
  symbol: string
  token0: string
  token1: string 
  init0 : number 
  init1 : number
  owner : string
  manager : string
  totalSupply : number
  underlyingBalance0 : number
  underlyingBalance1 : number 
  fees0 : number 
  fees1 : number 
  block: number
  timestamp: number
}

export const VaultSnapshot = createEntity<IVaultSnapshot>('VaultSnapshot', {
  vault: String,
  name: String,
  symbol: String,
  token0: String,
  token1: String, 
  init0 : Number,
  init1 : Number,
  owner : String,
  manager : String,
  underlyingBalance0: { type: Number, index: true },
  underlyingBalance1: { type: Number, index: true },
  fees0: { type: Number, index: true },
  fees1: { type: Number, index: true },
  totalSupply : { type: Number, index: true },
  block: { type: Number, index: true },
  timestamp: { type: Number, index: true },
})
