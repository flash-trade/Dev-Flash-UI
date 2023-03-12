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
import { fetchLPBalance, fetchTokenBalance } from "@/utils/retrieveData";

import { getPerpetualProgramAndProvider, POOL_CONFIG } from "@/utils/constants";
import { BN } from "@project-serum/anchor";
import { useGlobalStore } from "@/stores/store";
import { usePythPrices } from "@/hooks/usePythPrices";
import { ViewHelper } from "@/viewHelpers/index";

interface Props {
  className?: string;
}

enum Tab {
  Add,
  Remove,
}


export default function LiquidityCard(props: Props) {
  const { wallet, publicKey, signTransaction } = useWallet();
  const { connection } = useConnection();
  const lpMintData = useGlobalStore(state => state.lpMintData);

  const {prices} = usePythPrices();

  const [tokenAmount, setTokenAmount] = useState(10);

  const [tab, setTab] = useState(Tab.Add);

  const [payTokenBalance, setPayTokenBalance] = useState(0);
  const [userLpTokenBalance, setUserLpTokenBalance] = useState(0);
  const [lpTokenAmount, setLpTokenAmount] = useState(0);

  const [userLPShare, setUserLPShare] = useState(0);

  let tokenList = POOL_CONFIG.tokens.map((token) => {
    return tokenAddressToTokenE(token.mintKey.toBase58());
  });

  const [payToken, setPayToken] = useState(tokenList[0]);


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
    }
    if (publicKey && payToken) {
      fetchData();
    }
  }, [payToken]);



  // useEffect(() => {
  //   console.log("poolData && poolData.lpStats.totalPoolValue.toNumber():",poolData , poolData.lpStats.totalPoolValue.toNumber())
  //   if(tokenAmount && payToken && lpMintData && poolData && poolData.lpStats.totalPoolValue.toNumber() ){
  //     const supply= lpMintData.supply.toString();
  //     const poolAumBN = poolData.lpStats.totalPoolValue;
  //     console.log("supply:",supply )
  //     const depositUsd = tokenAmount * (prices.get(getSymbol(payToken)) ?? 0);
  //     console.log("poolAumBN:",poolAumBN.toString())
  //     const shareBN = (new BN(depositUsd)).div(poolAumBN);
  //     const userLPShare =  (new BN(supply)).mul(shareBN).div(new BN(10 ** lpMintData.decimals));
  //     setUserLPShare(userLPShare.toNumber());
  //   }

  // }, [tokenAmount])
  
  useEffect(() => {
    (async () => {
      let { provider } = await getPerpetualProgramAndProvider(wallet as any);
      const View = new ViewHelper(connection, provider );
  
      const poolAUM = await View.getAssetsUnderManagement( POOL_CONFIG.poolAddress);
 
      if(poolAUM.toNumber() && lpMintData){
        console.log("supply, poolAUM, :",lpMintData, lpMintData?.supply?.toString() /10 ** (lpMintData.decimals) ,poolAUM.toNumber())
        console.log("tokenAmount,prices", tokenAmount, prices, payToken,  prices.get(payToken!))

          const supply= lpMintData.supply.toString();
          const depositUsd = tokenAmount * (prices.get(payToken!) ?? 0);
          console.log("depositUsd , AUM:",depositUsd, poolAUM.toNumber())
          const shareBN = (new BN(depositUsd)).mul(new BN(10**6)).div(poolAUM);
          console.log("shareBN:",shareBN.toNumber())
          setUserLPShare(shareBN.toNumber()/10**6);

          const userLPtokensRecieve =  (new BN(supply)).mul(shareBN).div(new BN(10 ** (lpMintData.decimals)));
          console.log("userLPShare.toNumber, supply:",userLPtokensRecieve.toNumber()/10**6, supply/ 10 ** (lpMintData.decimals))
          setLpTokenAmount(userLPtokensRecieve.toNumber()/10**6)
       }
    })()
   
  }, [tokenAmount, prices, lpMintData])
  


  async function changeLiq() {
    console.log("before change", tab === Tab.Remove, lpTokenAmount);
    await changeLiquidity(
      wallet!,
      publicKey!,
      signTransaction as any,
      connection,
      payToken!,
      tab === Tab.Add ? tokenAmount : 0,
      tab === Tab.Remove ? lpTokenAmount : 0
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
              setLpTokenAmount(0);
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
              setLpTokenAmount(0);
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
              setLiquidity={setLpTokenAmount}
              tokenList={tokenList}
            />
          ) : (
            <LpSelector
              className="mt-2"
              amount={lpTokenAmount}
              onChangeAmount={setLpTokenAmount}
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
            <LpSelector className="mt-2" amount={lpTokenAmount} />
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
