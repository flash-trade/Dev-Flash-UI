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
  PublicKey,
  Transaction,
} from "@solana/web3.js";

export async function removeLiquidity(
  wallet: Wallet,
  publicKey: PublicKey,
  signTransaction: SignerWalletAdapterProps["signAllTransactions"],
  connection: Connection,
  payToken: TokenE,
  liquidityAmountIn: number,
  minAmountOut: number,
  slippage = 10
) {
  let { perpetual_program } = await getPerpetualProgramAndProvider(wallet as any);

console.log("POOL_CONFIG.programId:",POOL_CONFIG.programId.toBase58(), liquidityAmountIn, minAmountOut)

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
      } else {
        console.log("sol ata exists");
      }

    }

    if (liquidityAmountIn) {
      let lpAmount = new BN(liquidityAmountIn * 10 ** POOL_CONFIG.lpDecimals);
      let minAmountOutBN = (new BN(minAmountOut * 10** payTokenCustody.decimals)).mul(new BN(100-slippage)).div(new BN(100));

      console.log(">> minAmountOutBN:",minAmountOutBN.toString())
      let removeLiquidityTx = await perpetual_program.methods
        .removeLiquidity({ 
            lpAmountIn : lpAmount,
            minAmountOut : minAmountOutBN
         })
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

    // console.log("add liquidity tx", transaction);
    // console.log("tx keys");

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
