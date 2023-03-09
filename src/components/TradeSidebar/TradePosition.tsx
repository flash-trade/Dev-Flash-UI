import { useEffect, useState } from "react";
import { twMerge } from "tailwind-merge";

import { useDailyPriceStats } from "@/hooks/useDailyPriceStats";
import { asTokenE, TokenE, tokenAddressToTokenE, getTokenAddress } from "@/utils/TokenUtils";

import { TokenSelector } from "../TokenSelector";
import { LeverageSlider } from "../LeverageSlider";
import { TradeDetails } from "./TradeDetails";
import { SolidButton } from "../SolidButton";
import { TradePositionDetails } from "./TradePositionDetails";
import { useRouter } from "next/router";
import { openPosition } from "src/actions/openPosition";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { BN } from "@project-serum/anchor";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

import { fetchTokenBalance } from "@/utils/retrieveData";

import { usePositions } from "@/hooks/usePositions";
import { CLUSTER, DEFAULT_POOL, getPerpetualProgramAndProvider, POOL_CONFIG } from "@/utils/constants";
import {  ViewHelper } from "@/viewHelpers/index";
import { PoolConfig } from "@/utils/PoolConfig";
import { Side } from "@/types/index";

interface Props {
  className?: string;
  side: Side;
}

enum Input {
  Pay = "pay",
  Position = "position",
}

