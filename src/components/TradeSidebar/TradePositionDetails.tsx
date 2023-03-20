import { cloneElement } from "react";
import { twMerge } from "tailwind-merge";

import { TokenE, getTokenEIcon } from "@/utils/TokenUtils";
import { isVariant, Side } from "@/types/index";

function formatPrice(num: number) {
  const formatter = Intl.NumberFormat("en", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });
  return formatter.format(num);
}

function formatFees(num: number) {
  const formatter = Intl.NumberFormat("en", {
    maximumFractionDigits: 4,
    minimumFractionDigits: 2,
  });
  return formatter.format(num);
}

interface Props {
  availableLiquidity: number;
  openInterest : number;
  borrowRate: number;
  className?: string;
  entryPrice: number;
  exitPrice: number;
  token: TokenE;
  Side: Side;
}

export function TradePositionDetails(props: Props) {
  const icon = getTokenEIcon(props.token);

  return (
    <div className={props.className}>
      <header className="mb-4 flex items-center">
        <div className="text-sm font-medium text-white">{isVariant(props.Side, 'long') ? 'Long' : 'Short'}</div>
        {cloneElement(icon, {
          className: twMerge(icon.props.className, "h-4", "ml-1.5", "w-4"),
        })}
        <div className="ml-0.5 text-sm font-semibold text-white">
          {props.token}
        </div>
      </header>
      <div className="grid grid-cols-2 gap-4">
        {[
          {
            label: "Entry Price",
            value: `$${formatPrice(props.entryPrice)}`,
          },
          {
            label: "Exit Price",
            value: `$${formatPrice(props.exitPrice)}`,
          },
          {
            label: "Borrow rate",
            value: (
              <>
                {`${formatFees(props.borrowRate)}% `}
                <span className="text-zinc-500"> </span>
              </>
            ),
          },
          {
            label: "Available Liquidity",
            value: `$${formatPrice(props.availableLiquidity)}`,
          },
        ].map(({ label, value }, i) => (
          <div
            className={twMerge(
              "border-zinc-700",
              i < 2 && "pb-4",
              i < 2 && "border-b"
            )}
            key={i}
          >
            <div className="text-sm text-zinc-400">{label}</div>
            <div className="text-sm text-white">{value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
