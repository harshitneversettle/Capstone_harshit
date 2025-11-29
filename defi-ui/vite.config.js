import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  define: {
    "process.env": {},
    global: "globalThis",
  },
  optimizeDeps: {
    include: [
      "@solana/wallet-adapter-base",
      "@solana/wallet-adapter-react",
      "@solana/wallet-adapter-react-ui",
      "@solana/wallet-adapter-wallets",
      "@solana/web3.js",
      "@coral-xyz/anchor",
    ],
  },
});
