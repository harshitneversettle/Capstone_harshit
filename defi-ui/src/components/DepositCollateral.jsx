import { useState } from "react";
import { useProgram, COLLATERAL_MINT, PROGRAM_ID } from "../anchor/setupAnchor";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import {
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { BN } from "@coral-xyz/anchor";

export default function DepositCollateral({ onSuccess, disabled }) {
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
    if (!publicKey) return alert("❌ Connect wallet!");
    if (!amount || parseFloat(amount) <= 0)
      return alert("❌ Enter valid amount");

    setLoading(true);
    setTxSignature(null);

    try {
      // Collateral tokens have 6 decimals
      const depositAmount = new BN(parseFloat(amount) * 1e6);

      const [poolStatePda] = PublicKey.findProgramAddressSync(
        [Buffer.from("user-pool"), publicKey.toBuffer()],
        PROGRAM_ID
      );

      const [vaultAuthority] = PublicKey.findProgramAddressSync(
        [Buffer.from("vault"), poolStatePda.toBuffer()],
        PROGRAM_ID
      );

      // User's collateral ATA
      const userAta = getAssociatedTokenAddressSync(
        COLLATERAL_MINT,
        publicKey,
        false,
        TOKEN_PROGRAM_ID
      );

      // Vault's collateral ATA
      const vaultAta = getAssociatedTokenAddressSync(
        COLLATERAL_MINT,
        vaultAuthority,
        true,
        TOKEN_PROGRAM_ID
      );

      console.log("Vault Authority:", vaultAuthority.toBase58());
      console.log("Vault ATA:", vaultAta.toBase58());

      const tx = await program.methods
        .deposit(depositAmount)
        .accounts({
          poolState: poolStatePda,
          vaultAuthority: vaultAuthority,
          collateralMint: COLLATERAL_MINT,
          vaultAta: vaultAta,
          userAta: userAta,
          owner: publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log("Deposit Collateral TX:", tx);

      await connection.confirmTransaction(tx, "confirmed");
      setTxSignature(tx);
      alert(`✅ Deposited ${amount} collateral tokens!`);
      setAmount("");

      if (onSuccess) onSuccess();
    } catch (err) {
      console.error("Collateral deposit failed:", err);
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
      <h3 style={{ marginTop: 0, color: "#4CAF50" }}>🔒 Deposit Collateral</h3>
      <p style={{ fontSize: "14px", color: "#666" }}>
        Deposit collateral tokens to enable borrowing
      </p>

      <input
        type="number"
        step="1"
        min="0"
        placeholder="Amount (e.g., 150)"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        disabled={loading || disabled}
        style={{
          padding: "10px",
          width: "100%",
          marginBottom: "10px",
          fontSize: "14px",
          border: "1px solid #ccc",
          borderRadius: "4px",
        }}
      />

      <button
        onClick={handleDeposit}
        disabled={loading || disabled || !amount}
        style={{
          padding: "12px 24px",
          fontSize: "14px",
          fontWeight: "600",
          cursor: loading || disabled ? "not-allowed" : "pointer",
          backgroundColor: loading || disabled ? "#ccc" : "#4CAF50",
          color: "white",
          border: "none",
          borderRadius: "4px",
          width: "100%",
        }}
      >
        {loading ? "⏳ Processing..." : "Deposit Collateral"}
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
