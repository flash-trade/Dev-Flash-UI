import { PositionRequest } from "@/hooks/usePositions";
import { Custody, Pool } from "@/types/index";
import { CLUSTER, DEFAULT_POOL } from "@/utils/constants";
import { PoolConfig } from "@/utils/PoolConfig";
import { Mint } from "@solana/spl-token";
import { create } from "zustand";
import { devtools } from "zustand/middleware";

interface StoreState {
  userPositions: PositionRequest;
  setUserPositions: (position: PositionRequest) => void;

  userLpTokens: Record<string, number>;
  setUserLpTokens: (lpTokens: Record<string, number>) => void;

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
    userPositions: {
      status: "pending",
    },
    setUserPositions: (position: PositionRequest) => set({ userPositions: position }),
    
    userLpTokens: {},
    setUserLpTokens: (lpTokens: Record<string, number>) =>
      set({ userLpTokens: lpTokens }),

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
