import { useDailyPriceStats } from "@/hooks/useDailyPriceStats";
import { getTokenEIcon, getTokenELabel, tokenAddressToTokenE, getSymbol , getTokenSymbol} from "@/utils/TokenUtils";
import { cloneElement, useEffect, useState } from "react";
import { twMerge } from "tailwind-merge";
import { ACCOUNT_URL } from "@/utils/TransactionHandlers";
import NewTab from "@carbon/icons-react/lib/NewTab";
import { getPerpetualProgramAndProvider, PERCENTAGE_DECIMALS, POOL_CONFIG } from "@/utils/constants";
import { usePoolData } from "@/hooks/usePoolData";
import { usePythPrices } from "@/hooks/usePythPrices";
import { toUiDecimals } from "@/utils/displayUtils";
import { useGlobalStore } from "@/stores/store";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { ViewHelper } from "@/viewHelpers/index";
import { BN } from "@project-serum/anchor";

interface Props {
  className?: string;
}

interface PoolFeeData {
  symbol : string,
  addAmount : BN,
  addFee : BN,
  removeAmount : BN,
  removeFee :BN,
}


export default function SinglePoolTokens(_props: Props) {
  const stats = useDailyPriceStats();
  const { prices } = usePythPrices();

  const poolData = usePoolData();
  const { publicKey, signTransaction, wallet } = useWallet();
  const { connection } = useConnection();

  const inputTokenAmtGlobal = useGlobalStore(state => state.inputTokenAmt);
  const inputLPTokenAmtGlobal = useGlobalStore(state => state.inputLPTokenAmt);

  const [poolFeesObj, setPoolFeesObj] = useState<PoolFeeData[]>([])

  useEffect(() => {
    (async () => {

      if(!inputTokenAmtGlobal || !inputLPTokenAmtGlobal) {
        return;
      }
      const poolFees:any = [];
      for (const token of POOL_CONFIG.tokens) {
        let { provider } = await getPerpetualProgramAndProvider(wallet as any);
        const View = new ViewHelper(connection, provider );
        const positionTokenCustody = POOL_CONFIG.custodies.find(i => i.symbol=== token.symbol);
       
        console.log("positionTokenCustody :",positionTokenCustody?.symbol, positionTokenCustody, inputTokenAmtGlobal, inputLPTokenAmtGlobal )
        const addObj = await View.getAddLiquidityAmountAndFee( new BN(inputTokenAmtGlobal * 10**(positionTokenCustody?.decimals!)), POOL_CONFIG.poolAddress, positionTokenCustody?.custodyAccount!)
        console.log('addObj :>> ', addObj);

        const removeObj = await View.getRemoveLiquidityAmountAndFee( new BN(inputLPTokenAmtGlobal * 10**(positionTokenCustody?.decimals!)), POOL_CONFIG.poolAddress, positionTokenCustody?.custodyAccount!)
        console.log('removeObj :>> ', removeObj);

        const obj : PoolFeeData = {
          symbol : positionTokenCustody?.symbol!,
          addAmount : addObj.amount,
          addFee : addObj.fee,
          removeAmount : removeObj.amount,
          removeFee : removeObj.fee
        }
        poolFees.push(obj);
      }
      setPoolFeesObj(poolFees)

    })()
  }, [inputTokenAmtGlobal, inputLPTokenAmtGlobal])
  

  if (Object.keys(stats).length === 0) {
    return <>Loading stats</>;
  } else {
    return (
      <div className="w-full ">
        <div className="bg-zinc-900 p-8">
          <table className={twMerge("table-auto", "text-white", "w-full")}>
            <thead className={twMerge("text-xs", "text-zinc-500", "p-10")}>
              <tr className="">
                <td className="pb-5 text-white">Pool Tokens</td>
                <td className="pb-5">Deposit Fee</td>
                <td className="pb-5">Withdraw Fee</td>

                <td className="pb-5">Liquidity</td>
                <td className="pb-5">Price</td>
                <td className="pb-5">Amount</td>
                <td className="pb-5">Current/Target Weight</td>
                <td className="pb-5">Utilization</td>
                <td className="pb-5"></td>
              </tr>
            </thead>
            <tbody className={twMerge("text-xs")}>
              {POOL_CONFIG.custodies.map((custody, index) => {
                const token = tokenAddressToTokenE(custody.mintKey.toBase58());
                const icon = getTokenEIcon(token);
                return (
                  <tr key={custody.mintKey.toBase58()} className="border-t border-zinc-700">
                    <td className="py-4">
                      <div className="flex flex-row items-center space-x-1">
                        {cloneElement(icon, {
                          className: "h-10 w-10",
                        })}
                        <div className="flex flex-col">
                          <p className="font-medium">
                            {tokenAddressToTokenE(custody.mintKey.toBase58())}
                          </p>
                          <p className={twMerge("text-xs", "text-zinc-500")}>
                            {getTokenELabel(token)}
                          </p>
                        </div>
                        <a
                          target="_blank"
                          rel="noreferrer"
                          href={`${ACCOUNT_URL(
                            custody.custodyAccount.toBase58()
                          )}`}
                        >
                          <NewTab />
                        </a>
                      </div>
                    </td>

                    <td> {poolFeesObj && poolFeesObj.length ? toUiDecimals(poolFeesObj[index]!.addFee, custody.decimals,4): 0 }  </td>

                    <td> {poolFeesObj && poolFeesObj.length ? toUiDecimals(poolFeesObj[index]!.removeFee, custody.decimals,4) : 0 }  </td>


                    <td> ${  poolData.custodyDetails.find(i => i.symbol== getTokenSymbol(token))?.totalUsdAmountUi ?? 0 } </td>

                    <td> ${prices.get(token)?.toFixed(2)}</td>

                    <td>
                      {
                        poolData.custodyDetails.find(i => i.symbol== getTokenSymbol(token))?.assetsAmountUi ?? 0
                      }
                    </td>

                    <td>
                    { toUiDecimals(poolData.custodyDetails.find(i => i.symbol== getTokenSymbol(token))?.currentWeight!, PERCENTAGE_DECIMALS -2 , 2) ?? 0 }%
                      {" "}/{" "}
                    { toUiDecimals(poolData.custodyDetails.find(i => i.symbol== getTokenSymbol(token))?.targetWeight!, PERCENTAGE_DECIMALS -2 , 2 ) ?? 0 }%
                    </td>
                    <td>
                    { poolData.custodyDetails.find(i => i.symbol== getTokenSymbol(token))?.utilization.toString() ?? 0 }%
                    </td>
                    <td>
                      <a
                        target="_blank"
                        rel="noreferrer"
                        href={`${ACCOUNT_URL(
                          custody.custodyAccount.toString()
                        )}`}
                      >
                        <NewTab />
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
}
