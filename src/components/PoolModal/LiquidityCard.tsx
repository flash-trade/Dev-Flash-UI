import {  tokenAddressToTokenE } from "@/utils/TokenUtils";
import { useEffect, useState } from "react";
import { twMerge } from "tailwind-merge";
import { SolidButton } from "@/components/SolidButton";
import { TokenSelector } from "@/components/TokenSelector";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { SidebarTab } from "../SidebarTab";

import Add from "@carbon/icons-react/lib/Add";
import Subtract from "@carbon/icons-react/lib/Subtract";
import { LpSelector } from "./LpSelector";
import { changeLiquidity } from "src/actions/changeLiquidity";
import {  PoolAccount } from "@/lib/PoolAccount";
import { fetchLPBalance, fetchTokenBalance } from "@/utils/retrieveData";

import { getMint } from "@solana/spl-token";
import { useDailyPriceStats } from "@/hooks/useDailyPriceStats";
import { POOL_CONFIG } from "@/utils/constants";
import { usePoolData } from "@/hooks/usePoolData";
import { BN } from "@project-serum/anchor";
import { useGlobalStore } from "@/stores/store";

interface Props {
  className?: string;
  pool: PoolAccount;
}

enum Tab {
  Add,
  Remove,
}

export default function LiquidityCard(props: Props) {
  const { wallet, publicKey, signTransaction } = useWallet();
  const { connection } = useConnection();
  const lpMintData = useGlobalStore(state => state.lpMintData);

  const poolData = usePoolData();

  const [tokenAmount, setTokenAmount] = useState(10);

  const [tab, setTab] = useState(Tab.Add);

  const [payTokenBalance, setPayTokenBalance] = useState(0);
  const [userLpTokenBalance, setUserLpTokenBalance] = useState(0);
  const [liqAmount, setLiqAmount] = useState(1);

  const [userLPShare, setUserLPShare] = useState(0);

  let tokenList = POOL_CONFIG.tokens.map((token) => {
    return tokenAddressToTokenE(token.mintKey.toBase58());
  });

  const [payToken, setPayToken] = useState(tokenList[0]);


  const stats = useDailyPriceStats();

  useEffect(() => {
    async function fetchData() {
      let tokenBalance = await fetchTokenBalance(
        payToken!,
        publicKey!,
        connection
      );

      setPayTokenBalance(tokenBalance);

      let lpBalance = await fetchLPBalance(
        POOL_CONFIG.lpTokenMint,
        publicKey!,
        connection
      );

      setUserLpTokenBalance(lpBalance);

      console.log("lpMintData:",lpMintData)
      if(lpMintData && poolData && poolData.lpStats.totalPoolValue.toString()){
        const supply= lpMintData.supply.toString();
        const poolAUm = poolData.lpStats.totalPoolValue.toString();
        console.log("supply:",supply )
        const userLPShare =  (new BN(supply)).div(poolData.lpStats.totalPoolValue).div(new BN(10 ** lpMintData.decimals));
        setUserLPShare(userLPShare.toNumber());
      }
       
    }
    if (publicKey && Object.values(stats).length > 0 && payToken) {
      console.log("passed iff", stats);
      fetchData();
    }
  }, [payToken, stats]);

  async function changeLiq() {
    console.log("before change", tab === Tab.Remove, liqAmount);
    await changeLiquidity(
      wallet!,
      publicKey!,
      signTransaction,
      connection,
      payToken,
      tab === Tab.Add ? tokenAmount : 0,
      tab === Tab.Remove ? liqAmount : 0
    );

    // router.reload(window.location.pathname);
  }

  // async function onChangeAmtLiq(tokenAmtUsd: number) {
  //   setLiqAmount(tokenAmtUsd * liqRatio);
  // }

  return (
    <div className={props.className}>
      <div
        className={twMerge("bg-zinc-800", "p-4", "rounded", "overflow-hidden")}
      >
        <div className="mb-4 grid grid-cols-2 gap-x-1 rounded bg-black p-1">
          <SidebarTab
            selected={tab === Tab.Add}
            onClick={() => {
              setLiqAmount(0);
              setTokenAmount(0);
              setTab(Tab.Add);
            }}
          >
            <Add className="h-4 w-4" />
            <div>Add</div>
          </SidebarTab>
          <SidebarTab
            selected={tab === Tab.Remove}
            onClick={() => {
              setLiqAmount(0);
              setTokenAmount(0);
              setTab(Tab.Remove);
            }}
          >
            <Subtract className="h-4 w-4" />
            <div>Remove</div>
          </SidebarTab>
        </div>

        {/* {poolName == "internal_test" &&
          Object.keys(props.pool.tokens).map((token) => {
            return <AirdropButton key={token} mint={token} />;
          })} */}

        <div>
          <div className="flex items-center justify-between">
            {tab === Tab.Add ? (
              <>
                {" "}
                <div className="text-sm font-medium text-white">You Add</div>
                {publicKey && <div>Balance: {payTokenBalance.toFixed(2)}</div>}
              </>
            ) : (
              <>
                {" "}
                <div className="text-sm font-medium text-white">You Remove</div>
                {publicKey && <div>Balance: {userLpTokenBalance.toFixed(2)}</div>}
              </>
            )}
          </div>
          {tab === Tab.Add ? (
            <TokenSelector
              className="mt-2"
              amount={tokenAmount}
              token={payToken!}
              onChangeAmount={setTokenAmount}
              onSelectToken={setPayToken}
              liqRatio={userLPShare}
              setLiquidity={setLiqAmount}
              tokenList={tokenList}
            />
          ) : (
            <LpSelector
              className="mt-2"
              amount={liqAmount}
              onChangeAmount={setLiqAmount}
            />
          )}
        </div>
        <br/><br/>
        <div>
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-white">You Receive</div>
            {publicKey && <div>Balance: {userLpTokenBalance.toFixed(2)}</div>}
          </div>

          {tab === Tab.Add ? (
            <LpSelector className="mt-2" amount={liqAmount} />
          ) : (
            <TokenSelector
              className="mt-2"
              amount={tokenAmount}
              token={payToken!}
              onSelectToken={setPayToken}
              tokenList={tokenList}
              liqRatio={userLPShare}
            />
          )}
        </div>

        <SolidButton className="mt-6 w-full" onClick={changeLiq}>
          Confirm
        </SolidButton>
      </div>
    </div>
  );
}
