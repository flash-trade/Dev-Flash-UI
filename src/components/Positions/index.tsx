// import { LoadingDots } from "../LoadingDots";
import { ExistingPosition } from "./ExistingPosition";
import { NoPositions } from "./NoPositions";

interface Props {
  className?: string;
}

export function Positions(props: Props) {
  // POOLCONFIG.getPools()

  return (
    <div className={props.className}>
      <header className="mb-5 flex items-center space-x-4">
        <div className="font-medium text-white">My Positions</div>
      
      </header>
      {/* LOOP on POOLS */}
      {/* {positionAccounts.length &&
        positionAccounts.map((pos, index) => ( */}
          <ExistingPosition />
        {/* ))} */}

      {/* {positionAccounts.length == 0 && <NoPositions />} */}
    </div>
  );
}
