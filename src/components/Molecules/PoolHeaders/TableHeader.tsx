import { PoolTokens } from "@/components/PoolTokens";
import { Pool } from "@/lib/PoolAccount";
import { tokenAddressToTokenE } from "@/utils/TokenUtils";
import { twMerge } from "tailwind-merge";

interface Props {
  iconClassName?: string;
  poolClassName?: string;
  pool: Pool;
}

export function TableHeader(props: Props) {
  return (
    <div className="flex flex-row space-x-1">
      {Object.keys(props.pool.tokens).length > 0 ? (
        <PoolTokens
          tokens={props.pool.tokenNames}
          className={props.iconClassName}
        />
      ) : (
        <div className={props.iconClassName}></div>
      )}
      <div>
        <p className={twMerge("font-medium", props.poolClassName)}>
          {props.pool.poolName}
        </p>
        <div className="flex flex-row text-xs font-medium text-zinc-500 ">
          <p>{tokenAddressToTokenE(Object.keys(props.pool.tokens)[0]!)}</p>

          {Object.keys(props.pool.tokens)
            .slice(1)
            .map((tokenMint) => (
              <p key={tokenMint.toString()}>
                , {tokenAddressToTokenE(tokenMint)}
              </p>
            ))}
        </div>
      </div>
    </div>
  );
}