export function TradePosition(props: Props) {
  const [payToken, setPayToken] = useState(TokenE.SOL);
  const [positionToken, setPositionToken] = useState(TokenE.SOL);
  const [payTokenBalance, setPayTokenBalance] = useState<number | null>(null);

  const [payAmount, setPayAmount] = useState(0.1);
  const [positionAmount, setPositionAmount] = useState(0.2);

  const [entryPrice, setEntryPrice] = useState(0)
  const [entryFee, setEntryFee] = useState(0)
  const [liquidationPrice, setLiquidationPrice] = useState(0)

  const [lastChanged, setLastChanged] = useState<Input>(Input.Pay);

  const [leverage, setLeverage] = useState(1);

  const { publicKey, signTransaction, wallet } = useWallet();
  const { connection } = useConnection();

 

  const { fetchPositions } = usePositions();

  // const pool = useGlobalStore(state => state.selectedPool);

  const allPriceStats = useDailyPriceStats();
  const router = useRouter();

  const { pair } = router.query;


  async function handleTrade() {
    await openPosition(
      wallet!,
      publicKey,
      signTransaction,
      connection,
      payToken,
      positionToken,
      new BN(payAmount * LAMPORTS_PER_SOL),
      new BN(positionAmount * LAMPORTS_PER_SOL),
      new BN(allPriceStats[payToken]?.currentPrice * 10 ** 6),
      props.side
    );
    fetchPositions();
    // router.reload(window.location.pathname);
  }

  useEffect(() => {
    
   ( async ()  => {

    let { provider } = await getPerpetualProgramAndProvider(wallet as any);
    const View = new ViewHelper(connection, provider );
    const POOL_CONFIG = PoolConfig.fromIdsByName(DEFAULT_POOL, CLUSTER);
    const payTokenCustody = POOL_CONFIG.custodies.find(i => i.mintKey.toBase58()=== getTokenAddress(payToken));
    // const x = await View.getOraclePrice( POOL_CONFIG.poolAddress, true, payTokenCustody?.custodyAccount!)
    // console.log("getOraclePrice: ",x);

    console.log("passing :",payAmount, positionAmount)
    //  const entryPrice = allPriceStats[payToken]?.currentPrice * payAmount || 0;
    const r = await View.getEntryPriceAndFee( new BN(payAmount * 10**(payTokenCustody?.decimals!)), new BN(positionAmount * 10**(payTokenCustody?.decimals!)) ,props.side as any , POOL_CONFIG.poolAddress, payTokenCustody?.custodyAccount!)
    console.log("getEntryPriceAndFee, setEntryFee: ",r.price.toNumber(), r.fee.toNumber());
    const price = r.price.toNumber()/ 10**6; 
    setEntryPrice(price);
    setEntryFee( price* r.fee.toNumber()/ 10**((payTokenCustody?.decimals!)))

    })()
   
  }, [ positionAmount,  props.side , wallet ]) //payAmount - already changes with positionAmount
  

  useEffect(() => {
    console.log("leverage:",leverage)
    let liquidationPrice = (entryPrice) * leverage;
    setLiquidationPrice(liquidationPrice);
  }, [leverage, entryPrice])
  

  useEffect(() => {
    setPositionToken(asTokenE(pair!.split("-")[0]));
  }, [pair]);

  useEffect(() => {
    async function fetchData() {
      if (publicKey == null) {
       return;
      }
      let tokenBalance = await fetchTokenBalance(
        payToken,
        publicKey,
        connection
      );
      setPayTokenBalance(tokenBalance);
    }
    fetchData();
    
  }, [connection, payToken, publicKey]);

 

  if (!pair) {
    return <p>Pair not loaded</p>;
  }

  
    return (
      <div className={props.className}>
        <div className="flex items-center justify-between text-sm ">
          <div className="font-medium text-white">You Pay</div>
          {publicKey && (
            <div
              className="flex flex-row space-x-1 font-medium text-white hover:cursor-pointer"
              onClick={() => setPayAmount(payTokenBalance!)}
            >
              <p>{payTokenBalance?.toFixed(3) ?? 0}</p>
              <p className="font-normal">{payToken}</p>
              <p className="text-zinc-400"> Balance</p>
            </div>
          )}
        </div>
        <TokenSelector
          className="mt-2"
          amount={payAmount}
          token={payToken}
          onChangeAmount={(e) => {
            console.log("token selector wrp on change", e);
            setPayAmount(e);
            setPositionAmount(e * leverage);
            setLastChanged(Input.Pay);
          }}
          onSelectToken={setPayToken}
          tokenList={POOL_CONFIG.tokens.map((token) => {
            return tokenAddressToTokenE(token.mintKey.toBase58());
          })}
        />
        <div className="mt-4 text-sm font-medium text-white">
          Your {props.side}
        </div>
        <TokenSelector
          className="mt-2"
          amount={positionAmount}
          token={positionToken}
          onChangeAmount={(e) => {
            setPayAmount(e / leverage);
            setPositionAmount(e);
            setLastChanged(Input.Position);
          }}
          onSelectToken={(token) => {
            setPositionToken(token);
            router.push("/trade/" + token + "-USD");
          }}
          tokenList={POOL_CONFIG.tokens.map((token) => {
            return tokenAddressToTokenE(token.mintKey.toBase58());
          })}
        />
        <div className="mt-4 text-xs text-zinc-400">Pool</div>
        {/* <PoolSelector
          className="mt-2"
          pool={pool}
          pools={PoolConfig.getAllPoolConfigs()}
        /> */}
        <LeverageSlider
          className="mt-6"
          value={leverage}
          onChange={(e) => {
            if (lastChanged === Input.Pay) {
              setPositionAmount(payAmount * e);
            } else {
              setPayAmount(positionAmount / e);
            }
            setLeverage(e);
          }}
        />
        <SolidButton className="mt-6 w-full" onClick={handleTrade}>
          Place Order
        </SolidButton>
        <TradeDetails
          className="mt-4"
          collateralToken={payToken}
          entryPrice={entryPrice}
          liquidationPrice={liquidationPrice}
          fees={entryFee}
        />
        <TradePositionDetails
          className={twMerge("-mb-4","-mx-4","bg-zinc-900","mt-4","pb-5","pt-4","px-4")}
          availableLiquidity={3871943.82}
          borrowFee={0.0052}
          entryPrice={16.4}
          exitPrice={16.4}
          token={positionToken}
          side={props.side}
        />
      </div>
    );
  
}
