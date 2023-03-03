import { DefaultWallet, PERPETUALS_PROGRAM_ID } from "@/utils/constants";
import { AnchorProvider, BN, Program, Wallet } from "@project-serum/anchor";
import { Connection, Keypair, PublicKey, RpcResponseAndContext, SimulatedTransactionResponse, Transaction } from "@solana/web3.js";
import { IDL as PERPETUALS_IDL, Perpetuals } from "@/target/types/perpetuals";
import { PoolConfig } from "@/utils/PoolConfig";
import { decode } from "@project-serum/anchor/dist/cjs/utils/bytes/base64";
import { IdlCoder } from "@/utils/IdlCoder";

export type PositionSide = "long" | "short";

export class ViewHelper {

  program: Program<Perpetuals>;
  connection: Connection
  provider: AnchorProvider;

  constructor(connection: Connection, provider: AnchorProvider) {
    // const wallet = new AnchorProvider(connection, new DefaultWallet(Keypair.generate()), {
    //   commitment: "processed",
    //   skipPreflight: true,
    // })
    this.connection = connection;
    this.provider = provider;
    this.program = new Program(
      PERPETUALS_IDL,
      PERPETUALS_PROGRAM_ID,
      provider
    );
  }

  simulateTransaction = async (transaction: Transaction): Promise<RpcResponseAndContext<SimulatedTransactionResponse>> => {
    transaction.feePayer = this.provider.publicKey;
    return this.connection.simulateTransaction(transaction)
  }

  // decodeLogs = (data: RpcResponseAndContext<SimulatedTransactionResponse>, instructionNumber: number) => {
  //   const returnPrefix = `Program return: ${PERPETUALS_PROGRAM_ID} `;
  //   PERPETUALS_IDL.instructions[100]
  //   if (data.value.logs) {
  //       let returnLog = data.value.logs.find((l: any) =>
  //           l.startsWith(returnPrefix)
  //       );
  //       if (!returnLog) {
  //           throw new Error("View expected return log");
  //       }
  //       let returnData = decode(returnLog.slice(returnPrefix.length));
  //       let returnType = PERPETUALS_IDL.instructions[2].returns;

  //       if (!returnType) {
  //           throw new Error("View expected return type");
  //       }
  //       const coder = IdlCoder.fieldLayout(
  //           { type: returnType },
  //           Array.from([...(PERPETUALS_IDL.accounts ?? []), ...(PERPETUALS_IDL.types ?? [])])
  //       );
  //       // return coder.decode(returnData);
  //       console.log('coder.decode(returnData); ::: ', coder.decode(returnData))
  //   }
  // }

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

    const transaction =  await program.methods
      // @ts-ignore
      .getEntryPriceAndFee({
        collateral,
        size,
        side: side === "long" ? { long: {} } : { short: {} },
      })
      .accounts({
        perpetuals: PERPETUALS_PROGRAM_ID,
        pool: poolKey,
        custody: custodyKey,
        custodyOracleAccount: PoolConfig.getCustodyConfig(
          custodyKey
        )?.oracleAddress,
      })
      .transaction()

      return await this.simulateTransaction(transaction);
  }

  getOraclePrice = async (
    poolKey: PublicKey,
    ema: boolean,
    custodyKey: PublicKey,
  ) => {
    console.log(" >> here >>> ");


    console.log('poolKey ::: ', poolKey.toBase58())
    console.log('custodyKey ::: ', custodyKey.toBase58())
    console.log("oracleAddress ::: :", PoolConfig.getCustodyConfig(
      custodyKey
    )?.oracleAddress.toBase58());

    // return await this.simulateTransaction(
       const ok = await this.program.methods
        .getOraclePrice({
          ema: false,
        })
        .accounts({
          perpetuals: new PublicKey('5CpxhcrfvH8s9QDT2nMaPWqPoMwpuiPuP8e8x4YN61A2'),
          pool: poolKey,
          custody: custodyKey,
          custodyOracleAccount: PoolConfig.getCustodyConfig(
            custodyKey
          )?.oracleAddress,
        }).view()
        // .view()
        // .catch((err) => {
        //   console.error(err);
        //   throw err;
        // });
    // )

    console.log('ok :: ', ok.toNumber())

    // return this.decodeLogs(result, 2)
  };
} 
