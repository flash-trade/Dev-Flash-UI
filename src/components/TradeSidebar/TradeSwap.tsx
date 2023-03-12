import { useEffect, useState } from "react";

import { getTokenAddress, TokenE } from "@/utils/TokenUtils";

import { TokenSelector } from "../TokenSelector";
import { SolidButton } from "../SolidButton";
import { TradeSwapDetails } from "./TradeSwapDetails";
import { swap } from "src/actions/swap";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { BN } from "@project-serum/anchor";
import { CLUSTER, DEFAULT_POOL, getPerpetualProgramAndProvider } from "@/utils/constants";
import { ViewHelper } from "@/viewHelpers/index";
import { PoolConfig } from "@/utils/PoolConfig";
import { usePythPrices } from "@/hooks/usePythPrices";


interface Props {
  className?: string;
}

export function TradeSwap(props: Props) {
  const [payToken, setPayToken] = useState(TokenE.SOL);
  const [payAmount, setPayAmount] = useState(0.1);
  const [receiveToken, setReceiveToken] = useState(TokenE.USDC);
  const [receiveAmount, setReceiveAmount] = useState(0);

  const [swapFeeUSD, setSwapFeeUSD] = useState(0);

  const { prices } = usePythPrices()

  const { connection } = useConnection();
  const { publicKey, signTransaction, wallet } = useWallet();


  useEffect(() => {
    if(!payAmount || !payToken || !receiveToken ) {
      return;
    }
    (async () => {
      const payTokenPrice = prices.get(payToken) || 0;
      const receiveTokenPrice = prices.get(receiveToken) || 0;
      console.log("payTokenPrice, receiveTokenPrice:",payTokenPrice,receiveTokenPrice)
      // const conversionRatio = payTokenPrice / receiveTokenPrice;
      // const receiveAmount = payAmount * conversionRatio;
      // setReceiveAmount(receiveAmount);


      let { provider } = await getPerpetualProgramAndProvider(wallet as any);
      const View = new ViewHelper(connection, provider );
      const POOL_CONFIG = PoolConfig.fromIdsByName(DEFAULT_POOL, CLUSTER);

      const payTokenCustody = POOL_CONFIG.custodies.find(i => i.mintKey.toBase58()=== getTokenAddress(payToken));
      const receiveTokenCustody = POOL_CONFIG.custodies.find(i => i.mintKey.toBase58()=== getTokenAddress(receiveToken));

      const r = await View.getSwapAmountAndFees(new BN(payAmount * 10**(payTokenCustody?.decimals!)),POOL_CONFIG.poolAddress,payTokenCustody?.custodyAccount!, receiveTokenCustody?.custodyAccount!);
      console.log("getSwapAmountAndFees: ",r.amountOut.toNumber() ,r.feeIn.toNumber(), r.feeOut.toNumber());

      const receiveAmount = r.amountOut.toNumber() / 10**(receiveTokenCustody?.decimals!)
      setReceiveAmount(receiveAmount);

      const swapInFeeUSD = payTokenPrice * r.feeIn.toNumber() / 10**(payTokenCustody?.decimals!);
      const swapOutFeeUSD = receiveTokenPrice * r.feeOut.toNumber() / 10**(receiveTokenCustody?.decimals!)
      console.log("swapInFeeUSD, swapOutFeeUSD:",swapInFeeUSD,swapOutFeeUSD, payTokenCustody?.decimals, receiveTokenCustody?.decimals, payAmount * 10**(payTokenCustody?.decimals!))

      setSwapFeeUSD(swapInFeeUSD + swapOutFeeUSD);

    })()

  }, [payAmount, payToken, receiveToken]);

  // FIX: using two interdependent useEffects will create a infinite loop change
  // useEffect(() => {
  //   const payTokenPrice = allPriceStats[payToken]?.currentPrice || 0;
  //   const receiveTokenPrice = allPriceStats[receiveToken]?.currentPrice || 0;

  //   const conversionRatio = receiveTokenPrice / payTokenPrice;

  //   const payAmount = receiveAmount * conversionRatio;
  //   setPayAmount(payAmount);
  // }, [receiveAmount, payToken, receiveToken, allPriceStats]);



  async function handleSwap() {
    // TODO: need to take slippage as param , this is now for testing
    const newPrice = new BN(receiveAmount * 10 ** 6)
      .mul(new BN(90))
      .div(new BN(100));

    await swap(
      wallet,
      publicKey,
      signTransaction,
      connection,
      receiveToken,
      payToken,
      new BN(payAmount * 10 ** 9),
      newPrice
    );

  }

  return (
    <div className={props.className}>
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-white">You Pay</div>
      </div>
      <TokenSelector
        className="mt-2"
        amount={payAmount}
        token={payToken}
        onChangeAmount={setPayAmount}
        onSelectToken={setPayToken}
      />
      <div className="mt-4 text-sm font-medium text-white">You Receive</div>
      <TokenSelector
        className="mt-2"
        amount={receiveAmount}
        token={receiveToken}
        onChangeAmount={setReceiveAmount}
        onSelectToken={setReceiveToken}
      />
      <SolidButton className="mt-6 w-full" onClick={handleSwap}>
        Swap
      </SolidButton>
      <TradeSwapDetails
        availableLiquidity={3871943.82}
        className="mt-4"
        fees={swapFeeUSD}
        payToken={payToken}
        payTokenPrice={prices.get(payToken) || 0}
        receiveToken={receiveToken}
        receiveTokenPrice={prices.get(receiveToken) || 0}
      />
    </div>
  );
}
