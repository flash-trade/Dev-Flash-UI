import { useDailyPriceStats } from "@/hooks/useDailyPriceStats";
import { getTokenEIcon, getTokenELabel, tokenAddressToTokenE, getSymbol , getTokenSymbol} from "@/utils/TokenUtils";
import { cloneElement } from "react";
import { twMerge } from "tailwind-merge";
import { ACCOUNT_URL } from "@/utils/TransactionHandlers";
import NewTab from "@carbon/icons-react/lib/NewTab";
import { PERCENTAGE_DECIMALS, POOL_CONFIG } from "@/utils/constants";
import { usePoolData } from "@/hooks/usePoolData";
import { usePythPrices } from "@/hooks/usePythPrices";
import { toUiDecimals } from "@/utils/displayUtils";

interface Props {
  className?: string;
}


export default function SinglePoolTokens(_props: Props) {
  const stats = useDailyPriceStats();
  const { prices } = usePythPrices();

  const poolData = usePoolData();

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
                <td className="pb-5">Liquidity</td>
                <td className="pb-5">Price</td>
                <td className="pb-5">Amount</td>
                <td className="pb-5">Current/Target Weight</td>
                <td className="pb-5">Utilization</td>
                <td className="pb-5"></td>
              </tr>
            </thead>
            <tbody className={twMerge("text-xs")}>
              {POOL_CONFIG.custodies.map((custody) => {
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

                    <td>2% (todo)</td>

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
