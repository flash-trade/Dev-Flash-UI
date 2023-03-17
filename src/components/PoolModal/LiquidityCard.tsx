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

import { getPerpetualProgramAndProvider, POOL_CONFIG, PRICE_DECIMALS } from "@/utils/constants";
import { BN } from "@project-serum/anchor";
import { useGlobalStore } from "@/stores/store";
import { usePythPrices } from "@/hooks/usePythPrices";
import { ViewHelper } from "@/viewHelpers/index";
import { toUiDecimals } from "@/utils/displayUtils";
import { usePoolData } from "@/hooks/usePoolData";
import { addLiquidity } from "src/actions/addLiquidity";
import { removeLiquidity } from "src/actions/removeLiquidity";

interface Props {
  className?: string;
}

enum Tab {
  Add,
  Remove,
}

const TOKEN_E_LIST = POOL_CONFIG.tokens.map((token) => {
  return tokenAddressToTokenE(token.mintKey.toBase58());
});

export default function LiquidityCard(props: Props) {
  const { wallet, publicKey, signTransaction } = useWallet();
  const { connection } = useConnection();

  const {prices} = usePythPrices();
  const poolData = usePoolData();

  // const lpMintData = useGlobalStore(state => state.lpMintData);
  const userLpTokensBalance = useGlobalStore( state => state.userLpTokensBalance);  

  const [tab, setTab] = useState(Tab.Add);

  const [payToken, setPayToken] = useState(TOKEN_E_LIST[0]);
  const [payTokenBalance, setPayTokenBalance] = useState(0);

  const [inputTokenAmount, setInputTokenAmount] = useState(0);
  const [inputLpTokenAmount, setInputLpTokenAmount] = useState(0);


  useEffect(() => {
    async function fetchData() {
      let tokenBalance = await fetchTokenBalance(
        payToken!,
        publicKey!,
        connection
      );
      setPayTokenBalance(tokenBalance);

      // TODO:: creating LP POSITION FIRST TIME MAKE SURE TO SET IN STORE 
      // let lpBalance = await fetchLPBalance(
      //   POOL_CONFIG.lpTokenMint,
      //   publicKey!,
      //   connection
      // );
      // setUserLpTokenBalance(lpBalance);
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

    //  ALL CALCULATIONS IN BN
    if(!payToken || !prices.get(payToken!)){
      console.log("no paytoken price", payToken,prices.get(payToken!) )
      return;
    }
    // console.log("price", payToken,prices.get(payToken!) )

    const payTokenPriceBN = new BN(prices.get(payToken!)! * 10**PRICE_DECIMALS ) ; // already handled above
   
    const poolAumUsd = poolData.lpStats.totalPoolValue;
    const lpTokenSupply = poolData.lpStats.lpTokenSupply;
    if(poolAumUsd.toString()!=='0' && lpTokenSupply.toString()!=='0'){
     
      // replace 6 with token decimals
        const depositUsd = new BN(inputTokenAmount * 10**6).mul(payTokenPriceBN).div(new BN(10**6))
        // console.log("depositUsd:",depositUsd.toString(), inputTokenAmount, payTokenPriceBN.toString())
        const shareBN = depositUsd.mul(new BN(10**6)).div(poolAumUsd);
        // console.log("shareBN:",shareBN.toNumber())

        const userLPtokensRecieveBN =  lpTokenSupply.mul(shareBN).div(new BN(10**6)); // div share decimals
        const useLPTokenUi = toUiDecimals(userLPtokensRecieveBN, POOL_CONFIG.lpDecimals, 4);
        // console.log("useLPTokenUi:",useLPTokenUi)
        setInputLpTokenAmount(Number(useLPTokenUi))
      }
    
  }, [inputTokenAmount, prices, poolData])
  

  // useEffect(() => {
  //   console.log("price", payToken, prices?.get(payToken!) )
  // }, [prices])
  


  async function changeLiq() {
    console.log("before change", tab === Tab.Remove, inputLpTokenAmount);
    const slippage = 10;
    if( tab === Tab.Add){
      await addLiquidity(
        wallet!,
        publicKey!,
        signTransaction as any,
        connection,
        payToken!,
         inputTokenAmount,
        inputLpTokenAmount,
        slippage
      );

    } else {
      await removeLiquidity(
        wallet!,
        publicKey!,
        signTransaction as any,
        connection,
        payToken!,
        inputLpTokenAmount,
         inputTokenAmount,
        slippage
      );

    }
  }


  return (
    <div className={props.className}>
      <div
        className={twMerge("bg-zinc-800", "p-4", "rounded", "overflow-hidden")}
      >

       {/*  ============ TAB selection  =========== */}

        <div className="mb-4 grid grid-cols-2 gap-x-1 rounded bg-black p-1">
          <SidebarTab
            selected={tab === Tab.Add}
            onClick={() => {
              setInputLpTokenAmount(0);
              setInputTokenAmount(0);
              setTab(Tab.Add);
            }}
          >
            <Add className="h-4 w-4" />
            <div>Add</div>
          </SidebarTab>
          <SidebarTab
            selected={tab === Tab.Remove}
            onClick={() => {
              setInputLpTokenAmount(0);
              setInputTokenAmount(0);
              setTab(Tab.Remove);
            }}
          >
            <Subtract className="h-4 w-4" />
            <div>Remove</div>
          </SidebarTab>
        </div>

       
       {/*  ============ first half INPUT  =========== */}

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
                {publicKey && <div>Balance: {toUiDecimals(userLpTokensBalance, POOL_CONFIG.lpDecimals, 2)}</div>}
              </>
            )}
          </div>
          {tab === Tab.Add ? (
            <TokenSelector
              className="mt-2"
              amount={inputTokenAmount}
              token={payToken!}
              onChangeAmount={setInputTokenAmount}
              onSelectToken={setPayToken}
              tokenList={TOKEN_E_LIST}
            />
          ) : (
            <LpSelector
              className="mt-2"
              amount={inputLpTokenAmount}
              onChangeAmount={setInputLpTokenAmount}
            />
          )}
        </div>

        
        <br/><br/>

       {/*  ============ second half INPUT  =========== */}

        <div>
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-white">You Receive</div>
            {
             publicKey &&  
                (
                  tab === Tab.Add ? 
                  <div>
                  Balance: {toUiDecimals(userLpTokensBalance, POOL_CONFIG.lpDecimals, 2)}
                  </div>
                  : 
                  <div>
                  Balance: {payTokenBalance.toFixed(2)}
                </div>
                 
                )
             }
          </div>

          {tab === Tab.Add ? (
            <LpSelector className="mt-2" amount={inputLpTokenAmount} />
          ) : (
            <TokenSelector
              className="mt-2"
              amount={inputTokenAmount}
              token={payToken!}
              onSelectToken={setPayToken}
              tokenList={TOKEN_E_LIST}
            />
          )}
        </div>

       {/*  ============ confirm  ============== */}


        <SolidButton className="mt-6 w-full" onClick={changeLiq}>
          Confirm
        </SolidButton>
      </div>
    </div>
  );
}
