import { BN } from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";

export interface Pool {
    name: string;
    tokens: Token[];
    aumUsd: BN;
    bump: number;
    lpTokenBump: number;
    inceptionTime: BN;
}

export interface Token {
    custody: PublicKey;
    targetRatio: BN;
    minRatio: BN;
    maxRatio: BN;
}

export interface Custody {
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
    bump: number;
    tokenAccountBump: number;
}

export interface Assets {
    collateral: BN;
    protocolFees: BN;
    owned: BN;
    locked: BN;
}

export interface CollectedFees {
    swapUsd: BN;
    addLiquidityUsd: BN;
    removeLiquidityUsd: BN;
    openPositionUsd: BN;
    closePositionUsd: BN;
    liquidationUsd: BN;
}

export interface Fees {
    mode: FeesMode;
    maxIncrease: BN;
    maxDecrease: BN;
    swap: BN;
    addLiquidity: BN;
    removeLiquidity: BN;
    openPosition: BN;
    closePosition: BN;
    liquidation: BN;
    protocolShare: BN;
}

export enum FeesMode {
    Fixed,
    Linear
}

export interface Oracle {
    oracleAccount: PublicKey;
    oracleType: OracleType;
    maxPriceError: BN;
    maxPriceAgeSec: number;
}

export enum OracleType {
    None,
    Test,
    Pyth,
}

export interface Permissions {
    allowSwap: boolean;
    allowAddLiquidity: boolean;
    allowRemoveLiquidity: boolean;
    allowOpenPosition: boolean;
    allowClosePosition: boolean;
    allowPnlWithdrawal: boolean;
    allowCollateralWithdrawal: boolean;
    allowSizeChange: boolean;
}

export interface Pricing {
    useEma: boolean;
    tradeSpreadLong: BN;
    tradeSpreadShort: BN;
    swapSpread: BN;
    minInitialLeverage: BN;
    maxLeverage: BN;
    maxPayoffMult: BN;
}

export interface TradeStats {
    profitUsd: BN;
    lossUsd: BN;
    oiLongUsd: BN;
    oiShortUsd: BN;
}

export enum Side {
    None,
    Long,
    Short,
}

export interface Position {
    owner: PublicKey,
    pool: PublicKey,
    custody: PublicKey,
    lockCustody: PublicKey,

    openTime: BN,
    updateTime: BN,

    side: Side,
    price: BN,
    sizeUsd: BN,
    collateralUsd: BN,
    unrealizedProfitUsd: BN,
    unrealizedLossUsd: BN,
    cumulativeInterestSnapshot: BN,
    lockedAmount: BN,
    collateralAmount: BN,
}


