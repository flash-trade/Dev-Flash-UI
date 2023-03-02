import { PoolTokens } from "@/components/PoolTokens";
import { tokenAddressToTokenE } from "@/utils/TokenUtils";
import { twMerge } from "tailwind-merge";
import { ACCOUNT_URL } from "@/utils/TransactionHandlers";
import NewTab from "@carbon/icons-react/lib/NewTab";
import { PoolAccount } from "@/lib/PoolAccount";

interface Props {
  className?: string;
  iconClassName?: string;
  poolClassName?: string;
  pool: PoolAccount;
}

export function TitleHeader(props: Props) {
  return (
    <div className={twMerge("flex", "flex-col", "space-x-1", props.className)}>
      <div className="flex flex-row items-center">
        <PoolTokens
          tokens={props.pool.tokenNames}
          className={props.iconClassName}
        />
        <p className={twMerge("font-medium", "text-2xl")}>
          {props.pool.poolName}
        </p>
        <a
          target="_blank"
          rel="noreferrer"
          href={`${ACCOUNT_URL(props.pool.poolAddress.toString())}`}
        >
          <NewTab />
        </a>
      </div>
      <div className="text-s mt-3 flex flex-row font-medium text-zinc-500">
        <p>{tokenAddressToTokenE(Object.keys(props.pool.tokens)[0]!)}</p>

        {Object.keys(props.pool.tokens)
          .slice(1)
          .map((tokenMint) => (
            <p key={tokenMint.toString()}>, {tokenAddressToTokenE(tokenMint)}</p>
          ))}
      </div>
    </div>
  );
}
