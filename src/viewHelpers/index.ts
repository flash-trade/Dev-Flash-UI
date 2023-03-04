import { PERPETUALS_PROGRAM_ID } from "@/utils/constants";
import { AnchorProvider, BN, Program } from "@project-serum/anchor";
import { Connection, PublicKey, RpcResponseAndContext, SimulatedTransactionResponse, Transaction } from "@solana/web3.js";
import { IDL, Perpetuals } from "@/target/types/perpetuals";
import { PoolConfig } from "@/utils/PoolConfig";
import { decode } from "@project-serum/anchor/dist/cjs/utils/bytes/base64";
import { IdlCoder } from "@/utils/IdlCoder";

export type PositionSide = "long" | "short";

export class ViewHelper {

  program: Program<Perpetuals>;
  connection: Connection
  provider: AnchorProvider;

  constructor(connection: Connection, provider: AnchorProvider) {
    this.connection = connection;
    this.provider = provider;
    this.program = new Program(
      IDL,
      PERPETUALS_PROGRAM_ID,
      provider
    );
  }

  // may need to add blockhash and also probably use VersionedTransactions
  simulateTransaction = async (transaction: Transaction): Promise<RpcResponseAndContext<SimulatedTransactionResponse>> => {
    transaction.feePayer = this.provider.publicKey;
    return this.connection.simulateTransaction(transaction)
  }

  decodeLogs<T>(data: RpcResponseAndContext<SimulatedTransactionResponse>, instructionNumber: number): T {
    const returnPrefix = `Program return: ${PERPETUALS_PROGRAM_ID} `;
    if (data.value.logs && data.value.err === null) {
      let returnLog = data.value.logs.find((l: any) =>
        l.startsWith(returnPrefix)
      );
      if (!returnLog) {
        throw new Error("View expected return log");
      }
      let returnData = decode(returnLog.slice(returnPrefix.length));
      // @ts-ignore
      let returnType = IDL.instructions[instructionNumber].returns;

      if (!returnType) {
        throw new Error("View expected return type");
      }
      const coder = IdlCoder.fieldLayout(
        { type: returnType },
        Array.from([...(IDL.accounts ?? []), ...(IDL.types ?? [])])
      );
      // return coder.decode(returnData);
      console.log('coder.decode(returnData); ::: ', coder.decode(returnData))
      return coder.decode(returnData)
    } else {
      throw new Error("No Logs Found")
    }
  }

  getEntryPriceAndFee = async (
    collateral: BN,
    size: BN,
    side: PositionSide,
    poolKey: PublicKey,
    custodyKey: PublicKey,
  ) => {
    let program = new Program(
      IDL,
      PERPETUALS_PROGRAM_ID,
      this.provider
    );

    const transaction = await program.methods
      // @ts-ignore
      .getEntryPriceAndFee({
        collateral,
        size,
        side: side === "long" ? { long: {} } : { short: {} },
      })
      .accounts({
        perpetuals:  new PublicKey('5CpxhcrfvH8s9QDT2nMaPWqPoMwpuiPuP8e8x4YN61A2'),
        pool: poolKey,
        custody: custodyKey,
        custodyOracleAccount: PoolConfig.getCustodyConfig(
          custodyKey
        )?.oracleAddress,
      })
      .transaction()

    const result = await this.simulateTransaction(transaction);
    const index = IDL.instructions.findIndex(f => f.name === 'getEntryPriceAndFee');
    return this.decodeLogs(result, index)
  }

  getOraclePrice = async (
    poolKey: PublicKey,
    ema: boolean,
    custodyKey: PublicKey,
  ) => {
    const transaction = await this.program.methods
    .getOraclePrice({
      ema,
    })
    .accounts({
      perpetuals: new PublicKey('5CpxhcrfvH8s9QDT2nMaPWqPoMwpuiPuP8e8x4YN61A2'),
      pool: poolKey,
      custody: custodyKey,
      custodyOracleAccount: PoolConfig.getCustodyConfig(
        custodyKey
      )?.oracleAddress,
    }).transaction()
    const result = await this.simulateTransaction(transaction)
    const index = IDL.instructions.findIndex(f => f.name === 'getOraclePrice');
    return this.decodeLogs<BN>(result, index)
  };
} 
