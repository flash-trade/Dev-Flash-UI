import { useDailyPriceStats } from "@/hooks/useDailyPriceStats";
import { Pool, PoolAccount } from "@/lib/PoolAccount";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useEffect } from "react";
import { twMerge } from "tailwind-merge";
import { checkIfAccountExists } from "@/utils/retrieveData";
import { useUserData } from "@/hooks/useUserData";
import { POOL_CONFIG } from "@/utils/constants";
import { usePoolData } from "@/hooks/usePoolData";
import { BN } from "@project-serum/anchor";

interface Props {
  pool: Pool;
  className?: string;
}

export default function PoolStats(props: Props) {
  const stats = useDailyPriceStats();

  const poolData = usePoolData();


  const { userLpTokens } = useUserData();

  function getLiquidityBalance(): number {
    let userLpBalance = userLpTokens[POOL_CONFIG.poolAddress.toString()] ?? 0;
    let lpSupply = poolData.lpStats.lpTokenSupply.div(new BN(10 ** POOL_CONFIG.lpDecimals));

    let userLiquidity = (userLpBalance / lpSupply.toNumber()) * poolData.lpStats.totalPoolValue.toNumber();

    if (Number.isNaN(userLiquidity)) {
      return 0;
    }

    return userLiquidity;
  }

  function getLiquidityShare(): number {
    let userLpBalance = userLpTokens[POOL_CONFIG.poolAddress.toString()] ?? 0;
    let lpSupply = poolData.lpStats.lpTokenSupply.div(new BN(10 ** POOL_CONFIG.lpDecimals));


    let userShare = (userLpBalance / lpSupply.toNumber()) * 100;

    if (Number.isNaN(userShare)) {
      return 0;
    }
    return userShare;
  }

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
            value: `$${poolData.lpStats.totalPoolValue.toString()}`,
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
            label: "Your Liquidity",
            value: `$${getLiquidityBalance().toFixed(2)}`,
          },
          {
            label: "Your Share",
            value: `${getLiquidityShare().toFixed(2)}%`,
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
