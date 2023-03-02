import { useEffect, useMemo, useState } from "react";
import { CLUSTER, DEFAULT_POOL, getPerpetualProgramAndProvider } from "@/utils/constants";
import { getTokenAddress, tokenAddressToTokenE } from "@/utils/TokenUtils";
import { PublicKey } from "@solana/web3.js";
import { findProgramAddressSync } from "@project-serum/anchor/dist/cjs/utils/pubkey";
import {  PoolAccount } from "@/lib/PoolAccount";
import { getMint } from "@solana/spl-token";
import { useGlobalStore } from "@/stores/store";
import { PoolConfig } from "@/utils/PoolConfig";
import { BN } from "@project-serum/anchor";
import { Pool } from "../types";


export interface ViewPoolData {
  pool : Pool,
  // Display Data
  liquidity : BN,
  volume : BN,
  fees : BN,
  OILong : BN,
  OIShort : BN,
  // 
  lpTokenSupply : BN,
  
}

export function usePoolData() {

  const [timer, setTimer] = useState(0);

  const custodies = useGlobalStore(state => state.custodies);
  const poolData = useGlobalStore(state => state.poolData);
  const lpMintData = useGlobalStore(state => state.lpMintData);

  let poolInfos = {};

  async function getPoolData() {
    let { perpetual_program, provider } = await getPerpetualProgramAndProvider();

    const poolConfig = PoolConfig.fromIdsByName(DEFAULT_POOL, CLUSTER);

    if(!poolData || !lpMintData) return

    const pool = new PoolAccount(poolConfig, poolData, lpMintData, Array.from(custodies.values()))
    return {
      oiLong: pool.getOiLongUI(),
      oiShort: pool.getOiShortUI(),
      // oiShort: pool.getTradeVolumes()
      // oiShort: pool.getTradeVolumes()

    }
  }

  useEffect(() => {
    
    
  }, [custodies]);


  useEffect(() => {
    const interval = setInterval(() => {
      setTimer(Date.now())
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  return useMemo(() => {

    if (!custodies) {
      return getPoolData();
    } else {
      {}
    }

    return { pool };
  }, [custodies, timer])

}
