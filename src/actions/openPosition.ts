import { Pool } from "@/lib/PoolAccount";

import { getTokenAddress, TokenE } from "@/utils/TokenUtils";
import {
  getPerpetualProgramAndProvider,
  perpetualsAddress,
  PERPETUALS_PROGRAM_ID,
  POOL_CONFIG,
  transferAuthorityAddress,
} from "@/utils/constants";
import { manualSendTransaction } from "@/utils/manualTransaction";
import { PoolConfig } from "@/utils/PoolConfig";
import { checkIfAccountExists } from "@/utils/retrieveData";
import { BN, Wallet } from "@project-serum/anchor";
import { findProgramAddressSync } from "@project-serum/anchor/dist/cjs/utils/pubkey";
import {
  createAssociatedTokenAccountInstruction,
  createSyncNativeInstruction,
  getAssociatedTokenAddress,
  NATIVE_MINT,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import { isVariant, Side } from "../types";

export async function openPosition(
  wallet: Wallet,
  publicKey: PublicKey,
  signTransaction : any,
  connection: Connection,
  payToken: TokenE,
  positionToken: TokenE,
  payAmount: BN,
  positionAmount: BN,
  price: BN,
  side: Side
) {
  let { perpetual_program } = await getPerpetualProgramAndProvider(wallet);

  // TODO: need to take slippage as param , this is now for testing
  const newPrice =
  isVariant(side, 'long')
      ? price.mul(new BN(110)).div(new BN(100))
      : price.mul(new BN(90)).div(new BN(100));
  console.log(
    ">> openPosition inputs",
    Number(payAmount),
    Number(positionAmount),
    Number(price),
    Number(newPrice),
    payToken,
    side,
    isVariant(side, 'long'),
  );

  const payTokenCustody = POOL_CONFIG.custodies.find(i => i.mintKey.toBase58()=== getTokenAddress(payToken));
  if(!payTokenCustody){
    throw "poolTokenCustody  not found";
  }
  console.log("payTokenCustody:",payTokenCustody)

  let userCustodyTokenAccount = await getAssociatedTokenAddress(
    new PublicKey(getTokenAddress(payToken)),
    publicKey
  );

  // check if usercustodytoken account exists
  if (!(await checkIfAccountExists(userCustodyTokenAccount, connection))) {
    console.log("user custody token account does not exist");
  }

  console.log("tokens", payToken, positionToken);
  let positionAccount = findProgramAddressSync(
    [
      Buffer.from("position") ,
      publicKey.toBuffer(),
      POOL_CONFIG.poolAddress.toBuffer(),
      payTokenCustody.custodyAccount.toBuffer(),
      isVariant(side, 'long') ?  Buffer.from([1]) :  Buffer.from([2]), // in base58 1=2 , 2=3 
    ],
    perpetual_program.programId
  )[0];

 

  let transaction = new Transaction();

  try {
    // wrap sol if needed
    if (payToken == TokenE.SOL) {
      console.log("pay token name is sol", payToken);

      const associatedTokenAccount = await getAssociatedTokenAddress(
        NATIVE_MINT,
        publicKey
      );

      if (!(await checkIfAccountExists(associatedTokenAccount, connection))) {
        console.log("sol ata does not exist", NATIVE_MINT.toString());

        transaction = transaction.add(
          createAssociatedTokenAccountInstruction(
            publicKey,
            associatedTokenAccount,
            publicKey,
            NATIVE_MINT
          )
        );
      }

      // get balance of associated token account
      console.log("sol ata exists");
      const balance = await connection.getBalance(associatedTokenAccount);
      if (balance < payAmount.toNumber()) {
        console.log("balance insufficient");
        transaction = transaction.add(
          SystemProgram.transfer({
            fromPubkey: publicKey,
            toPubkey: associatedTokenAccount,
            lamports: LAMPORTS_PER_SOL,
          }),
          createSyncNativeInstruction(associatedTokenAccount)
        );
      }
    }

    console.log("position account", positionAccount.toString());

    const params: any = {
      price: newPrice,
      collateral: payAmount,
      size: positionAmount,
      side: side,
    };
    let tx = await perpetual_program.methods
      .openPosition(params)
      .accounts({
        owner: publicKey,
        fundingAccount: userCustodyTokenAccount,
        transferAuthority: transferAuthorityAddress,
        perpetuals: perpetualsAddress,
        pool: POOL_CONFIG.poolAddress,
        position: positionAccount,
        custody: payTokenCustody.custodyAccount,
        custodyOracleAccount:
        payTokenCustody.oracleAddress,
        custodyTokenAccount:
        payTokenCustody.tokenAccount,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .transaction();
    transaction = transaction.add(tx);

    console.log("open position tx", transaction);
    // console.log("tx keys");
    // for (let i = 0; i < transaction.instructions[0].keys.length; i++) {
    //   console.log(
    //     "key",
    //     i,
    //     transaction.instructions[0].keys[i]?.pubkey.toString()
    //   );
    // }

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
