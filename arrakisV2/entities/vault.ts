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
  totalSupply : number
  underlyingBalance0 : number
  underlyingBalance1 : number 
  price : number 
  currentTick : number 
  lowerTick : number
  upperTick : number 
  block: number
  timestamp: number
}

export const VaultSnapshot = createEntity<IVaultSnapshot>('VaultSnapshot', {
  vault: String,
  name: String,
  symbol: String,
  token0: String,
  token1: String, 
  underlyingBalance0: { type: Number, index: true },
  underlyingBalance1: { type: Number, index: true },
  totalSupply : { type: Number, index: true },
  price: { type: Number, index: true },
  currentTick: { type: Number, index: true },
  lowerTick: { type: Number, index: true },
  upperTick: { type: Number, index: true },
  block: { type: Number, index: true },
  timestamp: { type: Number, index: true },
})
