import { DefaultWallet, PERPETUALS_PROGRAM_ID, perpsUser } from "@/utils/constants";
import { E2EWallet } from "@/utils/DummyWallet";
import { AnchorProvider, BN, Program, Provider } from "@project-serum/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import { IDL as PERPETUALS_IDL, Perpetuals } from "@/target/types/perpetuals";
import { Custody } from "../types";

export type PositionSide = "long" | "short";

class ViewHelper {

  program: Program<Perpetuals>;
  connection: Connection
  provider: AnchorProvider;

  constructor(connection: Connection, provider: AnchorProvider) {
    this.connection = connection;
    this.provider = provider;
    this.program = new Program(
      PERPETUALS_IDL,
      PERPETUALS_PROGRAM_ID,
      provider
    );
  }

  getEntryPriceAndFee = async (
    tokenMint: PublicKey,
    collateral: BN,
    size: BN,
    side: PositionSide,
    poolKey: PublicKey,
    custodyKey: PublicKey,
    custodyOracleAccount: PublicKey
) => {
      let program = new Program(
        PERPETUALS_IDL,
        PERPETUALS_PROGRAM_ID,
        this.provider
      );

    return await program.methods
       // @ts-ignore
      .getEntryPriceAndFee({
        collateral,
        size,
        side: side === "long" ? { long: {} } : { short: {} },
      })
      .accounts({
        signer: this.provider.publicKey,
        perpetuals: PERPETUALS_PROGRAM_ID,
        pool: poolKey,
        custody: custodyKey,
        custodyOracleAccount: await getCustodyOracleAccountKey(
          poolName,
          tokenMint
        ),
      })
      .view()
      .catch((err) => {
        console.error(err);
        throw err;
      });
}

} 
