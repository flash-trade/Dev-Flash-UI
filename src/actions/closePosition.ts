import { getTokenAddress, TokenE } from "@/utils/TokenUtils";
import {
  getPerpetualProgramAndProvider,
  perpetualsAddress,
  POOL_CONFIG,
  transferAuthorityAddress,
} from "@/utils/constants";
import { manualSendTransaction } from "@/utils/manualTransaction";
import { BN, Wallet } from "@project-serum/anchor";
import {
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  Connection,
  PublicKey,
  Transaction,
} from "@solana/web3.js";
import { isVariant, Side } from "../types";

export async function closePosition(
  wallet: Wallet,
  publicKey: PublicKey,
  signTransaction : any ,
  connection: Connection,
  payToken: TokenE,
  positionToken: TokenE,
  positionAccountAddress: String,
  side: Side,
  price: BN
) {

  let { perpetual_program } = await getPerpetualProgramAndProvider(wallet);
  console.log("side , isLong:", side , isVariant(side, 'long'));

  // TODO: need to take slippage as param , this is now for testing
  const adjustedPrice =
   isVariant(side, 'long')
      ? price.mul(new BN(95)).div(new BN(100))
      : price.mul(new BN(105)).div(new BN(100))
  console.log(
    "adjustedPrice, coingeckoPrice:",
    adjustedPrice.toString(),
    price.toString()
  );

  const poolTokenCustody = POOL_CONFIG.custodies.find(i => i.mintKey.toBase58()=== getTokenAddress(payToken));
  if(!poolTokenCustody){
    throw "poolTokenCustody  not found";
  }

  let userCustodyTokenAccount = await getAssociatedTokenAddress(
    poolTokenCustody.mintKey,
    publicKey
  );
  console.log("tokens", payToken, positionToken);

  let transaction = new Transaction();

  try {
    const positionAccount = new PublicKey(positionAccountAddress);
    console.log("position account", positionAccount.toString());

    let tx = await perpetual_program.methods
      .closePosition({
        price: adjustedPrice,
      })
      .accounts({
        owner: publicKey,
        receivingAccount: userCustodyTokenAccount,
        transferAuthority: transferAuthorityAddress,
        perpetuals: perpetualsAddress,
        pool: POOL_CONFIG.poolAddress,
        position: positionAccount,
        custody: poolTokenCustody.custodyAccount,
        custodyOracleAccount: poolTokenCustody.oracleAddress,
        custodyTokenAccount: poolTokenCustody.tokenAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .transaction();
    transaction = transaction.add(tx);

    console.log("close position tx", transaction);
    console.log("tx keys");
    for (let i = 0; i < transaction.instructions[0]!.keys.length; i++) {
      console.log(
        "key",
        i,
        transaction.instructions[0]!.keys[i]?.pubkey.toString()
      );
    }

    await manualSendTransaction(
      transaction,
      publicKey,
      connection,
      signTransaction
    );
  } catch (err) {
    console.log(err);
    throw err;
  }
}
