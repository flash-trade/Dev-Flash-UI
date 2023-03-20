import CloseIcon from "@carbon/icons-react/lib/Close";
import EditIcon from "@carbon/icons-react/lib/Edit";
import { BN } from "@project-serum/anchor";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { format } from "date-fns";
import { closePosition } from "src/actions/closePosition";
import { twMerge } from "tailwind-merge";
import { PositionValueDelta } from "./PositionValueDelta";
import { SolidButton } from "../SolidButton";
import { usePositions } from "@/hooks/usePositions";
import { PositionAccount } from "@/lib/PositionAccount";
import { asTokenE } from "@/utils/TokenUtils";
import { usePythPrices } from "@/hooks/usePythPrices";
import { sleep } from "@/utils/TransactionHandlers";
import { PRICE_DECIMALS } from "@/utils/constants";

function formatPrice(num: number) {
  const formatter = new Intl.NumberFormat("en", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });
  return formatter.format(num);
}

interface Props {
  className?: string;
  position: PositionAccount;
}

export function PositionAdditionalInfo(props: Props) {
  const { publicKey, signTransaction, wallet } = useWallet();
  const { connection } = useConnection();
  const { prices } = usePythPrices()

  let payToken =  asTokenE(props.position.custodyConfig.symbol);
  let positionToken =asTokenE(props.position.custodyConfig.symbol);
  const { fetchPositions } = usePositions();

  async function handleCloseTrade() {
    console.log(">>> in close trade");
    await closePosition(
      wallet!,
      publicKey,
      signTransaction,
      connection,
      payToken,
      positionToken,
      props.position.publicKey.toBase58(),
      props.position.side,
      new BN((prices.get(payToken) ?? 0) * 10 ** PRICE_DECIMALS)
    );
    // fetch and add to store
    console.log("sleep 5sec")
    await sleep(5000);
    console.log("after sleep calling fetchPositions")
    fetchPositions();
  }

  return (
    <div
      className={twMerge(
        "overflow-hidden",
        "grid",
        "grid-cols-[12%,1fr,1fr,max-content]",
        "gap-x-8",
        "items-center",
        "pr-4",
        props.className
      )}
    >
      <div />
      <div
        className={twMerge(
          "bg-zinc-900",
          "gap-x-8",
          "grid-cols-[max-content,1fr,1fr,1fr]",
          "grid",
          "h-20",
          "items-center",
          "px-3",
          "rounded",
          "w-full"
        )}
      >
        <div>
          <div className="text-xs text-zinc-500">Time</div>
          <div className="mt-1 text-sm text-white">
            {format(props.position.openTime.toNumber(), "d MMM yyyy • p")}
          </div>
        </div>
        <div>
          <div className="text-xs text-zinc-500">PnL</div>
          <PositionValueDelta
            className="mt-0.5"
            valueDelta={props.position.pnlUsd.toNumber()/ 10**6}
            valueDeltaPercentage={ (1 - (props.position.collateralUsd.toNumber() / props.position.collateralUsd.toNumber()))*100 }
            formatValueDelta={formatPrice}
          />
        </div>
        <div>
          <div className="text-xs text-zinc-500">Size</div>
          <div className="mt-1 flex items-center">
            <div className="text-sm text-white">
              ${formatPrice(props.position.sizeUsd.toNumber()/ 10**6 )}
            </div>
            <button className="group ml-2">
              <EditIcon
                className={twMerge(
                  "fill-zinc-500",
                  "h-4",
                  "transition-colors",
                  "w-4",
                  "group-hover:fill-white"
                )}
              />
            </button>
          </div>
        </div>
        <div>
          <div className="text-xs text-zinc-500">Liq. Threshold</div>
          <div className="mt-1 text-sm text-white">
            ${formatPrice(props.position.liquidationPriceUsd.toNumber() / 10**6)}
          </div>
        </div>
      </div>
      <SolidButton className="h-9 w-36" onClick={handleCloseTrade}>
        <CloseIcon className="mr-2 h-4 w-4" />
        <div>Close Position</div>
      </SolidButton>
    </div>
  );
}
