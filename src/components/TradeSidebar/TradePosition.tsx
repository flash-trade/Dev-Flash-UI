import { useEffect, useState } from "react";
import { twMerge } from "tailwind-merge";

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

import { fetchTokenBalance } from "@/utils/retrieveData";

import { usePositions } from "@/hooks/usePositions";
import { getPerpetualProgramAndProvider, POOL_CONFIG, PRICE_DECIMALS, RATE_DECIMALS } from "@/utils/constants";
import {  ViewHelper } from "@/viewHelpers/index";
import { isVariant, Side } from "@/types/index";
import { useGlobalStore } from "@/stores/store";
import { usePythPrices } from "@/hooks/usePythPrices";
import { sleep } from "@/utils/TransactionHandlers";

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
  const [leverage, setLeverage] = useState(1);

  const [payAmount, setPayAmount] = useState(0.1);
  const [positionAmount, setPositionAmount] = useState(0.2);

  const [entryPrice, setEntryPrice] = useState(0)
  const [exitPrice, setExitPrice] = useState(0)
  const [entryFee, setEntryFee] = useState(0)
  const [liquidationPrice, setLiquidationPrice] = useState(0)
  const [borrowRate, setBorrowRate] = useState(0);
  const [availableLiquidity, setAvailableLiquidity] = useState(0);
  const [openInterest, setOpenInterest] = useState(0)

  const [lastChanged, setLastChanged] = useState<Input>(Input.Pay);


  const { publicKey, signTransaction, wallet } = useWallet();
  const { connection } = useConnection();

  const custodies = useGlobalStore(state => state.custodies);

  const { fetchPositions } = usePositions();

  const { prices } = usePythPrices();

  const router = useRouter();

  const { pair } = router.query;


  useEffect(() => {
    // (async () => {
    const positionTokenCustody = POOL_CONFIG.custodies.find(i => i.mintKey.toBase58()=== getTokenAddress(positionToken));
    
    const positionTokenCustodyData = custodies.get(positionTokenCustody?.custodyAccount.toBase58()!);
    if(positionTokenCustodyData!== undefined && positionTokenCustody){
      // console.log("borow rate:",positionTokenCustodyData.borrowRateState.currentRate.toNumber())
      setBorrowRate(positionTokenCustodyData.borrowRateState.currentRate.toNumber()/ 10**(RATE_DECIMALS-2))
      const currentLongUSD = positionTokenCustodyData.longPositions.sizeUsd.toNumber() / 10**RATE_DECIMALS;
      const positiontokenPrice = prices.get(positionToken) || 0;
      const maxLongCapacity = positiontokenPrice * positionTokenCustodyData.assets.owned.toNumber() / 10**(positionTokenCustody?.decimals!)
      setOpenInterest(currentLongUSD)
      setAvailableLiquidity(maxLongCapacity - currentLongUSD)
    }

    // })()
  }, [custodies, positionToken])

  useEffect(() => {
  
   ( async ()  => {
    if(!positionAmount || !positionToken) {
      return;
    }

    let { provider } = await getPerpetualProgramAndProvider(wallet as any);
    const View = new ViewHelper(connection, provider );
    const positionTokenCustody = POOL_CONFIG.custodies.find(i => i.mintKey.toBase58()=== getTokenAddress(positionToken));
   
    // console.log("passing :",payAmount, positionAmount)
    //  const entryPrice = allPriceStats[positionToken]?.currentPrice * payAmount || 0;
    const r = await View.getEntryPriceAndFee( new BN(payAmount * 10**(positionTokenCustody?.decimals!)), new BN(positionAmount * 10**(positionTokenCustody?.decimals!)) ,props.side , POOL_CONFIG.poolAddress, positionTokenCustody?.custodyAccount!)
    // console.log('getEntryPriceAndFee :>> ', r);
    // console.log("getEntryPriceAndFee, setEntryFee: ",r.price.toNumber(), r.fee.toNumber());
    const price = r.price.toNumber()/ 10**6; 
    setEntryPrice(price);
    setEntryFee( price* r.fee.toNumber()/ 10**((positionTokenCustody?.decimals!)))

     const oraclePrice = prices.get(positionToken)  || 0; // chnage to oracle
    const emaPrice = await View.getOraclePrice( POOL_CONFIG.poolAddress, true, positionTokenCustody?.custodyAccount!)
    // console.log("getOraclePrice, emaPrice: ",oraclePrice,emaPrice.toNumber()/10**6)
    if(isVariant(props.side, 'long')){ //long
      const min = Math.min(oraclePrice,emaPrice.toNumber()/10**6)
      setExitPrice(min)
    } else {
      const max = Math.max(oraclePrice,emaPrice.toNumber()/10**6)
      setExitPrice(max)
    }

    })()
   
  }, [ positionAmount,  props.side , wallet ,positionToken ]) //payAmount - already changes with positionAmount
  

  useEffect(() => {
    // console.log("leverage:",leverage)
    let liquidationPrice = (entryPrice) * leverage;
    setLiquidationPrice(liquidationPrice);
  }, [leverage, entryPrice])
  

  useEffect(() => {
    // pair = BTC-USDC
    const tokenSymbol = pair!.split("-")[0];
    setPositionToken(asTokenE(tokenSymbol));
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

  async function handleTrade() {

    const positionTokenCustody = POOL_CONFIG.custodies.find(i => i.mintKey.toBase58()=== getTokenAddress(positionToken));

    await openPosition(
      wallet!,
      publicKey,
      signTransaction,
      connection,
      payToken,
      positionToken,
      new BN(payAmount * 10**(positionTokenCustody?.decimals!)),
      new BN(positionAmount * 10**(positionTokenCustody?.decimals!)),
      new BN((prices.get(payToken) ?? 0) * 10 ** PRICE_DECIMALS),
      props.side
    );
    // fetch and add to store
    console.log("sleep 5sec")
    await sleep(5000)
    console.log("after sleep calling fetchPositions")
    fetchPositions();
  }

  
 

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
          You 
          {isVariant(props.side, 'long') ? "Long" : "Short"}
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
          tokenList={POOL_CONFIG.tokens.filter(x => !x.isStable).map((token) => {
            return tokenAddressToTokenE(token.mintKey.toBase58());
          }) }
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
          availableLiquidity={availableLiquidity}
          openInterest={openInterest}
          borrowRate={borrowRate}
          entryPrice={entryPrice}
          exitPrice={exitPrice}
          token={positionToken}
          Side={props.side}
        />
      </div>
    );
  
}
