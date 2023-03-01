import { AllStats } from "@/hooks/useDailyPriceStats";
import { BN } from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";
import { Pool } from "../types";
import { TokenE } from "../utils/TokenUtils";

interface VolumeStats {
  swap: number;
  addLiquidity: number;
  removeLiquidity: number;
  openPosition: number;
  closePosition: number;
  liquidation: number;
}

interface FeeStats {
  swap: number;
  addLiquidity: number;
  removeLiquidity: number;
  openPosition: number;
  closePosition: number;
  liquidation: number;
}

export interface TokenCustody {
  custodyPk: PublicKey;
  tokenAccountPk: PublicKey;
  mintAccountPk: PublicKey;
  oracleAccountPk: PublicKey;
  name: TokenE;
  amount: BN;
  decimals: number;
  minRatio: number;
  maxRatio: number;
  volume: VolumeStats;
  oiLong: number;
  oiShort: number;
  fees: FeeStats;
}

export interface CustodyMeta {
  pubkey: PublicKey;
  isSigner: boolean;
  isWritable: boolean;
}



export class PoolObj {

  poolName: string;
  poolAddress: PublicKey;
  lpTokenMint: PublicKey;
  tokens: Record<string, TokenCustody>; // string is token mint address
  tokenNames: TokenE[];
  custodyMetas: CustodyMeta[];
  lpDecimals: number;
  lpSupply: number;


  constructor(pool: Pool, poolAddress : PublicKey, lpTokenMint : PublicKey) {
    this.poolName = pool.name;
    this.poolAddress = poolAddress;
    this.lpTokenMint = lpTokenMint;
    this.tokens = pool.tokens;
    this.tokenNames = pool.tokenNames;
    this.custodyMetas = pool.custodyMetas;
    this.lpDecimals = pool.lpDecimals;
    this.lpSupply = pool.lpSupply;
  }

  getLiquidities(stats: AllStats) {
    // get liquidities from token custodies
    if (stats === undefined) {
      return;
    }

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

  getOiLong() {
    const totalAmount = Object.values(this.tokens).reduce(
      (acc: number, tokenCustody: TokenCustody) => {
        return acc + tokenCustody.oiLong;
      },
      0
    );

    return (totalAmount / 10 ** 6).toFixed(2);
  }

  getOiShort() {
    const totalAmount = Object.values(this.tokens).reduce(
      (acc: number, tokenCustody: TokenCustody) => {
        return acc + tokenCustody.oiShort;
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
