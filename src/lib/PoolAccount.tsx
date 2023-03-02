import { PoolConfig } from "@/utils/PoolConfig";
import { BN } from "@project-serum/anchor";
import {  Mint } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import { Custody, Pool, Token } from "../types";
import { CustodyAccount } from "./CustodyAccount";

export class PoolAccount {

  public poolConfig: PoolConfig;
  public poolData : Pool;
  public lpTokenInfo : Mint;
  public custodies : CustodyAccount[];
  
  constructor(poolConfig: PoolConfig, poolData : Pool, lpTokenInfo : Mint, custodies : CustodyAccount[]) {
   this.poolConfig = poolConfig;
   this.poolData = poolData;
   this.lpTokenInfo = lpTokenInfo;
   this.custodies = custodies;
  }

  loadCustodies(custodies : CustodyAccount[]){
    this.custodies = custodies;
  }

  loadPoolData(poolData : Pool){
    this.poolData = poolData
  }

  loadlpData(lpTokenInfo : Mint){
    this.lpTokenInfo = lpTokenInfo
  }

  getLpStats(price: BN = new BN(0)){

     let stableCoinAmount = new BN(0);
     let totalPoolValueUsd = new BN(0);
     let aum = this.poolData.aumUsd;

    for (const custody of this.poolConfig.custodies) {
      const custodyData = this.custodies.find(t => t.mint.toBase58() === custody.mintKey.toBase58())
      if(custodyData){
        if (custodyData.isStable) {  
          stableCoinAmount.add(custodyData.assets.owned)
        }
        const custodyValue = price.mul(custodyData.assets.collateral)
        totalPoolValueUsd.add(custodyValue)
      }
    }
    const lpPrice = price.mul(new BN(10));// TODO: calculate ?
    
     return  {
       lpTokenSupply : new BN(this.lpTokenInfo.supply.toString()),
       decimals : this.poolConfig.lpDecimals,
       totalPoolValue : totalPoolValueUsd,
       price : lpPrice,
       stableCoinPercentage : stableCoinAmount.mul(new BN(4)).div(aum),
       marketCap : lpPrice.mul(new BN(this.lpTokenInfo.supply.toString())),
      // totalStaked : BN,
     }
  }

  getOiLongUI() {
     let totalAmount = new BN('0');
     this.custodies.forEach(i => {
      totalAmount =  totalAmount.add(i.tradeStats.oiLongUsd); 
     })
    return totalAmount;
  }

  getOiShortUI() {
    let totalAmount = new BN('0');
    this.custodies.forEach(i => {
     totalAmount =  totalAmount.add(i.tradeStats.oiShortUsd); 
     })
   return totalAmount;
  }

  // handle decimal and this should accept a list of prices probs map or object
  getCustodyDetails(price: BN = new BN(0)) {
    const custodyDetails = [];
    for (const custody of this.poolConfig.custodies) {
      const token = this.poolData.tokens.find(t => t.custody.toBase58() === custody.custodyAccount.toBase58());
      // const custodyData = this.custodies.find(f => f.)
      // (custody.owned * price)/pool.aumUsd
      const custodyData = this.custodies.find(t => t.mint.toBase58() === custody.mintKey.toBase58())

      if(custodyData && token) {
        custodyDetails.push({
          symbol: custody.symbol,
          price: price,
          targetWeight: token.targetRatio,
          currentWeight: (custodyData.assets.owned.mul(price)).div(this.poolData.aumUsd), // use getAssetsUnderManagement()
          utilization: custodyData.assets.locked.div(custodyData.assets.owned),
        })
      }
    }
    return custodyDetails;
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
