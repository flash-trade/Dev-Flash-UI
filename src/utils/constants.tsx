import { Cluster, Keypair, PublicKey, Transaction } from "@solana/web3.js";
import { Program } from "@project-serum/anchor";

import { IDL as PERPETUALS_IDL } from "@/target/types/perpetuals";
// import * as PerpetualsJson from "@/target/idl/perpetuals.json";
import { getProvider } from "@/utils/provider";
import { findProgramAddressSync } from "@project-serum/anchor/dist/cjs/utils/pubkey";
import NodeWallet from "@project-serum/anchor/dist/cjs/nodewallet";
import { Wallet } from "@project-serum/anchor/dist/cjs/provider";
import { AnchorWallet } from "@solana/wallet-adapter-react";
import { PoolConfig } from "./PoolConfig";

export const PERCENTAGE_DECIMALS = 4; // stableCoinPercentage
export const RATE_DECIMALS = 9; // borow rate 
export const PRICE_DECIMALS = 6; // 
export const USD_DECIMALS = 6; // 
export const BPS_DECIMALS = 4; // 


export const RPC_URL: string = process.env.NEXT_PUBLIC_RPC_URL || 'https://api.devnet.solana.com';
export const CLUSTER: Cluster = process.env.NEXT_CLUSTER as Cluster || 'devnet';
export const DEFAULT_POOL: string = process.env.NEXT_DEFAULT_POOL || 'FlashPool2';

console.log("RPC_URL:",RPC_URL);
console.log("CLUSTER:",CLUSTER);
console.log("DEFAULT_POOL:",DEFAULT_POOL);

export const POOL_CONFIG = PoolConfig.fromIdsByName(DEFAULT_POOL, CLUSTER);

export const PERPETUALS_PROGRAM_ID = new PublicKey(POOL_CONFIG.programId);
export const SOL_MINT_ADDRESS =  POOL_CONFIG.tokens.find(i => i.symbol=='SOL')?.mintKey?.toBase58() ?? "NOT_FOUND_IN_CONFIG";
export const USDC_MINT_ADDRESS = POOL_CONFIG.tokens.find(i => i.symbol=='USDC')?.mintKey?.toBase58() ?? "NOT_FOUND_IN_CONFIG";
export const BTC_MINT_ADDRESS = POOL_CONFIG.tokens.find(i => i.symbol=='BTC')?.mintKey?.toBase58() ?? "NOT_FOUND_IN_CONFIG";
export const ETH_MINT_ADDRESS = POOL_CONFIG.tokens.find(i => i.symbol=='ETH')?.mintKey?.toBase58() ?? "NOT_FOUND_IN_CONFIG";

// export const PERPETUALS_PROGRAM_ID = new PublicKey(
//   PerpetualsJson["metadata"]["address"]
// );


export class DefaultWallet implements Wallet {
  constructor(readonly payer: Keypair) {}

  static local(): NodeWallet | never {
    throw new Error("Local wallet not supported");
  }

  async signTransaction(tx: Transaction): Promise<Transaction> {
    return tx;
  }

  async signAllTransactions(txs: Transaction[]): Promise<Transaction[]> {
    return txs;
  }

  get publicKey(): PublicKey {
    return this.payer.publicKey;
  }
}

export async function getPerpetualProgramAndProvider(wallet?: AnchorWallet) {
  let provider;

  if (wallet) {
    provider = await getProvider(wallet);
  } else {
    provider = await getProvider(new DefaultWallet(DEFAULT_PERPS_USER));
  }
  let perpetual_program = new Program(
    PERPETUALS_IDL,
    PERPETUALS_PROGRAM_ID,
    provider
  );

  return { perpetual_program, provider };
}

export const transferAuthorityAddress = findProgramAddressSync(
  [Buffer.from("transfer_authority")],
  PERPETUALS_PROGRAM_ID
)[0];

export const perpetualsAddress = findProgramAddressSync(
  [Buffer.from("perpetuals")],
  PERPETUALS_PROGRAM_ID
)[0];

// default user to launch show basic pool data, etc
export const DEFAULT_PERPS_USER = Keypair.fromSecretKey(
  Uint8Array.from([
    130, 82, 70, 109, 220, 141, 128, 34, 238, 5, 80, 156, 116, 150, 24, 45, 33,
    132, 119, 244, 40, 40, 201, 182, 195, 179, 90, 172, 51, 27, 110, 208, 61,
    23, 43, 217, 131, 209, 127, 113, 93, 139, 35, 156, 34, 16, 94, 236, 175,
    232, 174, 79, 209, 223, 86, 131, 148, 188, 126, 217, 19, 248, 236, 107,
  ])
);
