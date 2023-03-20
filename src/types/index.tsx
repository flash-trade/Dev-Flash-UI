import { BN } from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";

//  taken from drift 
export function isVariant(object: any, type: string) {
	return object.hasOwnProperty(type);
}

// isOneOfVariant(side, ['long', 'short']
export function isOneOfVariant(object: any, types: string[]) {
	return types.reduce((result, type) => {
		return result || object.hasOwnProperty(type);
	}, false);
}

//  simple type cannot be used as anchor somehow makes it a object while parseing 
// export enum Side {
//     None,
//     Long,
//     Short,
// }
export class Side {
    static None = { none: {} };
    static Long = { long: {} };
    static Short = { short: {} };
  }


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

export interface BorrowRateParams {
    // borrow rate params have implied RATE_DECIMALS decimals
     baseRate: BN,
     slope1: BN,
     slope2: BN,
     optimalUtilization: BN,
}

export interface BorrowRateState {
    // borrow rates have implied RATE_DECIMALS decimals
     currentRate: BN,
     cumulativeInterest: BN,
     lastUpdate: BN,
}

export interface PositionStats {
     openPositions: BN,
     collateralUsd: BN,
     sizeUsd: BN,
     lockedAmount: BN,
     weightedLeverage: BN,
     totalLeverage: BN,
     cumulativeInterestUsd: BN,
     cumulativeInterestSnapshot: BN,
}

export interface Custody {
    // static parameters
    pool: PublicKey;
    mint: PublicKey;
    tokenAccount: PublicKey;
    decimals: number;
    isStable: boolean;
    oracle: OracleParams;
    pricing: PricingParams;
    permissions: Permissions;
    fees: Fees;
    borrowRate: BorrowRateParams;

    // dynamic variables
    assets: Assets;
    collectedFees: FeesStats;
    volumeStats: VolumeStats;
    tradeStats: TradeStats;
    
    longPositions: PositionStats,
    shortPositions: PositionStats,
    borrowRateState: BorrowRateState,
    
    // bumps for address validation
    bump: number;
    tokenAccountBump: number;
}

export interface Assets {
    collateral: BN;
    protocolFees: BN;
    owned: BN;
    locked: BN;
}

export interface FeesStats {
    swapUsd: BN;
    addLiquidityUsd: BN;
    removeLiquidityUsd: BN;
    openPositionUsd: BN;
    closePositionUsd: BN;
    liquidationUsd: BN;
}

export interface VolumeStats {
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

export interface OracleParams {
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

export interface PricingParams {
    useEma: boolean;
    useUnrealizedPnlInAum: boolean;

    tradeSpreadLong: BN;
    tradeSpreadShort: BN;
    swapSpread: BN;
    
    minInitialLeverage: BN;
    maxInitialLeverage: BN;

    maxLeverage: BN;
    maxPayoffMult: BN;

    maxUtilization: BN;
    // USD denominated values always have implied USD_DECIMALS decimals
    maxPositionLockedUsd: BN;
    maxTotalLockedUsd: BN;
}

export interface TradeStats {
    profitUsd: BN;
    lossUsd: BN;
    oiLongUsd: BN;
    oiShortUsd: BN;
}



export interface Position {
    owner: PublicKey,
    pool: PublicKey,
    custody: PublicKey,
    // lockCustody: PublicKey,

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


