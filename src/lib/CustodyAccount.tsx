import { BN } from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";
import { Assets, CollectedFees, Custody, Fees, Oracle,  Pricing, TradeStats } from "../types";


export class CustodyAccount {

    public x : number;    

    static from(
        publicKey: PublicKey,
        obj: {
          pool: PublicKey;
          mint: PublicKey;
          tokenAccount: PublicKey;
          decimals: number;
          isStable: boolean;
          oracle: Oracle;
          pricing: Pricing;
          permissions: Permissions;
          fees: Fees;
          borrowRate: BN;
          borrowRateSum: BN;
          assets: Assets;
          collectedFees: CollectedFees;
          volumeStats: CollectedFees;
          tradeStats: TradeStats;
        },
      ): CustodyAccount {
        return new CustodyAccount(
          publicKey,
          obj.mint,
          obj.tokenAccount,
          obj.decimals,
          obj.isStable,
          obj.oracle,
          obj.pricing,
          obj.permissions,
          obj.fees,
          obj.borrowRate,
          obj.borrowRateSum,
          obj.assets,
          obj.collectedFees,
          obj.volumeStats,
          obj.tradeStats,
          100
        );
      }
  
    constructor(
        public pool: PublicKey,
        public mint: PublicKey,
        public tokenAccount: PublicKey,
        public decimals: number,
        public isStable: boolean,
        public oracle: Oracle,
        public pricing: Pricing,
        public permissions: Permissions,
        public fees: Fees,
        public borrowRate: BN,
        public borrowRateSum: BN,
        public assets: Assets,
        public collectedFees: CollectedFees,
        public volumeStats: CollectedFees,
        public tradeStats: TradeStats,
        x : number
      ) {
        this.x = x;
      }

      updateCustodyData(custody: Custody) {
            Object.assign(this,{...custody})
      }

      getUtilization(){

      }

      getCuurentAndTargetWeights(){
        
      }

      getDepositFee(){

      }

      getLiquidity(){

      }

  }