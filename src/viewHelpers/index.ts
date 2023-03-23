import {
  CLUSTER,
  DEFAULT_PERPS_USER,
  DEFAULT_POOL,
  PERPETUALS_PROGRAM_ID,
  POOL_CONFIG,
} from "@/utils/constants";
import { AnchorProvider, BN, Program } from "@project-serum/anchor";
import {
  Connection,
  PublicKey,
  RpcResponseAndContext,
  SimulatedTransactionResponse,
  Transaction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import { IDL, Perpetuals } from "@/target/types/perpetuals";
import { PoolConfig } from "@/utils/PoolConfig";
import { decode } from "@project-serum/anchor/dist/cjs/utils/bytes/base64";
import { IdlCoder } from "@/utils/IdlCoder";
import { Side } from "../types";

export type PositionSide = "long" | "short";

export interface PriceAndFee {
  price: BN;
  fee: BN;
}

export interface NewPositonPricesAndFee {
  price: BN;
  fee: BN;
  liquidationPrice: BN
}

export interface ProfitAndLoss {
  profit: BN;
  loss: BN;
}

export interface SwapAmountAndFees {
   amountOut: BN;
   feeIn: BN;
   feeOut: BN;
}

export interface AmountAndFee {
  amount: BN;
  fee: BN;
}

export class ViewHelper {
  program: Program<Perpetuals>;
  connection: Connection;
  provider: AnchorProvider;
  poolConfig: PoolConfig;

  constructor(connection: Connection, provider: AnchorProvider) {
    this.connection = connection;
    this.provider = provider;
    this.program = new Program(IDL, PERPETUALS_PROGRAM_ID, provider);
    this.poolConfig = PoolConfig.fromIdsByName(DEFAULT_POOL, CLUSTER);
  }

  // may need to add blockhash and also probably use VersionedTransactions
  simulateTransaction = async (
    transaction: Transaction
  ): Promise<RpcResponseAndContext<SimulatedTransactionResponse>> => {
    transaction.feePayer = DEFAULT_PERPS_USER.publicKey;
    let latestBlockhash = await this.connection.getLatestBlockhash('confirmed');

    const messageV0 = new TransactionMessage({
      payerKey: this.provider.publicKey ?? DEFAULT_PERPS_USER.publicKey,
      recentBlockhash: latestBlockhash.blockhash,
      instructions: transaction.instructions
    }).compileToV0Message();

    const transaction2 = new VersionedTransaction(messageV0)
    return this.connection.simulateTransaction(transaction2, { sigVerify: false, replaceRecentBlockhash: true })
  };

  decodeLogs<T>(
    data: RpcResponseAndContext<SimulatedTransactionResponse>,
    instructionNumber: number
  ): T {
    const returnPrefix = `Program return: ${PERPETUALS_PROGRAM_ID} `;
    // console.log("Data:",data); 
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
      // console.log("coder.decode(returnData); ::: ", coder.decode(returnData));
      return coder.decode(returnData);
    } else {
       console.error("No Logs Found : data:",data); 
      throw new Error(`No Logs Found `,{cause: data});
    }
  }

  getAssetsUnderManagement = async (
    poolKey: PublicKey,
  ): Promise<BN> => {
    let program = new Program(IDL, PERPETUALS_PROGRAM_ID, this.provider);
    const custodies = POOL_CONFIG.custodies;
    let custodyMetas = [];
    for (const token of custodies) {
      custodyMetas.push({
        isSigner: false,
        isWritable: false,
        pubkey: token.custodyAccount,
      });
    }
    for (const custody of custodies) {
      custodyMetas.push({
        isSigner: false,
        isWritable: false,
        pubkey: custody.oracleAddress,
      });
    }

    const transaction = await program.methods
      // @ts-ignore
      .getAssetsUnderManagement({})
      .accounts({
        perpetuals: this.poolConfig.perpetuals,
        pool: poolKey,
      })
      .remainingAccounts([...custodyMetas])
      .transaction();

    const result = await this.simulateTransaction(transaction);
    const index = IDL.instructions.findIndex(
      (f) => f.name === "getAssetsUnderManagement"
    );
    return this.decodeLogs(result, index);
  };

  getEntryPriceAndFee = async (
    collateral: BN,
    size: BN,
    side: Side,
    poolKey: PublicKey,
    custodyKey: PublicKey
  ): Promise<NewPositonPricesAndFee> => {
    let program = new Program(IDL, PERPETUALS_PROGRAM_ID, this.provider);
    // console.log("fee payer : ",DEFAULT_PERPS_USER.publicKey.toBase58())

    let transaction : Transaction = await program.methods
      // @ts-ignore
      .getEntryPriceAndFee({
        collateral,
        size,
        side: side,
      })
      .accounts({
        perpetuals: this.poolConfig.perpetuals,
        pool: poolKey,
        custody: custodyKey,
        custodyOracleAccount:
          PoolConfig.getCustodyConfig(custodyKey)?.oracleAddress,
      })
      .transaction();

    const result = await this.simulateTransaction(transaction);
    const index = IDL.instructions.findIndex(
      (f) => f.name === "getEntryPriceAndFee"
    );
    const res: any = this.decodeLogs(result, index);

    return {
      price: res.entryPrice,
      fee: res.fee,
      liquidationPrice: res.liquidationPrice
    };
  };

  getExitPriceAndFee = async (
    poolKey: PublicKey,
    custodyKey: PublicKey,
    position: PublicKey
  ): Promise<PriceAndFee> => {
    let program = new Program(IDL, PERPETUALS_PROGRAM_ID, this.provider);
    // console.log("fee payer : ",DEFAULT_PERPS_USER.publicKey.toBase58())

    const transaction = await program.methods
      // @ts-ignore
      .getExitPriceAndFee({})
      .accounts({
        perpetuals: this.poolConfig.perpetuals,
        pool: poolKey,
        position: position,
        custody: custodyKey,
        custodyOracleAccount:
          PoolConfig.getCustodyConfig(custodyKey)?.oracleAddress,
      })
      .transaction();

    const result = await this.simulateTransaction(transaction);
    const index = IDL.instructions.findIndex(
      (f) => f.name === "getExitPriceAndFee"
    );
    const res: any = this.decodeLogs(result, index);

    return {
      price: res.price,
      fee: res.fee,
    };
  };

  getLiquidationPrice = async (
    poolKey: PublicKey,
    custodyKey: PublicKey,
    position: PublicKey
  ): Promise<BN> => {
    let program = new Program(IDL, PERPETUALS_PROGRAM_ID, this.provider);

    // console.log("fee payer : ",DEFAULT_PERPS_USER.publicKey.toBase58())
    const transaction = await program.methods
      // @ts-ignore
      .getLiquidationPrice({
        // addCollateral, // need to update new code 
        // removeCollateral,
      })
      .accounts({
        perpetuals: this.poolConfig.perpetuals,
        pool: poolKey,
        position: position,
        custody: custodyKey,
        custodyOracleAccount:
          PoolConfig.getCustodyConfig(custodyKey)?.oracleAddress,
      })
      .transaction();

    const result = await this.simulateTransaction(transaction);
    const index = IDL.instructions.findIndex(
      (f) => f.name === "getLiquidationPrice"
    );
    return this.decodeLogs(result, index);
  };

  getLiquidationState = async (
    poolKey: PublicKey,
    custodyKey: PublicKey,
    position: PublicKey
  ): Promise<BN> => {
    let program = new Program(IDL, PERPETUALS_PROGRAM_ID, this.provider);

    const transaction = await program.methods
      // @ts-ignore
      .getLiquidationState({})
      .accounts({
        perpetuals: this.poolConfig.perpetuals,
        pool: poolKey,
        position: position,
        custody: custodyKey,
        custodyOracleAccount:
          PoolConfig.getCustodyConfig(custodyKey)?.oracleAddress,
      })
      .transaction();

    const result = await this.simulateTransaction(transaction);
    const index = IDL.instructions.findIndex(
      (f) => f.name === "getLiquidationState"
    );
    return this.decodeLogs(result, index);
  };

  getOraclePrice = async (
    poolKey: PublicKey,
    ema: boolean,
    custodyKey: PublicKey
  ): Promise<BN> => {
    const transaction = await this.program.methods
      .getOraclePrice({
        ema,
      })
      .accounts({
        perpetuals: this.poolConfig.perpetuals,
        pool: poolKey,
        custody: custodyKey,
        custodyOracleAccount:
          PoolConfig.getCustodyConfig(custodyKey)?.oracleAddress,
      })
      .transaction();

    const result = await this.simulateTransaction(transaction);
    const index = IDL.instructions.findIndex(
      (f) => f.name === "getOraclePrice"
    );
    return this.decodeLogs<BN>(result, index);
  };

  getPnl = async (
    poolKey: PublicKey,
    custodyKey: PublicKey,
    position: PublicKey
  ): Promise<ProfitAndLoss> => {
    const transaction = await this.program.methods
      .getPnl({})
      .accounts({
        perpetuals: this.poolConfig.perpetuals,
        pool: poolKey,
        position: position,
        custody: custodyKey,
      })
      .transaction();

    const result = await this.simulateTransaction(transaction);
    const index = IDL.instructions.findIndex((f) => f.name === "getPnl");
    const res: any = this.decodeLogs<BN>(result, index);
    return {
      profit: res.profit,
      loss: res.loss,
    };
  };

  getSwapAmountAndFees = async (
    amountIn: BN,
    poolKey: PublicKey,
    receivingCustodyKey: PublicKey,
    dispensingCustodykey : PublicKey,
  ): Promise<SwapAmountAndFees> => {
    let program = new Program(IDL, PERPETUALS_PROGRAM_ID, this.provider);

    let transaction = await program.methods
      // @ts-ignore
      .getSwapAmountAndFees({
        amountIn
      })
      .accounts({
        perpetuals: this.poolConfig.perpetuals,
        pool: poolKey,
        receivingCustody: receivingCustodyKey,
        receivingCustodyOracleAccount:
          PoolConfig.getCustodyConfig(receivingCustodyKey)?.oracleAddress,
        dispensingCustody : dispensingCustodykey,
        dispensingCustodyOracleAccount : PoolConfig.getCustodyConfig(dispensingCustodykey)?.oracleAddress,
      })
      .transaction();

    const result = await this.simulateTransaction(transaction);
    const index = IDL.instructions.findIndex(
      (f) => f.name === "getSwapAmountAndFees"
    );
    const res: any = this.decodeLogs(result, index);

    return {
      amountOut: res.amountOut,
      feeIn: res.feeIn,
      feeOut : res.feeOut
    };
  };

  getAddLiquidityAmountAndFee = async (
    amount: BN,
    poolKey: PublicKey,
    depositCustodyKey: PublicKey,
  ): Promise<AmountAndFee> => {
    let program = new Program(IDL, PERPETUALS_PROGRAM_ID, this.provider);

    const custodies = POOL_CONFIG.custodies;
    let custodyMetas = [];
    for (const token of custodies) {
      custodyMetas.push({
        isSigner: false,
        isWritable: false,
        pubkey: token.custodyAccount,
      });
    }
    for (const custody of custodies) {
      custodyMetas.push({
        isSigner: false,
        isWritable: false,
        pubkey: custody.oracleAddress,
      });
    }

    let transaction = await program.methods
      // @ts-ignore
      .getAddLiquidityAmountAndFee({
        amountIn : amount
      })
      .accounts({
        perpetuals: this.poolConfig.perpetuals,
        pool: poolKey,
        custody: depositCustodyKey,
        custodyOracleAccount:
          PoolConfig.getCustodyConfig(depositCustodyKey)?.oracleAddress,
        lpTokenMint: this.poolConfig.lpTokenMint,  
      })
      .remainingAccounts([...custodyMetas])
      .transaction();

    const result = await this.simulateTransaction(transaction);
    const index = IDL.instructions.findIndex(
      (f) => f.name === "getAddLiquidityAmountAndFee"
    );
    const res: any = this.decodeLogs(result, index);

    return {
      amount: res.amount,
      fee : res.fee
    };
  };

  getRemoveLiquidityAmountAndFee = async (
    amount: BN,
    poolKey: PublicKey,
    removeTokenCustodyKey: PublicKey,
  ): Promise<AmountAndFee> => {
    let program = new Program(IDL, PERPETUALS_PROGRAM_ID, this.provider);

    const custodies = POOL_CONFIG.custodies;
    let custodyMetas = [];
    for (const token of custodies) {
      custodyMetas.push({
        isSigner: false,
        isWritable: false,
        pubkey: token.custodyAccount,
      });
    }
    for (const custody of custodies) {
      custodyMetas.push({
        isSigner: false,
        isWritable: false,
        pubkey: custody.oracleAddress,
      });
    }

    let transaction = await program.methods
      // @ts-ignore
      .getRemoveLiquidityAmountAndFee({
        lpAmountIn : amount
      })
      .accounts({
        perpetuals: this.poolConfig.perpetuals,
        pool: poolKey,
        custody: removeTokenCustodyKey,
        custodyOracleAccount:
          PoolConfig.getCustodyConfig(removeTokenCustodyKey)?.oracleAddress,
        lpTokenMint: this.poolConfig.lpTokenMint,  
      })
      .remainingAccounts([...custodyMetas])
      .transaction();

    const result = await this.simulateTransaction(transaction);
    const index = IDL.instructions.findIndex(
      (f) => f.name === "getRemoveLiquidityAmountAndFee"
    );
    const res: any = this.decodeLogs(result, index);

    return {
      amount: res.amount,
      fee : res.fee
    };
  };
}
