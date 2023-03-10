import { CLUSTER, POOL_CONFIG } from '@/utils/constants';
import { getPythProgramKeyForCluster, PriceStatus, PythConnection, PythHttpClient } from '@pythnetwork/client';
import { useConnection } from '@solana/wallet-adapter-react'
import  { useEffect, useState } from 'react'

export function usePythPrices()  {
  const { connection } = useConnection();

  const [prices, setPrices] = useState(new Map<string,number>())


  const fetchPrices = async () => {
    if (!connection ) return;

    const tokens = POOL_CONFIG.tokens;
    const pythClient = new PythHttpClient(connection, getPythProgramKeyForCluster(CLUSTER));
    const data = await pythClient.getData();
    // console.log('pyth bulk data :>> ', data);

    const prices = new Map<string, number>()

    for (let token of tokens) {
      const price = data.productPrice.get(token.pythTicker);
      prices.set(token.symbol, price?.aggregate.price!)
    }
    console.log("prices:",prices)
    setPrices(prices)
  } 

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(() => {
      console.log("prices timer ")
      fetchPrices()
      }, 30000);
      return () => clearInterval(interval);
  }, [connection])


  return {prices}
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