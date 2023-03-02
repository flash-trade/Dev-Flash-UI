import { AllStats } from "@/hooks/useDailyPriceStats";
import { PoolConfig } from "@/utils/PoolConfig";
import { BN } from "@project-serum/anchor";
import {  Mint } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import { Custody, Pool, Token } from "../types";

export class PoolAccount {

  public poolConfig: PoolConfig;
  public poolData : Pool;
  public lpTokenInfo : Mint;
  public custodies : Custody[];

  
  constructor(poolConfig: PoolConfig, poolData : Pool, lpTokenInfo : Mint, custodies : Custody[]) {
   this.poolConfig = poolConfig;
   this.poolData = poolData;
   this.lpTokenInfo = lpTokenInfo;
   this.custodies = custodies;
  }

  loadCustodies(custodies : Custody[]){
    this.custodies = custodies;
  }

  loadPoolData(poolData : Pool){
    this.poolData = poolData
  }

  loadlpData(lpTokenInfo : Mint){
    this.lpTokenInfo = lpTokenInfo
  }

  getLPtokenSupply(){
     return this.lpTokenInfo.supply;
  }

  getOiLongUI() {
     let totalAmount = new BN('0');
     this.custodies.forEach(i => {
      totalAmount =  totalAmount.add(i.tradeStats.oiLongUsd); 
     })
    return (totalAmount.toNumber() / 10 ** 6).toFixed(2);
  }

  getOiShortUI() {
    let totalAmount = new BN('0');
    this.custodies.forEach(i => {
     totalAmount =  totalAmount.add(i.tradeStats.oiShortUsd); 
     })
   return (totalAmount.toNumber() / 10 ** 6).toFixed(2);
  }

  // handle decimal and this should accept a list of prices probs map or object
  getCustodyDetails(price: BN = new BN(0)) {
    const custodyWeights = [];
    for (const custody of this.poolConfig.custodies) {
      const token = this.poolData.tokens.find(t => t.custody.toBase58() === custody.custodyAccount.toBase58());
      // const custodyData = this.custodies.find(f => f.)
      // (custody.owned * price)/pool.aumUsd
      const custodyData = this.custodies.find(t => t.mint.toBase58() === custody.mintKey.toBase58())

      if(custodyData && token) {
        custodyWeights.push({
          symbol: custody.symbol,
          price: price,
          targetWeight: token.targetRatio,
          currentWeight: (custodyData.assets.owned.mul(price)).div(this.poolData.aumUsd),
          utilization: custodyData.assets.locked.div(custodyData.assets.owned),
        })
      }
    }
  }

  getPoolStats() {
    let totalFees = new BN(0)
    let totalVolume = new BN(0)
    let currentLongPositionsUsd = new BN(0)
    let currentShortPositionsUsd = new BN(0)

    for (const custody of this.poolConfig.custodies) {
      const custodyData = this.custodies.find(t => t.mint.toBase58() === custody.mintKey.toBase58())
      if (custodyData) {  
        const custodyFeeTotal = Object.values(custodyData.collectedFees).reduce((a: BN, b: BN) => a.add(b), new BN(0))
        totalFees.add(custodyFeeTotal)

        const custodyVolume = Object.values(custodyData.volumeStats).reduce((a: BN, b: BN) => a.add(b), new BN(0))
        totalVolume.add(custodyVolume)

        currentLongPositionsUsd.add(custodyData.tradeStats.oiLongUsd)
        currentShortPositionsUsd.add(custodyData.tradeStats.oiShortUsd)
      }
    }
    return {
      totalFees,
      totalVolume,
      currentLongPositionsUsd,
      currentShortPositionsUsd
    }
  }
}
