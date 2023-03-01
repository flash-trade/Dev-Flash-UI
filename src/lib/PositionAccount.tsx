import { TokenE } from "../utils/TokenUtils";

export enum Side {
  None,
  Long,
  Short,
}

export class TradeSide {
  static Long = { long: {} };
  static Short = { short: {} };
}

export interface Position {
  id: string;
  positionAccountAddress: string;
  poolAddress: string;
  collateral: number;
  entryPrice: number;
  leverage: number;
  liquidationPrice: number;
  liquidationThreshold: number;
  markPrice: number;
  pnlDelta: number;
  pnlDeltaPercent: number;
  size: number;
  timestamp: number;
  token: TokenE;
  side: Side;
  value: number;
  valueDelta: number;
  valueDeltaPercentage: number;
}

export interface UserPoolPositions {
  name: string;
  tokens: TokenE[];
  positions: Position[];
}
