import { useEffect, useMemo, useState } from "react";
import { CLUSTER, DEFAULT_POOL } from "@/utils/constants";
import {  PoolAccount } from "@/lib/PoolAccount";
import { useGlobalStore } from "@/stores/store";
import { PoolConfig } from "@/utils/PoolConfig";
import { BN } from "@project-serum/anchor";


export interface ViewPoolData {
  oiLong : BN,
  oiShort : BN,
  poolStats : {
    totalVolume : BN,
    totalFees : BN,
    currentLongPositionsUsd : BN,
    currentShortPositionsUsd : BN,
  },
  custodyDetails : {
    symbol: string,
    price: BN,
    targetWeight: BN,
    currentWeight: BN,
    utilization: BN,
  }[],
  lpStats : {
    lpTokenSupply : BN,
    decimals : number,
    totalPoolValue : BN,
    price : BN,
    stableCoinPercentage : BN,
    marketCap : BN,
    // totalStaked : BN,
  },
}
const ZERO_BN = new BN(0);
const defaultData : ViewPoolData = {
  oiLong : ZERO_BN,
  oiShort : ZERO_BN,
  poolStats : {
    totalVolume : ZERO_BN,
    totalFees : ZERO_BN,
    currentLongPositionsUsd : ZERO_BN,
    currentShortPositionsUsd : ZERO_BN,
  },
  custodyDetails : [{
    symbol: '',
    price: ZERO_BN,
    targetWeight: ZERO_BN,
    currentWeight: ZERO_BN,
    utilization: ZERO_BN,
  }],
  lpStats : {
    lpTokenSupply : ZERO_BN,
    decimals : 0,
    totalPoolValue : ZERO_BN,
    price : ZERO_BN,
    stableCoinPercentage : ZERO_BN,
    marketCap : ZERO_BN,
    // totalStaked : BN,
  },
} 

export function usePoolData() {

  const [timer, setTimer] = useState(0);

  const custodies = useGlobalStore(state => state.custodies);
  const poolData = useGlobalStore(state => state.poolData);
  const lpMintData = useGlobalStore(state => state.lpMintData);

   const getPoolData =  () : ViewPoolData => {

    const poolConfig = PoolConfig.fromIdsByName(DEFAULT_POOL, CLUSTER);

    if(!poolData || !lpMintData) return defaultData;

    const pool = new PoolAccount(poolConfig, poolData, lpMintData, Array.from(custodies.values()))
    return {
      oiLong: pool.getOiLongUI(),
      oiShort: pool.getOiShortUI(),
      poolStats: pool.getPoolStats(),
      custodyDetails: pool.getCustodyDetails(new BN(1)),
      lpStats : pool.getLpStats(new BN(1))
    }
  }


  useEffect(() => {
    const interval = setInterval(() => {
      setTimer(Date.now())
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  return useMemo(() => {

    if (custodies) {
      return  getPoolData();
    } else {
      return defaultData;
    }

  }, [custodies, timer])

}
