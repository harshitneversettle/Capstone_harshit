import { useState } from "react";
import { useProgram, LIQUIDITY_MINT, PROGRAM_ID } from "../anchor/setupAnchor";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import {
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
} from "@solana/spl-token";

export default function Borrow({ disabled, onSuccess }) {
  const { publicKey, sendTransaction } = useWallet();
  const { program, connection, error } = useProgram();
  const [loading, setLoading] = useState(false);
  const [txSignature, setTxSignature] = useState(null);

  if (!program && !error) {
    return (
      <div style={{ padding: "20px" }}>
        <p>⏳ Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "20px" }}>
        <p>⚠️ {error}</p>
      </div>
    );
  }

  const handleBorrow = async () => {
    if (!publicKey) return alert("❌ Connect wallet!");

    setLoading(true);
    setTxSignature(null);

    try {
      const [poolStatePda] = PublicKey.findProgramAddressSync(
        [Buffer.from("user-pool"), publicKey.toBuffer()],
        PROGRAM_ID
      );

      const [treasuryStatePda] = PublicKey.findProgramAddressSync(
        [Buffer.from("treasury")],
        PROGRAM_ID
      );

      const [treasuryAuthority] = PublicKey.findProgramAddressSync(
        [Buffer.from("treasury")],
        PROGRAM_ID
      );

      const userAta = getAssociatedTokenAddressSync(
        LIQUIDITY_MINT,
        publicKey,
        false,
        TOKEN_PROGRAM_ID
      );

      const treasuryAta = getAssociatedTokenAddressSync(
        LIQUIDITY_MINT,
        treasuryAuthority,
        true,
        TOKEN_PROGRAM_ID
      );

      // Check if user ATA exists; create if missing
      const ataInfo = await connection.getAccountInfo(userAta);
      if (!ataInfo) {
        const createAtaIx = createAssociatedTokenAccountInstruction(
          publicKey, // payer
          userAta, // ATA address
          publicKey, // owner
          LIQUIDITY_MINT
        );

        const tx = new Transaction().add(createAtaIx);
        const sig = await sendTransaction(tx, connection);
        await connection.confirmTransaction(sig, "confirmed");
        console.log("Created user ATA with tx:", sig);
      }

      // Call borrow method
      const tx = await program.methods
        .borrow()
        .accounts({
          poolState: poolStatePda,
          treasuryState: treasuryStatePda,
          loanMint: LIQUIDITY_MINT,
          userAta: userAta,
          owner: publicKey,
          treasuryAta: treasuryAta,
          treasuryAuthority: treasuryAuthority,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        })
        .rpc();

      console.log("Borrow TX:", tx);

      await connection.confirmTransaction(tx, "confirmed");
      setTxSignature(tx);
      alert("✅ Borrowed 1 SOL successfully!");

      if (onSuccess) onSuccess();
    } catch (err) {
      console.error("Borrow failed:", err);
      alert(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        padding: "20px",
        border: "1px solid #ddd",
        borderRadius: "8px",
        opacity: disabled ? 0.5 : 1,
        pointerEvents: disabled ? "none" : "auto",
      }}
    >
      <h3 style={{ marginTop: 0, color: "#9C27B0" }}>💸 Borrow Assets</h3>
      <p style={{ fontSize: "14px", color: "#666" }}>
        Borrow 1 SOL against your collateral
      </p>

      <button
        onClick={handleBorrow}
        disabled={loading || disabled}
        style={{
          padding: "12px 24px",
          fontSize: "14px",
          fontWeight: "600",
          cursor: loading || disabled ? "not-allowed" : "pointer",
          backgroundColor: loading || disabled ? "#ccc" : "#9C27B0",
          color: "white",
          border: "none",
          borderRadius: "4px",
          width: "100%",
        }}
      >
        {loading ? "⏳ Processing..." : "Borrow 1 SOL"}
      </button>

      {txSignature && (
        <div
          style={{
            marginTop: "15px",
            padding: "10px",
            backgroundColor: "#e8f5e9",
            borderRadius: "4px",
          }}
        >
          <p style={{ margin: 0, color: "#2e7d32", fontSize: "13px" }}>
            ✅ Success!
          </p>
        </div>
      )}

      {disabled && (
        <p
          style={{
            fontSize: "12px",
            color: "#f44336",
            marginTop: "10px",
          }}
        >
          ⚠️ Deposit collateral first before borrowing
        </p>
      )}
    </div>
  );
}
