import { createEntity } from '../deps.ts'

export interface IRangeSnapshot {
  vault: string
  name: string
  symbol: string
  token0: string
  token1: string 
  lowerTick : number
  upperTick : number 
  underlyingBalance0 : number
  underlyingBalance1 : number
  block: number
  timestamp: number
}

export const RangeSnapshot = createEntity<IRangeSnapshot>('RangeSnapshot', {
  vault: String,
  name: String,
  symbol: String,
  token0: String,
  token1: String,
  lowerTick: { type: Number, index: true },
  upperTick: { type: Number, index: true }, 
  underlyingBalance0: { type: Number, index: true },
  underlyingBalance1: { type: Number, index: true },
  block: { type: Number, index: true },
  timestamp: { type: Number, index: true },
})
