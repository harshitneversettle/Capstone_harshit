import { useMemo } from "react";
import { useConnection, useAnchorWallet } from "@solana/wallet-adapter-react";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import idl from "../idl/capstone_harshit.json";

export const PROGRAM_ID = new PublicKey(
  "EKAaTiK6Fg19wAy9FGXTC171ZtkPCdiK7zrfQ47px5Cf"
);

// Wrapped SOL (for liquidity)
export const LIQUIDITY_MINT = new PublicKey(
  "So11111111111111111111111111111111111111112"
);

// ✅ YOUR COLLATERAL MINT
export const COLLATERAL_MINT = new PublicKey(
  "2mZKkwSXLSojohFELSMkHrTEvMnqfsFp5EBoLqCCzZEU"
);

export function useProgram() {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  return useMemo(() => {
    if (!connection) {
      return {
        provider: null,
        program: null,
        connection: null,
        error: "No connection",
      };
    }

    if (!wallet) {
      return {
        provider: null,
        program: null,
        connection,
        error: "Wallet not connected",
      };
    }

    try {
      const provider = new AnchorProvider(
        connection,
        wallet,
        AnchorProvider.defaultOptions()
      );

      const program = new Program(idl, provider);

      return { provider, program, connection, error: null };
    } catch (err) {
      console.error("Program initialization failed:", err);
      return {
        provider: null,
        program: null,
        connection,
        error: err.message,
      };
    }
  }, [connection, wallet]);
}
