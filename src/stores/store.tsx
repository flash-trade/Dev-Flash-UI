import { Custody, Pool, Position } from "@/types/index";
import { Mint } from "@solana/spl-token";
import { create } from "zustand";
import { devtools } from "zustand/middleware";

interface StoreState {
  positions: Map<string, Position>;
  setPositions: (positions: Map<string, Position>) => void;
  addPosition: (positionPk: string, position: Position) => void;
  removePosition: (positionPk: string) => void;


  // userLpTokens: Record<string, number>;
  // setUserLpTokens: (lpTokens: Record<string, number>) => void;

  poolData?: Pool;
  setPoolData: (pool: Pool) => void
  lpMintData?: Mint;
  setLpMintData: (mint: Mint) => void 

  custodies: Map<string, Custody>;
  setCustodies: (custodies: Map<string, Custody>) => void;
  addCustody: (custodyPk: string, custody: Custody) => void;
}

export const useGlobalStore = create<StoreState>()(
  devtools((set, _get) => ({
    devtools: false,
    positions: new Map<string, Position>(),
    setPositions: (positions: Map<string, Position>) => set({ positions }),
    addPosition: (positionPk: string, position: Position) => set((state) => {
      const positions = new Map<string, Position>(state.positions);
      positions.set(positionPk, position)
      return { positions: positions }
    }),
    removePosition: (positionPk: string) => set((state) => {
      let positions = new Map<string, Position>(state.positions);
      positions.delete(positionPk)
      return { positions: positions }
    }),
    
    // userLpTokens: {},
    // setUserLpTokens: (lpTokens: Record<string, number>) =>
    //   set({ userLpTokens: lpTokens }),

    poolData: undefined,
    setPoolData: (poolData: Pool) => set({ poolData }),
   
    lpMintData: undefined,
    setLpMintData: (lpMintData: Mint) => set({ lpMintData }),

    custodies: new Map<string, Custody>(),
    setCustodies: (custodies: Map<string, Custody>) => set({ custodies }),
    addCustody: (custodyPk: string, custody: Custody) => set((state) => {
      const custodies = new Map<string, Custody>(state.custodies);
      custodies.set(custodyPk, custody)
      return { custodies: custodies }
    }),

    
  }),
    {
      serialize: {
        options: {
          map: true
        }
      } as any
    }
  )
);
