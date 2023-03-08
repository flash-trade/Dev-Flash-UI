import { Pool } from "@/lib/PoolAccount";
import { getTokenAddress, TokenE } from "@/utils/TokenUtils";
import {
  getPerpetualProgramAndProvider,
  perpetualsAddress,
  POOL_CONFIG,
  transferAuthorityAddress,
} from "@/utils/constants";
import { manualSendTransaction } from "@/utils/manualTransaction";
import { checkIfAccountExists } from "@/utils/retrieveData";
import { BN } from "@project-serum/anchor";
import {
  createAssociatedTokenAccountInstruction,
  createSyncNativeInstruction,
  getAssociatedTokenAddress,
  NATIVE_MINT,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { SignerWalletAdapterProps } from "@solana/wallet-adapter-base";
import { Wallet } from "@solana/wallet-adapter-react";
import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";

export async function changeLiquidity(
  wallet: Wallet,
  publicKey: PublicKey,
  signTransaction: SignerWalletAdapterProps["signAllTransactions"],
  connection: Connection,
  payToken: TokenE,
  tokenAmount?: number,
  liquidityAmount?: number
) {
  let { perpetual_program } = await getPerpetualProgramAndProvider(wallet);

console.log("POOL_CONFIG.programId:",POOL_CONFIG.programId.toBase58())

  let lpTokenAccount = await getAssociatedTokenAddress(
    POOL_CONFIG.lpTokenMint,
    publicKey
  );

  const payTokenCustody = POOL_CONFIG.custodies.find(i => i.mintKey.toBase58()=== getTokenAddress(payToken));
  if(!payTokenCustody){
    throw "poolTokenCustody  not found";
  }

  let userCustodyTokenAccount = await getAssociatedTokenAddress(
    payTokenCustody.mintKey!,
    publicKey
  );

  let custodyAccountMetas = [];
  let custodyOracleAccountMetas = [];
  for (const custody of POOL_CONFIG.custodies) {
    custodyAccountMetas.push({
      pubkey: custody.custodyAccount,
      isSigner: false,
      isWritable: false,
    });

    custodyOracleAccountMetas.push({
      pubkey: custody.oracleAddress,
      isSigner: false,
      isWritable: false,
    });
  }



  let transaction = new Transaction();

  try {
    if (!(await checkIfAccountExists(lpTokenAccount, connection))) {
      transaction = transaction.add(
        createAssociatedTokenAccountInstruction(
          publicKey,
          lpTokenAccount,
          publicKey,
          POOL_CONFIG.lpTokenMint
        )
      );
    }

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
      if (balance < tokenAmount * LAMPORTS_PER_SOL) {
        console.log("balance insufficient");
        transaction = transaction.add(
          SystemProgram.transfer({
            fromPubkey: publicKey,
            toPubkey: associatedTokenAccount,
            lamports: tokenAmount * LAMPORTS_PER_SOL,
          }),
          createSyncNativeInstruction(associatedTokenAccount)
        );
      }
    }

    if (tokenAmount) {
      console.log("in add liq", tokenAmount);
      let amount;
      if (payToken === TokenE.SOL) {
        amount = new BN(tokenAmount * LAMPORTS_PER_SOL);
      } else {
        amount = new BN(tokenAmount * 10e5);
      }
      let addLiquidityTx = await perpetual_program.methods
        .addLiquidity({ amount })
        .accounts({
          owner: publicKey,
          fundingAccount: userCustodyTokenAccount, // user token account for custody token account
          lpTokenAccount,
          transferAuthority: transferAuthorityAddress,
          perpetuals: perpetualsAddress,
          pool: POOL_CONFIG.poolAddress,
          custody: payTokenCustody.custodyAccount,
          custodyOracleAccount: payTokenCustody.oracleAddress,
          custodyTokenAccount: payTokenCustody.tokenAccount,
          lpTokenMint: POOL_CONFIG.lpTokenMint,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .remainingAccounts([...custodyAccountMetas, ...custodyOracleAccountMetas])
        .transaction();
      transaction = transaction.add(addLiquidityTx);
    }
    if (liquidityAmount) {
      let lpAmount = new BN(liquidityAmount * 10 ** POOL_CONFIG.lpDecimals);
      let removeLiquidityTx = await perpetual_program.methods
        .removeLiquidity({ lpAmount })
        .accounts({
          owner: publicKey,
          receivingAccount: userCustodyTokenAccount, // user token account for custody token account
          lpTokenAccount,
          transferAuthority: transferAuthorityAddress,
          perpetuals: perpetualsAddress,
          pool: POOL_CONFIG.poolAddress,
          custody: payTokenCustody.custodyAccount,
          custodyOracleAccount: payTokenCustody.oracleAddress,
          custodyTokenAccount: payTokenCustody.tokenAccount,
          lpTokenMint: POOL_CONFIG.lpTokenMint,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .remainingAccounts([...custodyAccountMetas, ...custodyOracleAccountMetas])
        .transaction();
      transaction = transaction.add(removeLiquidityTx);
    }

    console.log("add liquidity tx", transaction);
    console.log("tx keys");

    if (transaction.instructions.length > 0) {
      for (let i = 0; i < transaction.instructions[0]!.keys.length; i++) {
        console.log("key",i,transaction.instructions[0]!.keys[i]?.pubkey.toString());
      }
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
