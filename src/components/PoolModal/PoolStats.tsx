import { useDailyPriceStats } from "@/hooks/useDailyPriceStats";
import { Pool, PoolAccount } from "@/lib/PoolAccount";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useState } from "react";
import { twMerge } from "tailwind-merge";
import { checkIfAccountExists, fetchLPBalance } from "@/utils/retrieveData";
import { useUserData } from "@/hooks/useUserData";
import { POOL_CONFIG } from "@/utils/constants";
import { usePoolData } from "@/hooks/usePoolData";
import { BN } from "@project-serum/anchor";
import { useGlobalStore } from "@/stores/store";

interface Props {
  className?: string;
}

export default function PoolStats(props: Props) {
  const stats = useDailyPriceStats();

  const poolData = usePoolData();

  // const userLpTokensBalance = useGlobalStore( state => state.userLpTokensBalance);


  const [liquidityBalanceValueUsd, setLiquidityBalanceValueUsd] = useState(0);
  const [liquidityShare, setLiquidityShare] = useState(0);


  //  function getLiquidityBalanceValueUsd() {

  //   let lpSupply = poolData.lpStats.lpTokenSupply.div(new BN(10 ** POOL_CONFIG.lpDecimals));

  //   // console.log("poolData.lpStats.totalPoolValue.toNumber():",poolData.lpStats.totalPoolValue.toString())
  //   let userLiquidity = ((userLpTokensBalance / lpSupply.toNumber()) * poolData.lpStats.totalPoolValue.toNumber())/ 10**6;

  //   if (Number.isNaN(userLiquidity)) {
  //     return;
  //   }

  //   setLiquidityBalanceValueUsd(userLiquidity);
  // }

  //  function getLiquidityShare() {
    
  //   let lpSupply = poolData.lpStats.lpTokenSupply.div(new BN(10 ** POOL_CONFIG.lpDecimals));

  //   let userShare = (userLpTokensBalance / lpSupply.toNumber()) * 100;

  //   if (Number.isNaN(userShare)) {
  //     return;
  //   }
  //   setLiquidityShare(userShare);
  // }

  // useEffect(() => {
  //   if(userLpTokensBalance){
  //     getLiquidityBalanceValueUsd();
  //     getLiquidityShare();
  //   }
   
  // }, [userLpTokensBalance, poolData])
  

  if (Object.keys(stats).length === 0) {
    return <>Loading stats</>;
  } else {
    return (
      <div
        className={twMerge(
          "grid",
          "grid-cols-4",
          "gap-x-4",
          "gap-y-8",
          props.className
        )}
      >
        {[
          {
            label: "Liquidity",
            value: `$${ Number(poolData.lpStats.totalPoolValue.toString()) / 10**6}`,
          },
          {
            label: "Volume",
            value: `$${poolData.poolStats.totalVolume.toString()}`,
          },
          {
            label: "OI Long",
            value: (
              <>
                {`$${poolData.oiLong.toString()} `}
                <span className="text-zinc-500"> </span>
              </>
            ),
          },
          {
            label: "OI Short",
            value: `$${poolData.oiShort.toString()}`,
          },
          {
            label: "Fees",
            value: `$${poolData.poolStats.totalFees.toString()}`,
          },
          {
            label: "Your Liquidity Value",
            value: `$${liquidityBalanceValueUsd.toFixed(2)}`,
          },
          {
            label: "Your Share",
            value: `${liquidityShare.toFixed(2)}%`,
          },
        ].map(({ label, value }, i) => (
          <div
            className={twMerge("border-zinc-700", "border-t", "pt-3")}
            key={i}
          >
            <div className="text-sm text-zinc-400">{label}</div>
            <div className="text-sm text-white">{value}</div>
          </div>
        ))}
      </div>
    );
  }
}
