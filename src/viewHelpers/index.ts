import { PERPETUALS_PROGRAM_ID } from "@/utils/constants";
import { AnchorProvider, BN, Program } from "@project-serum/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import { IDL as PERPETUALS_IDL, Perpetuals } from "@/target/types/perpetuals";
import { PoolConfig } from "@/utils/PoolConfig";

export type PositionSide = "long" | "short";

export class ViewHelper {

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
    collateral: BN,
    size: BN,
    side: PositionSide,
    poolKey: PublicKey,
    custodyKey: PublicKey,
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
        custodyOracleAccount: PoolConfig.getCustodyConfig(
          custodyKey
        )?.oracleAddress,
      })
      .view()
      .catch((err) => {
        console.error(err);
        throw err;
      });
  }

  getOraclePrice = async (
    poolKey: PublicKey,
    ema: boolean,
    custodyKey: PublicKey,
  ) => {
    console.log(" >> here >>> ");
    return await this.program.methods
      .getOraclePrice({
        ema,
      })
      .accounts({
        signer: this.provider.wallet.publicKey,
        perpetuals: PERPETUALS_PROGRAM_ID,
        pool: poolKey,
        custody: custodyKey,
        custodyOracleAccount:  PoolConfig.getCustodyConfig(
          custodyKey
        )?.oracleAddress,
      })
      .view()
      .catch((err) => {
        console.error(err);
        throw err;
      });
  };

} 
