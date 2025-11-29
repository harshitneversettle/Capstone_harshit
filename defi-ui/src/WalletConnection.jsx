import { useMemo } from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import {
  PhantomWalletAdapter,
  BackpackWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import {
  WalletModalProvider,
  WalletMultiButton,
} from "@solana/wallet-adapter-react-ui";

import "@solana/wallet-adapter-react-ui/styles.css";

export default function WalletConnection({ children }) {
  // ✅ Localnet endpoint
  const endpoint = useMemo(() => "http://127.0.0.1:8899", []);

  // ✅ Add Backpack wallet
  const wallets = useMemo(
    () => [
      new BackpackWalletAdapter(),
      new PhantomWalletAdapter(), // Keep Phantom as backup
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <div
            style={{
              padding: "20px",
              backgroundColor: "#1a1a2e",
              position: "sticky",
              top: 0,
              zIndex: 1000,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderRadius: "20px",
              border: "1px solid white",
              marginBottom: "20px",
            }}
          >
            <h2 style={{ color: "white", margin: 0 }}>🏦 DeFi Lending</h2>
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <span
                style={{
                  color: "#4CAF50",
                  fontSize: "12px",
                  padding: "5px 10px",
                  backgroundColor: "rgba(76, 175, 80, 0.1)",
                  borderRadius: "4px",
                }}
              >
                🟢 Localnet
              </span>
              <WalletMultiButton />
            </div>
          </div>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
