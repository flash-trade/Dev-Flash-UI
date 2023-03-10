import { usePositions } from "@/hooks/usePositions";
import { PositionAccount } from "@/lib/PositionAccount";
import { twMerge } from "tailwind-merge";
import PoolPositionHeader from "./PoolPositionHeader";
import { SinglePosition as PoolPositionRow } from "./PoolPositionRow";

interface Props {
  className?: string;
}

export function ExistingPosition(props: Props) {

  const { positionAccounts } = usePositions();
  
  return (
    <div className="mb-4">
      <div
        className={twMerge(
          "border-b",
          "border-zinc-700",
          "flex",
          "items-center",
          "text-xs",
          "text-zinc-500"
        )}
      >
        {/* We cannot use a real grid layout here since we have nested grids.
                Instead, we're going to fake a grid by assinging column widths to
                percentages. */}
        <PoolPositionHeader token={"SOL"} />
      </div>
      {positionAccounts.map((position, index) => (
        <PoolPositionRow
          className={twMerge(
            "border-zinc-700",
            index < positionAccounts.length - 1 && "border-b"
          )}
          position={position}
          key={index}
        />
      ))}
    </div>
  );
}
