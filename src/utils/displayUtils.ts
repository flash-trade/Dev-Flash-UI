import { BN } from "@project-serum/anchor";


export function toNative(uiAmount: number, decimals: number): BN {
  return new BN((uiAmount * Math.pow(10, decimals)).toFixed(0));
}
// 99999123456
// 99999.123456
// 99999.123
export function toUiDecimals(
  nativeAmount: BN  | number | string,
  decimals: number,
  precision = 3,
  commaSeperated = false
): string {
  // TODO: remove BN and upgrade to bigint https://github.com/solana-labs/solana/issues/27440

  if(precision> decimals){
    throw "not allowed precision> decimals"
  }
  let r = '';

  if (nativeAmount instanceof BN) {
    const nativeAmountString = nativeAmount.toString();
    // get decimals 
    const d = nativeAmountString.slice((decimals) * -1);
    const p = d.slice(0 ,precision);
    const nativeAmountWithoutDecimalsStr = nativeAmount.div(new BN( 10 ** decimals)).toString();

     r =  nativeAmountWithoutDecimalsStr + "." + p;
  }
 else if (typeof nativeAmount === "string") {
    if( isNaN(Number(nativeAmount))){
        throw "String No valid "
    }
    const d = nativeAmount.slice((decimals) * -1);
    const p = d.slice(0 ,precision);
    const nativeAmountWithoutDecimalsStr = (new BN(nativeAmount)).div(new BN( 10 ** decimals)).toString();

     r = nativeAmountWithoutDecimalsStr + "." + p;
  }
  else if (typeof nativeAmount === "number") {
    const d = nativeAmount.toString().slice((decimals) * -1);
    const p = d.slice(0 ,precision);
    const nativeAmountWithoutDecimalsStr = (new BN(nativeAmount)).div(new BN( 10 ** decimals)).toString();
     r = nativeAmountWithoutDecimalsStr + "." + p;
  } 
  else {
      return 'type unknown'
  }

  if(commaSeperated){
    return Number(r).toLocaleString();
  } else {
    return r;
  }

}


export function balanceToReadable(num : any) {
    num = num.toString().replace(/[^0-9.]/g, '');
    if (num < 1000) {
        return num;
    }
    let si = [
        { v: 1E3, s: "K" },
        { v: 1E6, s: "M" },
        { v: 1E9, s: "B" },
        { v: 1E12, s: "T" },
        { v: 1E15, s: "P" },
        { v: 1E18, s: "E" }
    ];
    let index;
    for (index = si.length - 1; index > 0; index--) {
        if (num >= si[index]!.v) {
            break;
        }
    }
    return (num / si[index]!.v).toFixed(2).replace(/\.0+$|(\.[0-9]*[1-9])0+$/, "$1") + si[index]!.s;
}