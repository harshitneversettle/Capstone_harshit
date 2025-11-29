import { useState } from "react";
import { useProgram, LIQUIDITY_MINT, PROGRAM_ID } from "../anchor/setupAnchor";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import {
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { BN } from "@coral-xyz/anchor";

export default function DepositTreasury() {
  const { publicKey } = useWallet();
  const { program, connection, error } = useProgram();
  const [amount, setAmount] = useState("");
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

  const handleDeposit = async () => {
    if (!publicKey) return alert("❌ Connect wallet first!");
    if (!amount || parseFloat(amount) <= 0)
      return alert("❌ Enter valid amount");

    setLoading(true);
    setTxSignature(null);

    try {
      const depositAmount = new BN(parseFloat(amount) * LAMPORTS_PER_SOL);

      // Treasury State PDA
      const [treasuryStatePda] = PublicKey.findProgramAddressSync(
        [Buffer.from("treasury")],
        PROGRAM_ID
      );

      // User Treasury PDA (per user)
      const [userTreasuryPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("user-deposit"), publicKey.toBuffer()],
        PROGRAM_ID
      );

      // Treasury Authority (same as treasury state in your case)
      const [treasuryAuthority] = PublicKey.findProgramAddressSync(
        [Buffer.from("treasury")],
        PROGRAM_ID
      );

      // User's WSOL ATA
      const userAta = getAssociatedTokenAddressSync(
        LIQUIDITY_MINT,
        publicKey,
        false,
        TOKEN_PROGRAM_ID
      );

      // Treasury's WSOL ATA
      const treasuryAta = getAssociatedTokenAddressSync(
        LIQUIDITY_MINT,
        treasuryAuthority,
        true,
        TOKEN_PROGRAM_ID
      );

      console.log("Depositing to treasury...");
      console.log("Amount:", depositAmount.toString());
      console.log("Treasury State:", treasuryStatePda.toBase58());
      console.log("User Treasury:", userTreasuryPda.toBase58());
      console.log("Treasury Authority:", treasuryAuthority.toBase58());
      console.log("User ATA:", userAta.toBase58());
      console.log("Treasury ATA:", treasuryAta.toBase58());

      const tx = await program.methods
        .depositTreasury(depositAmount)
        .accounts({
          treasuryState: treasuryStatePda,
          userTreasury: userTreasuryPda, // ✅ Added this!
          treasuryAuthority: treasuryAuthority, // ✅ Added this!
          user: publicKey,
          userAta: userAta,
          liquidityMint: LIQUIDITY_MINT,
          treasuryAta: treasuryAta,
          systemProgram: SystemProgram.programId,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc({
          skipPreflight: true,
          commitment: "processed",
        });

      console.log("Deposit Treasury TX:", tx);

      await connection.confirmTransaction(tx, "processed");
      setTxSignature(tx);
      alert(`✅ Deposited ${amount} SOL to treasury!`);
      setAmount("");
    } catch (err) {
      console.error("Treasury deposit failed:", err);

      // ✅ Log full error details
      if (err.logs) {
        console.error("Transaction logs:", err.logs);
      }

      alert(`❌ ${err.message || "Deposit failed"}`);
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
      }}
    >
      <h3 style={{ marginTop: 0, color: "#FF9800" }}>💰 Add Liquidity</h3>
      <p style={{ fontSize: "14px", color: "#666" }}>
        Deposit WSOL to provide lending liquidity
      </p>

      <input
        type="number"
        step="0.1"
        min="0"
        placeholder="Amount in SOL (e.g., 10)"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        disabled={loading}
        style={{
          padding: "10px",
          width: "100%",
          marginBottom: "10px",
          fontSize: "14px",
          border: "1px solid #ccc",
          borderRadius: "4px",
          boxSizing: "border-box",
        }}
      />

      <button
        onClick={handleDeposit}
        disabled={loading || !amount}
        style={{
          padding: "12px 24px",
          fontSize: "14px",
          fontWeight: "600",
          cursor: loading || !amount ? "not-allowed" : "pointer",
          backgroundColor: loading || !amount ? "#ccc" : "#FF9800",
          color: "white",
          border: "none",
          borderRadius: "4px",
          width: "100%",
        }}
      >
        {loading ? "⏳ Processing..." : "Deposit Liquidity"}
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
    </div>
  );
}
