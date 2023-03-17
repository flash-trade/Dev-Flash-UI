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

import {  fetchTokenBalance } from "@/utils/retrieveData";

import {  POOL_CONFIG, PRICE_DECIMALS } from "@/utils/constants";
import { BN } from "@project-serum/anchor";
import { useGlobalStore } from "@/stores/store";
import { usePythPrices } from "@/hooks/usePythPrices";

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

  const userLpTokensBalance = useGlobalStore( state => state.userLpTokensBalance);  

  const [tab, setTab] = useState(Tab.Add);

  const [payToken, setPayToken] = useState(TOKEN_E_LIST[0]);
  const [payTokenBalance, setPayTokenBalance] = useState(0);

  const [inputTokenAmount, setInputTokenAmount] = useState(0);
  const [inputLpTokenAmount, setInputLpTokenAmount] = useState(0);


  const setInputTokenAmtGlobal = useGlobalStore(state => state.setInputTokenAmt);
  const setInputLPTokenAmtGlobal = useGlobalStore(state => state.setInputLPTokenAmt);


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
  }, [payToken, publicKey]);


  const handleAddLiqUpdate = (inputTokenAmount: number) => {
    if (!payToken || !prices.get(payToken!)) {
      console.log("no paytoken price", payToken, prices.get(payToken!))
      return;
    }
    setInputTokenAmount(inputTokenAmount)
    if(inputTokenAmount<1){
      setInputTokenAmtGlobal(1)
    } else {
      setInputTokenAmtGlobal(inputTokenAmount)
    }
    // console.log("price", payToken,prices.get(payToken!) )

    const payTokenPriceBN = new BN(prices.get(payToken!)! * 10 ** PRICE_DECIMALS); // already handled above

    const poolAumUsd = poolData.lpStats.totalPoolValue;
    const lpTokenSupply = poolData.lpStats.lpTokenSupply;
    if (poolAumUsd.toString() !== '0' && lpTokenSupply.toString() !== '0') {
      // replace 6 with token decimals
      const depositUsd = new BN(inputTokenAmount * 10 ** 6).mul(payTokenPriceBN).div(new BN(10 ** 6))
      // console.log("depositUsd:",depositUsd.toString(), inputTokenAmount, payTokenPriceBN.toString())
      const shareBN = depositUsd.mul(new BN(10 ** 6)).div(poolAumUsd);
      // console.log("shareBN:",shareBN.toNumber())

      const userLPtokensRecieveBN = lpTokenSupply.mul(shareBN).div(new BN(10 ** 6)); // div share decimals
      const useLPTokenUi = toUiDecimals(userLPtokensRecieveBN, POOL_CONFIG.lpDecimals, 4);
      // console.log("useLPTokenUi:",useLPTokenUi)
      setInputLpTokenAmount(Number(useLPTokenUi))
    }
  }

  const handleRemoveLiqUpdate = (inputLPTokenAmount: number) => {
    if (!payToken || !prices.get(payToken!)) {
      console.log("no paytoken price", payToken, prices.get(payToken!))
      return;
    }
    setInputLpTokenAmount(inputLPTokenAmount)
    if(inputLPTokenAmount<1){
    setInputLPTokenAmtGlobal(1)
    } else {
      setInputLPTokenAmtGlobal(inputLPTokenAmount)
    }

    const payTokenCustody = POOL_CONFIG.custodies.find(i => i.symbol=== payToken);
    if(!payTokenCustody){
      throw "payTokenCustody  not found";
    }

    const payTokenPriceBN = new BN(prices.get(payToken!)! * 10 ** PRICE_DECIMALS); // already handled above

    const poolAumUsd = poolData.lpStats.totalPoolValue;
    const lpTokenSupply = poolData.lpStats.lpTokenSupply;
    if (poolAumUsd.toString() !== '0' && lpTokenSupply.toString() !== '0') {

      const lpTokenPrice = poolAumUsd.div(lpTokenSupply);
      console.log("lpTokenPrice:",lpTokenPrice.toString())
      // replace 6 with token decimals
      const depositUsd = new BN(inputLPTokenAmount * 10 ** POOL_CONFIG.lpDecimals).mul(lpTokenPrice)
      console.log("depositUsd:",depositUsd.toString(), inputLPTokenAmount, payTokenPriceBN.toString())
      // const shareBN = depositUsd.mul(new BN(10 ** 6)).div(poolAumUsd);
      // console.log("shareBN:",shareBN.toNumber())

      const usertokensRecieveBN = depositUsd.mul(new BN(10 ** payTokenCustody.decimals)).div(payTokenPriceBN); // div share decimals
      const useTokenUi = toUiDecimals(usertokensRecieveBN, payTokenCustody.decimals, 4);
      // console.log("useLPTokenUi:",useLPTokenUi)
      setInputTokenAmount(Number(useTokenUi))
    } else {
      console.error("error  lpTokenSupply zero ", lpTokenSupply.toString())
    }
  }

  


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
              onChangeAmount={handleAddLiqUpdate}
              onSelectToken={setPayToken}
              tokenList={TOKEN_E_LIST}
            />
          ) : (
            <LpSelector
              className="mt-2"
              amount={inputLpTokenAmount}
              onChangeAmount={handleRemoveLiqUpdate}
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
            <LpSelector className="mt-2" amount={inputLpTokenAmount}  />
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
