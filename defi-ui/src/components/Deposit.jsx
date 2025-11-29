import { useState } from "react";
import { useProgram } from "../anchor/setupAnchor";
import { BN } from "@coral-xyz/anchor";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, LAMPORTS_PER_SOL, SystemProgram } from "@solana/web3.js";

export default function Deposit() {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [txSignature, setTxSignature] = useState(null);

  const { program, connection, error } = useProgram();
  const { publicKey } = useWallet();

  // Loading state
  if (!program && !error) {
    return (
      <div
        style={{
          marginTop: "30px",
          padding: "20px",
          border: "1px solid #ddd",
          borderRadius: "8px",
        }}
      >
        <p>⏳ Loading program...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div
        style={{
          marginTop: "30px",
          padding: "20px",
          border: "1px solid #f44336",
          color: "#f44336",
          borderRadius: "8px",
        }}
      >
        <p>⚠️ {error}</p>
        {error.includes("Wallet") && (
          <p>Please connect your wallet to continue.</p>
        )}
      </div>
    );
  }

  const handleDeposit = async () => {
    // Validation
    if (!program || !publicKey) {
      return alert("❌ Wallet not connected");
    }

    if (!amount || parseFloat(amount) <= 0) {
      return alert("❌ Please enter a valid amount");
    }

    // Minimum deposit validation
    if (parseFloat(amount) < 0.001) {
      return alert("❌ Minimum deposit is 0.001 SOL");
    }

    setLoading(true);
    setTxSignature(null);

    try {
      // Convert SOL to lamports using BN for precision
      const depositAmount = new BN(parseFloat(amount) * LAMPORTS_PER_SOL);

      // Derive PDAs - Anchor auto-resolves from IDL if seeds are defined
      const [treasuryPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("treasury")],
        program.programId
      );

      const [userAccountPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("user"), publicKey.toBuffer()],
        program.programId
      );

      console.log("Treasury PDA:", treasuryPDA.toBase58());
      console.log("User Account PDA:", userAccountPDA.toBase58());

      // Send transaction - Anchor auto-fills derivable accounts from IDL
      const tx = await program.methods
        .deposit(depositAmount)
        .accounts({
          user: publicKey,
          treasury: treasuryPDA,
          userAccount: userAccountPDA,
          systemProgram: SystemProgram.programId, // Required for SOL transfers
        })
        .rpc();

      console.log("Transaction signature:", tx);

      // Confirm transaction with modern approach and finalized commitment
      const latestBlockhash = await connection.getLatestBlockhash("finalized");
      await connection.confirmTransaction(
        {
          signature: tx,
          blockhash: latestBlockhash.blockhash,
          lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
        },
        "finalized" // Use finalized for maximum security
      );

      setTxSignature(tx);
      alert(`✅ Deposited ${amount} SOL successfully!`);
      setAmount(""); // Clear input
    } catch (err) {
      console.error("Deposit failed:", err);

      // Enhanced user-friendly error messages
      let errorMsg = "Deposit failed";

      if (err.message?.includes("User rejected")) {
        errorMsg = "Transaction cancelled by user";
      } else if (err.message?.includes("insufficient")) {
        errorMsg = "Insufficient balance (check SOL balance + gas fees)";
      } else if (err.message?.includes("blockhash not found")) {
        errorMsg = "Transaction expired. Please try again";
      } else if (err.message?.includes("0x1")) {
        errorMsg = "Insufficient funds for rent exemption";
      } else if (err.message?.includes("Account does not exist")) {
        errorMsg = "Treasury not initialized. Contact admin";
      } else if (err.message) {
        errorMsg = err.message;
      }

      alert(`❌ ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        marginTop: "30px",
        padding: "20px",
        border: "1px solid #ddd",
        borderRadius: "8px",
        backgroundColor: "#f9f9f9",
      }}
    >
      <h2 style={{ marginTop: 0, color: "#333" }}>💰 Deposit to Treasury</h2>

      <div style={{ marginTop: "15px" }}>
        <input
          type="number"
          step="0.001"
          min="0.001"
          placeholder="Amount in SOL (e.g., 0.5)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          disabled={loading}
          style={{
            padding: "12px",
            marginRight: "10px",
            width: "220px",
            fontSize: "14px",
            border: "1px solid #ccc",
            borderRadius: "4px",
          }}
        />

        <button
          onClick={handleDeposit}
          disabled={loading || !amount || parseFloat(amount) <= 0}
          style={{
            padding: "12px 24px",
            fontSize: "14px",
            fontWeight: "600",
            cursor: loading ? "not-allowed" : "pointer",
            backgroundColor: loading ? "#ccc" : "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "4px",
            transition: "all 0.3s ease",
          }}
          onMouseEnter={(e) => {
            if (!loading && amount && parseFloat(amount) > 0) {
              e.target.style.backgroundColor = "#45a049";
            }
          }}
          onMouseLeave={(e) => {
            if (!loading) {
              e.target.style.backgroundColor = "#4CAF50";
            }
          }}
        >
          {loading ? "⏳ Processing..." : "Deposit SOL"}
        </button>
      </div>

      {/* Transaction status */}
      {txSignature && (
        <div
          style={{
            marginTop: "20px",
            padding: "15px",
            backgroundColor: "#e8f5e9",
            borderRadius: "4px",
            border: "1px solid #4CAF50",
          }}
        >
          <p
            style={{
              margin: "0 0 10px 0",
              color: "#2e7d32",
              fontWeight: "600",
            }}
          >
            ✅ Transaction Confirmed!
          </p>
          <a
            href={`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "#2196F3",
              textDecoration: "none",
              fontSize: "13px",
            }}
          >
            🔗 View on Solana Explorer: {txSignature.slice(0, 8)}...
            {txSignature.slice(-8)}
          </a>
        </div>
      )}

      {/* Helpful info */}
      <div
        style={{
          marginTop: "20px",
          padding: "15px",
          fontSize: "12px",
          color: "#666",
          backgroundColor: "#fff",
          borderRadius: "4px",
          border: "1px solid #e0e0e0",
        }}
      >
        <p style={{ margin: "5px 0" }}>
          💡 <strong>Connected Wallet:</strong>{" "}
          {publicKey?.toBase58().slice(0, 4)}...
          {publicKey?.toBase58().slice(-4)}
        </p>
        <p style={{ margin: "5px 0" }}>
          💡 <strong>Minimum Deposit:</strong> 0.001 SOL
        </p>
        <p style={{ margin: "5px 0" }}>
          💡 <strong>Network:</strong> Devnet (Switch for mainnet)
        </p>
      </div>
    </div>
  );
}
