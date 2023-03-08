import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useState } from "react";

export function useTradeInfo() {
  const [data, setData] = useState({});

  const { publicKey, wallet } = useWallet();
  const { connection } = useConnection();

  const fetchData = async () => {
    if (!wallet) return;
    if (!publicKey) {
      return;
    }

  };

  useEffect(() => {
    fetchData();
  }, []);

  return { data };
}
