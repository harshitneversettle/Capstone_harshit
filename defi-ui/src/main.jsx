import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { Buffer } from "buffer";

// ✅ Polyfill global objects for Solana/Anchor
window.Buffer = Buffer;
window.process = window.process || { env: {} };
window.global = window.global || window;

// Suppress Phantom Ethereum warnings
const originalError = console.error;
console.error = (...args) => {
  const errorString = args[0]?.toString() || "";
  if (errorString.includes("ethereum") || errorString.includes("evmAsk")) {
    return;
  }
  originalError.apply(console, args);
};

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
