import { PositionRequest } from "@/hooks/usePositions";
import { Custody, Pool } from "@/types/index";
import { CLUSTER, DEFAULT_POOL } from "@/utils/constants";
import { PoolConfig } from "@/utils/PoolConfig";
import { create } from "zustand";
import { devtools } from "zustand/middleware";

interface StoreState {
  userPositions: PositionRequest;
  setUserPositions: (position: PositionRequest) => void;

  userLpTokens: Record<string, number>;
  setUserLpTokens: (lpTokens: Record<string, number>) => void;

  // pools: Map<string, Pool>;
  // setPool: (custodies: Map<string, Pool>) => void;
  // addPool: (custody: Pool) => void;

  // selectedPool: PoolConfig;
  // setSelectedPool: (pool: PoolConfig) => void;

  custodies: Map<string, Custody>;
  setCustodies: (custodies: Map<string, Custody>) => void;
  addCustody: (custody: Custody) => void;
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

    // pools: new Map<string, Pool>(),
    // setPool: (pools: Map<string, Pool>) => set({ pools }),
    // addPool: (pool: Pool) => set((state) => {
    //   const pools = new Map<string, Pool>(state.pools);
    //   pools.set(pool.name, pool)
    //   return { pools: pools }
    // }),

    // selectedPool: PoolConfig.fromIdsByName(DEFAULT_POOL, CLUSTER),
    // setSelectedPool: (pool: PoolConfig) => set({ selectedPool: pool })

    custodies: new Map<string, Custody>(),
    setCustodies: (custodies: Map<string, Custody>) => set({ custodies }),
    addCustody: (custody: Custody) => set((state) => {
      const custodies = new Map<string, Custody>(state.custodies);
      custodies.set(custody.mint.toBase58(), custody)
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
