import { createEntity } from '../deps.ts'
import { Types } from 'npm:mongoose'

export interface IVault {
  address : string
  vault: string
  name: string
  symbol: string
  token0: any
  token1: any 
  init0 : number 
  init1 : number
  owner : string
  manager : string
}

export const Vault = createEntity<IVault>('Vault', {
  address : String,
  name: String,
  symbol: String,
  token0: { type: Types.ObjectId, ref: 'Token'},
  token1: { type: Types.ObjectId, ref: 'Token'}, 
  init0 : String,
  init1 : String,
  owner : String,
  manager : String,
})