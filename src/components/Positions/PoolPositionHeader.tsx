
import { PositionAccount } from "@/lib/PositionAccount";
import { DEFAULT_POOL } from "@/utils/constants";
import { PoolTokens } from "../PoolTokens";
import { PositionColumn } from "./PositionColumn";

interface Props {
  className?: string;
  token: string;
}

export default function PoolPositionHeader(props: Props) {
  return (
    <>
      <PositionColumn num={1}>
        <div className="flex max-w-fit items-center rounded-t bg-zinc-800 py-1.5 px-2">
          <PoolTokens tokens={[props.token]} />
          <div className="ml-1 text-sm font-medium text-white">
            {DEFAULT_POOL}
          </div>
        </div>
      </PositionColumn>
      <PositionColumn num={2}>Leverage</PositionColumn>
      <PositionColumn num={3}>Net Value</PositionColumn>
      <PositionColumn num={4}>Collateral</PositionColumn>
      <PositionColumn num={5}>Entry Price</PositionColumn>
      {/* <PositionColumn num={6}>Mark Price</PositionColumn> */}
      <PositionColumn num={6}>Liq. Price</PositionColumn>
    </>
  );
}
