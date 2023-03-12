import { CLUSTER, DEFAULT_POOL, POOL_CONFIG } from '@/utils/constants';
import { PoolConfig } from '@/utils/PoolConfig';
import { getPythProgramKeyForCluster, PriceStatus, PythConnection, PythHttpClient } from '@pythnetwork/client';
import { useConnection } from '@solana/wallet-adapter-react'
import { useEffect, useState } from 'react'

export function usePythPrices() {
  const { connection } = useConnection();

  const [prices, setPrices] = useState(new Map<string, number>())

  const tokens = POOL_CONFIG.tokens;

  const fetchPrices = async () => {
    if (!connection) return;

    const pythClient = new PythHttpClient(connection, getPythProgramKeyForCluster(CLUSTER));
    const data = await pythClient.getData();
    // console.log('pyth bulk data :>> ', data);

    const prices = new Map<string, number>()

    for (let token of tokens) {
      const price = data.productPrice.get(token.pythTicker);
      prices.set(token.symbol, price?.aggregate.price!)
    }
    setPrices(prices)
  }

  useEffect(() => {
    const pythConnection = new PythConnection(connection, getPythProgramKeyForCluster('devnet'))

    if (connection) {
      pythConnection.onPriceChange((product, price) => {
        console.log('price.price ::: ', price.price)
        tokens.forEach((value) => {
          if (value.pythTicker === product.symbol && prices.get(value.symbol) !== price.price) {
            const newPrices = new Map<string, number>(prices);
            newPrices.set(value.symbol, price.price ?? 0)
          }
        })
      })
    }
    fetchPrices();

    // return () => { pythConnection.stop() }
  }, [connection])

  return { prices }
}


   // pythConnection.onPriceChange((product, price) => {
    //   // sample output:
    //   // Crypto.SRM/USD: $8.68725 ±$0.0131 Status: Trading
    //   console.log(`${product.symbol}: $${price.price} \xB1$${price.confidence} Status: ${PriceStatus[price.status]}`)
    // })

    // // Start listening for price change events.
    // pythConnection.start()

    // return () => {
    //   pythConnection.stop()
    // }