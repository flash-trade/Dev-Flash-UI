import { useGlobalStore } from '@/stores/store'
import React, { useMemo } from 'react'

export const useCustodies = (selectedToken) => {
  // const selectedPool = useGlobalStore(state => state.selectedPool);
  const custodies = useGlobalStore(state => state.custodies);

  return useMemo(() => {
    // const custodyAccounts = selectedPool.custodies.map(f => f.custodyAccount.toBase58())
    // return custodyAccounts.map(f => custodies.get(f))
  }, [selectedToken])
}

