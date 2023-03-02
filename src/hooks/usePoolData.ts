//@ts-nocheck

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


export interface PoolData {
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

  let poolInfos = {};

  async function getPoolData() {
    let { perpetual_program, provider } = await getPerpetualProgramAndProvider();

      const poolConfig = PoolConfig.fromIdsByName(DEFAULT_POOL, CLUSTER);

        let custodyInfos = {} ;

        poolConfig.custodies.forEach((custody, ind) => {
          custodyInfos[custody.mint.toString()] = {
            custodyAccount: new PublicKey(custodyAccounts[ind]),
            tokenAccount: custody.tokenAccount,
            mintAccount: custody.mint,
            oracleAccount: custody.oracle.oracleAccount,
            name: tokenAddressToTokenE(custody.mint.toString()),
            amount: custody.assets.owned,
            decimals: custody.decimals,
            minRatio: Number(pool.account.tokens[ind].minRatio),
            maxRatio: Number(pool.account.tokens[ind].maxRatio),

            volume: {
              swap: Number(custody.volumeStats.swapUsd),
              addLiquidity: Number(custody.volumeStats.addLiquidityUsd),
              removeLiquidity: Number(custody.volumeStats.removeLiquidityUsd),
              openPosition: Number(custody.volumeStats.openPositionUsd),
              closePosition: Number(custody.volumeStats.closePositionUsd),
              liquidation: Number(custody.volumeStats.liquidationUsd),
            },

            oiLong: Number(custody.tradeStats.oiLongUsd),
            oiShort: Number(custody.tradeStats.oiShortUsd),

            fees: {
              swap: Number(custody.collectedFees.swapUsd),
              addLiquidity: Number(custody.collectedFees.addLiquidityUsd),
              removeLiquidity: Number(
                custody.collectedFees.removeLiquidityUsd
              ),
              openPosition: custody.collectedFees.openPositionUsd,
              closePosition: Number(custody.collectedFees.closePositionUsd),
              liquidation: Number(custody.collectedFees.liquidationUsd),
            },
          };
        });

        let poolAddress = findProgramAddressSync(
          ["pool", pool.account.name],
          perpetual_program.programId
        )[0];

        let tokenNames = Object.values(custodyInfos).map((custody) => {
          return tokenAddressToTokenE(custody.mintAccount.toString());
        });

        let custodyMetas = [];

        tokenNames.forEach((tokenName) => {
          let custody =
            custodyInfos[getTokenAddress(tokenName)]?.custodyAccount;

          custodyMetas.push({
            pubkey: custody,
            isSigner: false,
            isWritable: false,
          });
        });

        tokenNames.forEach((tokenName) => {
          let custodyOracleAccount =
            custodyInfos[getTokenAddress(tokenName)]?.oracleAccount;
          custodyMetas.push({
            pubkey: custodyOracleAccount,
            isSigner: false,
            isWritable: false,
          });
        });

        let lpTokenMint = findProgramAddressSync(
          ["lp_token_mint", poolAddress.toBuffer()],
          perpetual_program.programId
        )[0];

        const lpData = await getMint(provider.connection, lpTokenMint);

        let poolData: Pool = {
          poolName: pool.account.name,
          poolAddress: poolAddress,
          lpTokenMint,
          tokens: custodyInfos,
          tokenNames,
          custodyMetas,
          lpDecimals: lpData.decimals,
          lpSupply: Number(lpData.supply),
        };

        let poolObj = new PoolAccount(poolData);

        poolInfos[pool.publicKey.toString()] = poolObj;
      
        return poolInfos;
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
