import { useState } from "react";
import { useProgram, LIQUIDITY_MINT, PROGRAM_ID } from "../anchor/setupAnchor";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import {
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
} from "@solana/spl-token";

export default function InitializeTreasury() {
  const { publicKey } = useWallet();
  const { program, connection, error } = useProgram();

  const [loading, setLoading] = useState(false);
  const [txSignature, setTxSignature] = useState(null);

  // Loading state
  if (!program && !error) {
    return (
      <div className="card p-6">
        <div className="flex items-center space-x-3 text-text-muted">
          <div className="spinner w-4 h-4"></div>
          <span className="text-sm">Loading treasury interface...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="card p-6">
        <div className="flex items-center space-x-3 text-accent-danger">
          <span className="text-xl">⚠️</span>
          <span className="text-sm font-medium">{error}</span>
        </div>
      </div>
    );
  }

  const handleInit = async () => {
    if (!publicKey) return alert("❌ Connect wallet!");

    setLoading(true);
    setTxSignature(null);

    try {
      // Derive PDAs
      const [treasuryStatePda] = PublicKey.findProgramAddressSync(
        [Buffer.from("treasury")],
        PROGRAM_ID
      );

      const [treasuryAuthority] = PublicKey.findProgramAddressSync(
        [Buffer.from("treasury")],
        PROGRAM_ID
      );

      // Get the associated token account address
      const treasuryAta = getAssociatedTokenAddressSync(
        LIQUIDITY_MINT,
        treasuryAuthority,
        true, // allowOwnerOffCurve = true for PDA
        TOKEN_PROGRAM_ID
      );

      console.log("Treasury State PDA:", treasuryStatePda.toBase58());
      console.log("Treasury Authority:", treasuryAuthority.toBase58());
      console.log("Treasury ATA:", treasuryAta.toBase58());

      // Check if ATA already exists
      const ataInfo = await connection.getAccountInfo(treasuryAta);

      if (!ataInfo) {
        // Create ATA first if it doesn't exist
        console.log("Creating treasury ATA...");
        const createAtaIx = createAssociatedTokenAccountInstruction(
          publicKey, // payer
          treasuryAta, // ata
          treasuryAuthority, // owner (PDA)
          LIQUIDITY_MINT, // mint
          TOKEN_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID
        );

        // Send create ATA transaction first
        const createAtaTx = await program.methods
          .initializeTreasury()
          .accounts({
            treasuryState: treasuryStatePda,
            treasuryAuthority,
            liquidityMint: LIQUIDITY_MINT,
            treasuryAta,
            admin: publicKey,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          })
          .preInstructions([createAtaIx]) // ✅ Add create ATA instruction first
          .rpc();

        await connection.confirmTransaction(createAtaTx, "confirmed");
        setTxSignature(createAtaTx);
        alert("✅ Treasury initialized with new ATA!");
      } else {
        // ATA exists, just initialize treasury
        console.log("ATA already exists, initializing treasury...");
        const tx = await program.methods
          .initializeTreasury()
          .accounts({
            treasuryState: treasuryStatePda,
            treasuryAuthority,
            liquidityMint: LIQUIDITY_MINT,
            treasuryAta,
            admin: publicKey,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          })
          .rpc();

        await connection.confirmTransaction(tx, "confirmed");
        setTxSignature(tx);
        alert("✅ Treasury initialized!");
      }
    } catch (err) {
      console.error("Treasury initialization failed:", err);

      // Better error messages
      let errorMsg = err.message;
      if (err.logs) {
        console.error("Program logs:", err.logs);
      }

      if (errorMsg.includes("already in use")) {
        errorMsg = "Treasury already initialized!";
      } else if (errorMsg.includes("AccountNotInitialized")) {
        errorMsg = "Token account not found. Try again.";
      }

      alert(`❌ ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-accent-primary/10 rounded-bl-full -mr-12 -mt-12"></div>

      <div className="relative z-10">
        <div className="flex items-start space-x-4 mb-6">
          <div className="p-3 bg-surface/50 border border-border-muted rounded-xl flex-shrink-0">
            <span className="text-2xl">🏦</span>
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-semibold text-text-primary mb-2">
              Initialize Treasury
            </h3>
            <p className="text-text-muted text-sm leading-relaxed">
              Set up the global liquidity treasury. This is a one-time admin
              operation.
            </p>
          </div>
        </div>

        <button
          onClick={handleInit}
          disabled={loading}
          className={`w-full justify-center py-3.5 px-4 rounded-xl font-medium text-sm transition-all duration-200 flex items-center space-x-3 ${
            loading
              ? "bg-border-muted text-text-muted cursor-not-allowed border border-border-muted"
              : "btn-primary hover:shadow-professional focus:ring-2 focus:ring-accent-primary focus:ring-offset-2 focus:ring-offset-surface"
          }`}
        >
          {loading ? (
            <>
              <div className="spinner w-4 h-4"></div>
              <span>Initializing Treasury...</span>
            </>
          ) : (
            <>
              <span>🏦</span>
              <span>Initialize Treasury</span>
            </>
          )}
        </button>

        {txSignature && (
          <div className="mt-6 pt-4 border-t border-border-muted">
            <div className="flex items-center space-x-3 p-4 bg-accent-success/10 border border-accent-success/20 rounded-lg">
              <span className="text-accent-success text-xl">✅</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-accent-success">
                  Treasury Initialized!
                </p>
                <p className="text-xs text-text-muted truncate mt-1">
                  Transaction: {txSignature.slice(0, 8)}...
                  {txSignature.slice(-8)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border-muted to-transparent"></div>
    </div>
  );
}
