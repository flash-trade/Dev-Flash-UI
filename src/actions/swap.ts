import { getTokenAddress, TokenE } from "@/utils/TokenUtils";
import {
  getPerpetualProgramAndProvider,
  perpetualsAddress,
  POOL_CONFIG,
  transferAuthorityAddress,
} from "@/utils/constants";
import { manualSendTransaction } from "@/utils/manualTransaction";
import { checkIfAccountExists } from "@/utils/retrieveData";
import { BN, Wallet } from "@project-serum/anchor";
import {
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { Connection, PublicKey, Transaction } from "@solana/web3.js";

export async function swap(
  wallet: Wallet,
  publicKey: PublicKey,
  signTransaction: any,
  connection: Connection,
  receivingToken: TokenE,
  dispensingToken: TokenE,
  amountIn: BN,
  minAmountOut: BN
) {
  console.log("inputs", Number(amountIn), Number(minAmountOut));
  console.log("tokens", dispensingToken, receivingToken);

  let { perpetual_program } = await getPerpetualProgramAndProvider(wallet);

  const receivingTokenCustody = POOL_CONFIG.custodies.find(
    (i) => i.mintKey.toBase58() === getTokenAddress(receivingToken)
  );
  if (!receivingTokenCustody) {
    throw "receivingTokenCustody  not found";
  }
  const dispensingTokenCustody = POOL_CONFIG.custodies.find(
    (i) => i.mintKey.toBase58() === getTokenAddress(dispensingToken)
  );
  if (!dispensingTokenCustody) {
    throw "dispensingTokenCustody  not found";
  }

  let receivingTokenAccount = await getAssociatedTokenAddress(
    receivingTokenCustody.mintKey,
    publicKey
  );

  let userCustodyTokenAccount = await getAssociatedTokenAddress(
    dispensingTokenCustody.mintKey,
    publicKey
  );

  let transaction = new Transaction();
  try {
    if (!(await checkIfAccountExists(receivingTokenAccount, connection))) {
      transaction = transaction.add(
        createAssociatedTokenAccountInstruction(
          publicKey,
          receivingTokenAccount,
          publicKey,
          receivingTokenCustody.mintKey
        )
      );
    }

    const params: any = {
      amountIn,
      minAmountOut,
    };
    let tx = await perpetual_program.methods
      .swap(params)
      .accounts({
        owner: publicKey,
        fundingAccount: userCustodyTokenAccount,
        receivingAccount: receivingTokenAccount,
        transferAuthority: transferAuthorityAddress,
        perpetuals: perpetualsAddress,
        pool: POOL_CONFIG.poolAddress,
        
        receivingCustody: dispensingTokenCustody.custodyAccount,
        receivingCustodyOracleAccount: dispensingTokenCustody.oracleAddress,
        receivingCustodyTokenAccount: dispensingTokenCustody.tokenAccount,

        dispensingCustody: receivingTokenCustody.custodyAccount,
        dispensingCustodyOracleAccount: receivingTokenCustody.oracleAddress,
        dispensingCustodyTokenAccount: receivingTokenCustody.tokenAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .transaction();
    transaction = transaction.add(tx);

    console.log("open position tx", transaction);
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
