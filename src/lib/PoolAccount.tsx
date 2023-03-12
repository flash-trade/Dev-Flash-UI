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
  public totalPoolValueUsd : BN;
  
  constructor(poolConfig: PoolConfig, poolData : Pool, lpTokenInfo : Mint, custodies : CustodyAccount[]) {
   this.poolConfig = poolConfig;
   this.poolData = poolData;
   this.lpTokenInfo = lpTokenInfo;
   this.custodies = custodies;
   this.totalPoolValueUsd = new BN(-1); // -1 meaning unset
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

   getLpStats(prices : any){

     let stableCoinAmount = new BN(0);
     let totalPoolValueUsd = new BN(0);

    for (const custody of this.poolConfig.custodies) {
      const custodyData = this.custodies.find(t => t.mint.toBase58() === custody.mintKey.toBase58())
      if(custodyData){
        if (custodyData.isStable) {  
          stableCoinAmount.add(custodyData.assets.owned)
        }
        const priceBN = new BN(prices.get(custody.symbol)* 10**6); // so always keep prices with 6 decimals 
        const custodyValue = priceBN.mul(custodyData.assets.owned);
        console.log("priceBN,amt ,custodyValue",priceBN.toString(),custodyData.assets.owned.toString() ,custodyValue.toString(), custody.symbol)
        totalPoolValueUsd.add(custodyValue)
      }
    }
    
    console.log("totalPoolValueUsd.toNumber():",totalPoolValueUsd.toString())
    console.log("stableCoinAmount.toNumber():",stableCoinAmount.toString())

    if(this.lpTokenInfo.supply.toString() =='0' || totalPoolValueUsd.toString()=='0'){
      throw "supply or amt cannot be zero";
    }
    this.totalPoolValueUsd = totalPoolValueUsd;
    const lpPrice = totalPoolValueUsd.div(new BN(this.lpTokenInfo.supply.toString()))
    
     return  {
       lpTokenSupply : new BN(this.lpTokenInfo.supply.toString()),
       decimals : this.poolConfig.lpDecimals,
       totalPoolValue : totalPoolValueUsd,
       price : lpPrice,
       stableCoinPercentage : stableCoinAmount.mul(new BN(4)).div(totalPoolValueUsd),
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
  getCustodyDetails(prices : any) {
    const custodyDetails = [];
    for (const custody of this.poolConfig.custodies) {
      const token = this.poolData.tokens.find(t => t.custody.toBase58() === custody.custodyAccount.toBase58());
     
      const custodyData = this.custodies.find(t => t.mint.toBase58() === custody.mintKey.toBase58())
      const priceBN = new BN(prices.get(custody.symbol)* 10**6); // so always keep prices with 6 decimals 

      if(this.totalPoolValueUsd.toNumber()==-1 || this.totalPoolValueUsd.toString()=='0'){
        throw "call getLpStats first";
      } 
      console.log("this.totalPoolValueUsd:",this.totalPoolValueUsd.toString())

      if(custodyData && token) {
        custodyDetails.push({
          symbol: custody.symbol,
          price: new BN(prices.get(custody.symbol)),
          targetWeight: token.targetRatio,
          currentWeight: (custodyData.assets.owned.mul(priceBN)).div(this.totalPoolValueUsd), // use getAssetsUnderManagement()
          utilization: custodyData.assets.locked.mul(new BN(10**6)).div(custodyData.assets.owned).div(new BN(10**6)),
          assetsAmountUi : (custodyData.assets.owned.toNumber() / 10**(custody.decimals)).toFixed(4),
          totalUsdAmountUi : ((custodyData.assets.owned.mul(priceBN)).div(new BN(10**(custody.decimals))).toNumber() / 10**6).toFixed(4),
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
