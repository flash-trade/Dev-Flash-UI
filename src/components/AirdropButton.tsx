import { getTokenELabel, tokenAddressToTokenE } from "@/utils/TokenUtils";
import { DEFAULT_PERPS_USER } from "@/utils/constants";
import { manualSendTransaction } from "@/utils/manualTransaction";
import { checkIfAccountExists } from "@/utils/retrieveData";
import {
  createAssociatedTokenAccountInstruction,
  createMintToCheckedInstruction,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, Transaction } from "@solana/web3.js";

import { SolidButton } from "./SolidButton";

interface Props {
  className?: string;
  mint: string;
}
export default function AirdropButton(props: Props) {
  const { publicKey, signTransaction } = useWallet();
  const { connection } = useConnection();

  let mint = new PublicKey(props.mint);



  async function handleAirdrop() {
    if (mint.toString() === "So11111111111111111111111111111111111111112") {
      await connection.requestAirdrop(publicKey!, 1 * 10 ** 9);
    } else {
      let transaction = new Transaction();

      let associatedAccount = await getAssociatedTokenAddress(mint, publicKey);

      if (!(await checkIfAccountExists(associatedAccount, connection))) {
        transaction = transaction.add(
          createAssociatedTokenAccountInstruction(
            publicKey,
            associatedAccount,
            publicKey,
            mint
          )
        );
      }

      transaction = transaction.add(
        createMintToCheckedInstruction(
          mint, // mint
          associatedAccount, // ata
          DEFAULT_PERPS_USER.publicKey, // payer
          100 * 10 ** 9, // amount
          9 // decimals
        )
      );

      await manualSendTransaction(
        transaction,
        publicKey,
        connection,
        signTransaction,
        DEFAULT_PERPS_USER
      );
    }

  }

  return (
    <SolidButton
      className="my-6 w-full bg-slate-500 hover:bg-slate-200"
      onClick={handleAirdrop}
    >
      Airdrop {'"'}
      {getTokenELabel(tokenAddressToTokenE(props.mint))}
      {'"'}
    </SolidButton>
  );
}
