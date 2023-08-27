import { createEntity } from '../deps.ts'

export interface IFeeSnapshot {
  _id: string
  vault: string
  name: string
  symbol: string
  token0: string
  token1: string 
  amount0 : number
  amount1 : number
}

export const FeeSnapshot = createEntity<IFeeSnapshot>('FeeSnapshot', {
  _id: String, // vault address
  vault: String,
  name: String,
  symbol: String,
  token0: String,
  token1: String, 
  amount0: { type: Number, index: true },
  amount1: { type: Number, index: true },
})


export interface IFeeSnapSimple {
  vault: string
  name: string
  symbol: string
  token0: string
  token1: string 
  amount0 : number
  amount1 : number
  total0 : number
  total1 : number
  block: number
  timestamp: number
}

export const FeeSnapshotHistorical = createEntity<IFeeSnapSimple>('FeeSnapshotHistorical', {
  vault: String,
  name: String,
  symbol: String,
  token0: String,
  token1: String, 
  amount0: { type: Number, index: true },
  amount1: { type: Number, index: true },
  total0: { type: Number, index: true },
  total1: { type: Number, index: true },
  block: { type: Number, index: true },
  timestamp: { type: Number, index: true },
})
