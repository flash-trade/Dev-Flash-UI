import { SolanaIconCircle } from "@/components/Icons/SolanaIconCircle";
import { UsdcIconCircle } from "@/components/Icons/UsdcIconCircle";
import { BitcoinIconCircle } from "@/components/Icons/BitcoinIconCircle";
import { EthereumIconCircle } from "@/components/Icons/EthereumIconCircle";
import { BTC_MINT_ADDRESS, ETH_MINT_ADDRESS, SOL_MINT_ADDRESS, USDC_MINT_ADDRESS } from "./constants";


//  inside CONST FILE 
// export const SOL_MINT_ADDRESS =  POOL_CONFIG "";
// export const USDC_MINT_ADDRESS = "";
// export const BTC_MINT_ADDRESS = "";
// export const ETH_MINT_ADDRESS = "";

//rename to TokenE
export enum TokenE {
  SOL = "SOL",
  USDC = "USDC",
  BTC = "BTC",
  ETH = "ETH",
}
export const TOKEN_LIST = [
  TokenE.SOL,
  TokenE.USDC,
  TokenE.BTC,
  TokenE.ETH,
];

export function asTokenE(tokenStr: string): TokenE {
  switch (tokenStr) {
    case "SOL":
      return TokenE.SOL;
    case "USDC":
      return TokenE.USDC;
    case "BTC":
      return TokenE.BTC; 
    case "ETH":
      return TokenE.ETH;   

    default:
      throw new Error("Not a valid token string");
  }
}

export function getTokenELabel(token: TokenE) {
  switch (token) {
    case TokenE.SOL:
      return "Solana";
    case TokenE.USDC:
      return "UDC Coin";
    case TokenE.BTC:
        return "Bitcoin";
    case TokenE.ETH:
      return "Ethereum";   
  }
}

export function getTokenSymbol(token: TokenE) {
  switch (token) {
    case TokenE.USDC:
      return "USDC";
    case TokenE.SOL:
      return "SOL";
    case TokenE.BTC:
      return "BTC";
    case TokenE.ETH:
      return "ETH";     
  }
}

export function getSymbol(token: TokenE) {
  switch (token) {
  
    case TokenE.SOL:
      return "SOLUSD";
    case TokenE.USDC:
      return "USDCUSD";
    case TokenE.BTC:
      return "BTCUSD";
    case TokenE.ETH:
      return "ETHUSD";  
   
  }
}

export function getTokenEIcon(token: string) {
  switch (token) {
    case TokenE.SOL:
      return <SolanaIconCircle />;
    case TokenE.USDC:
      return <UsdcIconCircle />;
    case TokenE.BTC:
      return <BitcoinIconCircle />;
    case TokenE.ETH:
      return <EthereumIconCircle />;
      
      default:
        return <></>;
  }
}

export function getTokenEId(token: TokenE) {
  switch (token) {
    case TokenE.SOL:
      return "solana";

    case TokenE.USDC:
      return "usd-coin";

    case TokenE.BTC:
      return "bitcoin";
     
    case TokenE.ETH:
      return "ethereum";
  }
}

export function tokenAddressToTokenE(address: string): TokenE {
  switch (address) {

    case SOL_MINT_ADDRESS:
      return TokenE.SOL;
    
    // case "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU":
    case USDC_MINT_ADDRESS:
      return TokenE.USDC;

    case BTC_MINT_ADDRESS:
      return TokenE.BTC;

    case ETH_MINT_ADDRESS:
      return TokenE.ETH;

    default:
      throw new Error("Not a valid token string");
  }
}

export function getTokenAddress(token: TokenE) {
  switch (token) {
    case TokenE.SOL:
      return SOL_MINT_ADDRESS;
    
    case TokenE.USDC:
      // return "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";
      return USDC_MINT_ADDRESS;

    case TokenE.BTC:
      return BTC_MINT_ADDRESS;

    case TokenE.ETH:
      return ETH_MINT_ADDRESS;

  }
}
