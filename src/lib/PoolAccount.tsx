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

  getPoolTokenValue(stats: AllStats) {
    // get liquidities from token custodies

    let totalAmount = new BN('0');
    this.custodies.forEach(i => {
     totalAmount =  totalAmount.add(i.assets.owned); 
     })
  
    const totalAmount = Object.values(this.tokens).reduce(
      (acc: number, tokenCustody) => {
        let singleLiq =
          stats[tokenCustody.name].currentPrice *
          (Number(tokenCustody.amount) / 10 ** tokenCustody.decimals);
        return acc + singleLiq;
      },
      0
    );
    return totalAmount.toFixed(2);
  }

  getTradeVolumes() {
    const totalAmount = Object.values(this.tokens).reduce(
      (acc: number, tokenCustody: TokenCustody) => {
        return (
          acc +
          Object.values(tokenCustody.volume).reduce((acc, val) => acc + val)
        );
      },
      0
    );
    return (totalAmount / 10 ** 6).toFixed(2);
  }

  

  getFees() {
    const totalAmount = Object.values(this.tokens).reduce(
      (acc: number, tokenCustody: TokenCustody) => {
        return (
          acc + Object.values(tokenCustody.fees).reduce((acc, val) => acc + val)
        );
      },
      0
    );
    return (totalAmount / 10 ** 6).toFixed(2);
  }
}
