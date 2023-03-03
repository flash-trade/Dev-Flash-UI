import { PoolTokens } from "@/components/PoolTokens";
import { tokenAddressToTokenE } from "@/utils/TokenUtils";
import { twMerge } from "tailwind-merge";
import { ACCOUNT_URL } from "@/utils/TransactionHandlers";
import NewTab from "@carbon/icons-react/lib/NewTab";
import { POOL_CONFIG } from "@/utils/constants";

interface Props {
  className?: string;
  iconClassName?: string;
}

export function TitleHeader(props: Props) {
  return (
    <div className={twMerge("flex", "flex-col", "space-x-1", props.className)}>
      <div className="flex flex-row items-center">
        <PoolTokens
          tokens={POOL_CONFIG.tokens.map(i => i.symbol)}
          className={props.iconClassName}
        />
        <p className={twMerge("font-medium", "text-2xl")}>
          {POOL_CONFIG.poolName}
        </p>
        <a
          target="_blank"
          rel="noreferrer"
          href={`${ACCOUNT_URL(POOL_CONFIG.poolAddress.toString())}`}
        >
          <NewTab />
        </a>
      </div>
      <div className="text-s mt-3 flex flex-row font-medium text-zinc-500">
        <p>{tokenAddressToTokenE(POOL_CONFIG.tokens[0]!.mintKey.toBase58())}</p>

        {POOL_CONFIG.tokens
          .slice(1)
          .map((token) => (
            <p key={token.mintKey.toBase58()}>, {tokenAddressToTokenE(token.mintKey.toBase58())}</p>
          ))}
      </div>
    </div>
  );
}
