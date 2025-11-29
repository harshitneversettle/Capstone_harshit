import { useState } from "react";
import {
  useProgram,
  COLLATERAL_MINT,
  LIQUIDITY_MINT,
  PROGRAM_ID,
} from "../anchor/setupAnchor";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, SystemProgram } from "@solana/web3.js";

export default function InitializePool({ onSuccess, disabled }) {
  const { publicKey } = useWallet();
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

  const handleInit = async () => {
    if (!publicKey) return alert("❌ Connect wallet!");

    setLoading(true);
    setTxSignature(null);

    try {
      const [poolStatePda] = PublicKey.findProgramAddressSync(
        [Buffer.from("user-pool"), publicKey.toBuffer()],
        PROGRAM_ID
      );

      console.log("Pool State PDA:", poolStatePda.toBase58());

      const tx = await program.methods
        .initialize()
        .accounts({
          poolState: poolStatePda,
          owner: publicKey,
          collateralMint: COLLATERAL_MINT,
          loanMint: LIQUIDITY_MINT,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log("Initialize Pool TX:", tx);

      await connection.confirmTransaction(tx, "confirmed");
      setTxSignature(tx);
      alert("✅ Pool initialized!");

      if (onSuccess) onSuccess();
    } catch (err) {
      console.error("Pool initialization failed:", err);
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
      <h3 style={{ marginTop: 0, color: "#2196F3" }}>🏊 Initialize Pool</h3>
      <p style={{ fontSize: "14px", color: "#666" }}>
        Create your personal lending pool
      </p>

      <button
        onClick={handleInit}
        disabled={loading || disabled}
        style={{
          padding: "12px 24px",
          fontSize: "14px",
          fontWeight: "600",
          cursor: loading || disabled ? "not-allowed" : "pointer",
          backgroundColor: loading || disabled ? "#ccc" : "#2196F3",
          color: "white",
          border: "none",
          borderRadius: "4px",
          width: "100%",
        }}
      >
        {loading ? "⏳ Initializing..." : "Initialize Pool"}
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
