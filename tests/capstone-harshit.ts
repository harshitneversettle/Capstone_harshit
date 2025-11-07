import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { CapstoneHarshit } from "../target/types/capstone_harshit";
import { PublicKey, SystemProgram, Keypair } from "@solana/web3.js";
import {
  createMint,
  createAssociatedTokenAccount,
  mintTo,
  getAccount,
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import fs from "fs";
import { expect } from "chai";

// ============================================================
// 🔑 Load Local Hardcoded Wallets
// ============================================================
const HARSHIT_KEYPAIR = Keypair.fromSecretKey(
  Uint8Array.from(JSON.parse(fs.readFileSync("/home/titan/capstone-harshit/harshit.json", "utf-8")))
);

const ANVESHA_KEYPAIR = Keypair.fromSecretKey(
  Uint8Array.from(JSON.parse(fs.readFileSync("/home/titan/capstone-harshit/anvesha.json", "utf-8")))
);

console.log("👤 Harshit (Owner):", HARSHIT_KEYPAIR.publicKey.toBase58());
console.log("👩‍💼 Anvesha (Depositor):", ANVESHA_KEYPAIR.publicKey.toBase58());

// ============================================================
// 🧪 Test Suite
// ============================================================
describe("Initialize Treasury (Owner = Harshit) + Deposit (Anvesha)", () => {
  const connection = new anchor.web3.Connection("http://127.0.0.1:8899", "confirmed");

  // Harshit is the provider (owner)
  const provider = new anchor.AnchorProvider(connection, new anchor.Wallet(HARSHIT_KEYPAIR), {});
  anchor.setProvider(provider);

  const program = anchor.workspace.CapstoneHarshit as Program<CapstoneHarshit>;

  let liquidityMint: PublicKey;
  let treasuryStatePda: PublicKey;
  let treasuryVaultAta: PublicKey;
  let treasuryBump: number;

  const anveshaDeposit = 2 * 10 ** 9; // 2 tokens (9 decimals)

  // ============================================================
  // 🌞 Step 0: Fund both wallets
  // ============================================================
  before(async () => {
    console.log("\n💧 Airdropping SOL to wallets...\n");

    await connection.requestAirdrop(HARSHIT_KEYPAIR.publicKey, 5 * anchor.web3.LAMPORTS_PER_SOL);
    await connection.requestAirdrop(ANVESHA_KEYPAIR.publicKey, 5 * anchor.web3.LAMPORTS_PER_SOL);

    // Wait to confirm airdrop
    await new Promise((r) => setTimeout(r, 3000));

    const harshitBal = await connection.getBalance(HARSHIT_KEYPAIR.publicKey);
    const anveshaBal = await connection.getBalance(ANVESHA_KEYPAIR.publicKey);

    console.log("✅ Harshit SOL Balance:", harshitBal / 1e9);
    console.log("✅ Anvesha SOL Balance:", anveshaBal / 1e9);
  });

  // ============================================================
  // ✅ Step 1: Initialize Treasury (Owner = Harshit)
  // ============================================================
  it("✅ Initializes the Treasury (by Harshit)", async () => {
    console.log("\n🚀 Initializing Treasury by Harshit\n");

    // 🪙 Create Mock Liquidity Token Mint
    liquidityMint = await createMint(
      connection,
      HARSHIT_KEYPAIR,
      HARSHIT_KEYPAIR.publicKey,
      HARSHIT_KEYPAIR.publicKey,
      9
    );

    // 🏦 Derive Treasury PDA
    [treasuryStatePda, treasuryBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("treasury")],
      program.programId
    );

    // 💰 Treasury vault ATA (owned by Treasury PDA)
    treasuryVaultAta = getAssociatedTokenAddressSync(
      liquidityMint,
      treasuryStatePda,
      true
    );

    console.log("🪙 Liquidity Mint:", liquidityMint.toBase58());
    console.log("🏦 Treasury PDA:", treasuryStatePda.toBase58());
    console.log("💰 Treasury Vault ATA:", treasuryVaultAta.toBase58());

    // 🧾 Initialize Treasury
    await program.methods
      .initializeTreasury()
      .accounts({
        treasuryState: treasuryStatePda,
        owner: HARSHIT_KEYPAIR.publicKey,
        treasuryVault: treasuryVaultAta,
        liquidityMint,
        systemProgram: SystemProgram.programId,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([HARSHIT_KEYPAIR])
      .rpc();

    const treasury = await program.account.treasuryState.fetch(treasuryStatePda);

    console.log("\n📊 Treasury Initialized:");
    console.log("-----------------------------");
    console.log("🏦 Treasury PDA:", treasuryStatePda.toBase58());
    console.log("💰 Vault ATA:", treasury.treasuryAta.toBase58());
    console.log("💧 Liquidity:", treasury.totalLiquidity.toNumber());
    console.log("📉 Borrowed:", treasury.totalBorrowed.toNumber());
    console.log("-----------------------------\n");

    expect(treasury.totalLiquidity.toNumber()).to.equal(0);
    console.log("✅ Treasury Initialization Test Passed ✅\n");
  });

  // ============================================================
  // ✅ Step 2: Anvesha deposits into Treasury
  // ============================================================
  it("💰 Anvesha Deposits Liquidity", async () => {
    const treasuryBefore = await program.account.treasuryState.fetch(treasuryStatePda);
    console.log("\n💧 Treasury Liquidity Before:", treasuryBefore.totalLiquidity.toNumber());

    // 👩‍💼 Create Anvesha's Token Account (payer = Harshit)
    const anveshaAta = await createAssociatedTokenAccount(
      connection,
      HARSHIT_KEYPAIR,
      liquidityMint,
      ANVESHA_KEYPAIR.publicKey
    );

    // Mint tokens to Anvesha's ATA
    await mintTo(
      connection,
      HARSHIT_KEYPAIR,
      liquidityMint,
      anveshaAta,
      HARSHIT_KEYPAIR.publicKey,
      anveshaDeposit
    );

    const balanceBefore = await getAccount(connection, anveshaAta);
    console.log(`💸 Minted ${Number(balanceBefore.amount) / 1e9} tokens to Anvesha`);

    const [userTreasuryPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("user-deposit"), ANVESHA_KEYPAIR.publicKey.toBuffer()],
      program.programId
    );

    console.log("\n👩‍💼 Anvesha depositing to Treasury...\n");

    const tx = await program.methods
      .depositTreasury(new anchor.BN(anveshaDeposit))
      .accounts({
        treasuryState: treasuryStatePda,
        userTreasury: userTreasuryPda,
        user: ANVESHA_KEYPAIR.publicKey,
        userAta: anveshaAta,
        liquidityMint,
        treasuryAta: treasuryVaultAta,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        owner: HARSHIT_KEYPAIR.publicKey,
      })
      .signers([ANVESHA_KEYPAIR])
      .rpc();

    console.log("✅ Transaction Signature:", tx);

    const treasuryAfter = await program.account.treasuryState.fetch(treasuryStatePda);
    const vaultAccount = await getAccount(connection, treasuryVaultAta);
    const userTreasuryAccount = await program.account.userTreasury.fetch(userTreasuryPda);

    console.log("\n📊 Treasury State After Deposit:");
    console.log("-----------------------------");
    console.log("💧 Before Liquidity:", treasuryBefore.totalLiquidity.toNumber() / 1e9);
    console.log("💰 After Liquidity:", treasuryAfter.totalLiquidity.toNumber() / 1e9);
    console.log("🏦 Vault Balance:", Number(vaultAccount.amount) / 1e9);
    console.log("-----------------------------");

    console.log("\n📝 User Treasury Record:");
    console.log("👤 User:", userTreasuryAccount.user.toBase58());
    console.log("💰 Deposit Amount:", userTreasuryAccount.depositAmount.toNumber() / 1e9);
    console.log("⏰ Deposit Time:", new Date(userTreasuryAccount.depositTime.toNumber() * 1000).toLocaleString());
    console.log("-----------------------------");

    expect(treasuryAfter.totalLiquidity.toNumber()).to.equal(
      treasuryBefore.totalLiquidity.toNumber() + anveshaDeposit
    );
    console.log("\n✅ Anvesha Deposit Test Passed ✅\n");
  });
});
