import { BN } from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";
import { Assets, FeesStats, Custody, Fees, Oracle,  PricingParams, TradeStats, Permissions } from "../types";


export class CustodyAccount {

    static from(
        publicKey: PublicKey,
        obj: {
          mint: PublicKey;
          tokenAccount: PublicKey;
          decimals: number;
          isStable: boolean;
          oracle: Oracle;
          pricing: PricingParams;
          permissions: Permissions;
          fees: Fees;
          borrowRate: BN;
          borrowRateSum: BN;
          assets: Assets;
          collectedFees: FeesStats;
          volumeStats: FeesStats;
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
        );
      }
  
    constructor(
        public publicKey: PublicKey, 
        public mint: PublicKey,
        public tokenAccount: PublicKey,
        public decimals: number,
        public isStable: boolean,
        public oracle: Oracle,
        public pricing: PricingParams,
        public permissions: Permissions,
        public fees: Fees,
        public borrowRate: BN,
        public borrowRateSum: BN,
        public assets: Assets,
        public collectedFees: FeesStats,
        public volumeStats: FeesStats,
        public tradeStats: TradeStats,
      ) {
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