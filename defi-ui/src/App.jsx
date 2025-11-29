import { useState, useEffect } from "react";
import WalletConnection from "./WalletConnection";
import InitializeTreasury from "./components/InitializeTreasury";
import DepositTreasury from "./components/DepositTreasury";
import InitializePool from "./components/InitializePool";
import DepositCollateral from "./components/DepositCollateral";
import Borrow from "./components/Borrow";
import PriceOracle from "./components/PriceOracle";
import { useProgram, PROGRAM_ID } from "./anchor/setupAnchor";
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";

function App() {
  const { program, connection } = useProgram();
  const [protocolInfo, setProtocolInfo] = useState({
    treasuryAddress: null,
    treasuryBalance: 0,
    totalPools: 0,
    loading: true,
  });

  useEffect(() => {
    const fetchProtocolInfo = async () => {
      if (!program || !connection) return;

      try {
        const [treasuryPda] = PublicKey.findProgramAddressSync(
          [Buffer.from("treasury")],
          PROGRAM_ID
        );

        // Get the treasury's token account (ATA) for liquidity mint
        const treasuryTokenAccount = getAssociatedTokenAddressSync(
          LIQUIDITY_MINT,
          treasuryPda,
          true, // allowOwnerOffCurve for PDA
          TOKEN_PROGRAM_ID
        );

        // Fetch the token account balance
        const tokenAccountInfo = await connection.getTokenAccountBalance(
          treasuryTokenAccount
        );
        const balance = tokenAccountInfo.value.uiAmount || 0;

        setProtocolInfo({
          treasuryAddress: treasuryPda.toBase58(),
          treasuryBalance: balance,
          totalPools: 1,
          loading: false,
        });
      } catch (error) {
        console.error("Failed to fetch protocol info:", error);
        setProtocolInfo((prev) => ({ ...prev, loading: false }));
      }
    };

    fetchProtocolInfo();

    const interval = setInterval(fetchProtocolInfo, 10000);

    return () => clearInterval(interval);
  }, [program, connection]);

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #000000 100%)",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        position: "sticky", // ✅ Keeps it fixed while scrolling
        top: 0, // ✅ Sticks to top
        height: "100vh",
      }}
    >
      <PriceOracle />
      {/* LEFT SIDEBAR - Protocol Information */}
      <aside
        style={{
          width: "380px",
          minWidth: "380px",
          padding: "24px",
          background:
            "linear-gradient(180deg, rgba(10,10,10,0.98), rgba(5,5,5,0.99))",
          borderRight: "1px solid rgba(255,255,255,0.06)",
          backdropFilter: "blur(20px)",
          overflowY: "auto",
          position: "sticky",
          top: 0,
          height: "100vh",
          boxShadow: "inset -1px 0 20px rgba(0,0,0,0.5)",
        }}
      >
        <ProtocolInfoSidebar info={protocolInfo} />
      </aside>

      {/* CENTER - Main Protocol Content */}
      <div
        style={{
          flex: 1,
          padding: "48px 24px",
          overflowY: "auto",
          background: "rgba(0,0,0,0.3)",
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <WalletConnection>
            <div
              style={{
                padding: "40px",
                borderRadius: "24px",
                background:
                  "linear-gradient(145deg, rgba(15,15,15,0.95), rgba(0,0,0,0.98))",
                border: "1px solid rgba(255,255,255,0.04)",
                backdropFilter: "blur(24px)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
              }}
            >
              {/* HEADER */}
              <header
                style={{
                  padding: "40px",
                  borderRadius: "20px",
                  background:
                    "linear-gradient(145deg, rgba(20,20,20,0.8), rgba(10,10,10,0.9))",
                  border: "1px solid rgba(255,255,255,0.08)",
                  marginBottom: "48px",
                  textAlign: "center",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
                }}
              >
                <h1
                  style={{
                    color: "#ffffff",
                    margin: 0,
                    fontSize: "48px",
                    fontWeight: "900",
                    letterSpacing: "-0.5px",
                    marginBottom: "16px",
                    textShadow: "0 2px 4px rgba(0,0,0,0.5)",
                  }}
                >
                  🏦 DeFi Lending Protocol
                </h1>

                <p
                  style={{
                    marginTop: "16px",
                    color: "rgba(255,255,255,0.7)",
                    fontSize: "18px",
                    fontWeight: "300",
                    letterSpacing: "0.5px",
                  }}
                >
                  Secure • Fast • Over-Collateralized Borrowing on Solana
                </p>
              </header>

              <main
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "48px",
                }}
              >
                {/* ADMIN SECTION */}
                <SectionCard
                  title="🔧 Admin Setup (Steps 1–2)"
                  subtitle="Initialize the treasury and provide liquidity before users can borrow"
                  color="#ff6b6b"
                >
                  <div
                    style={{
                      display: "grid",
                      gap: "28px",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(400px, 1fr))",
                    }}
                  >
                    <InitializeTreasury />
                    <DepositTreasury />
                  </div>
                </SectionCard>

                {/* USER SECTION */}
                <SectionCard
                  title="👤 User Operations (Steps 3–5)"
                  subtitle="Initialize your pool, deposit collateral, and borrow instantly"
                  color="#74c0fc"
                >
                  <div
                    style={{
                      display: "grid",
                      gap: "28px",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(340px, 1fr))",
                    }}
                  >
                    <InitializePool />
                    <DepositCollateral />
                    <Borrow />
                  </div>
                </SectionCard>

                {/* INFO CARDS */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                    gap: "24px",
                    marginTop: "24px",
                  }}
                >
                  <InfoCard
                    icon="💰"
                    title="How It Works"
                    description="Deposit collateral & borrow instantly from the treasury."
                  />
                  <InfoCard
                    icon="🔒"
                    title="Secure"
                    description="All loans require over-collateralization for safety."
                  />
                  <InfoCard
                    icon="⚡"
                    title="Fast"
                    description="Solana enables sub-second finality & low fees."
                  />
                </div>
              </main>
            </div>
          </WalletConnection>
        </div>
      </div>
    </div>
  );
}

/* ---------------- SIDEBAR PROTOCOL INFO ---------------- */
function ProtocolInfoSidebar({ info }) {
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert("✅ Copied to clipboard!");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Sidebar Title */}
      <div
        style={{
          padding: "24px",
          borderRadius: "16px",
          background:
            "linear-gradient(145deg, rgba(20,20,20,0.8), rgba(10,10,10,0.9))",
          border: "1px solid rgba(255,255,255,0.08)",
          textAlign: "center",
          boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
        }}
      >
        <span
          style={{ fontSize: "36px", display: "block", marginBottom: "12px" }}
        >
          ℹ️
        </span>
        <h2
          style={{
            margin: 0,
            fontSize: "22px",
            fontWeight: "800",
            color: "#ffffff",
          }}
        >
          Protocol Info
        </h2>
        <p
          style={{
            margin: "10px 0 0 0",
            fontSize: "13px",
            color: "rgba(255,255,255,0.6)",
          }}
        >
          Real-time protocol metrics
        </p>
      </div>

      {/* Protocol Stats */}
      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        <SidebarInfoBox
          icon="🏛️"
          label="Treasury Address"
          value={info.loading ? "Loading..." : info.treasuryAddress}
          copyable={!info.loading && info.treasuryAddress}
          onCopy={() => copyToClipboard(info.treasuryAddress)}
        />

        <SidebarInfoBox
          icon="💵"
          label="Total Liquidity"
          value={
            info.loading
              ? "Loading..."
              : `${info.treasuryBalance.toFixed(4)} SOL`
          }
          color="#10b981"
        />

        <SidebarInfoBox
          icon="🏊"
          label="Active Pools"
          value={info.loading ? "Loading..." : info.totalPools}
          color="#3b82f6"
        />

        <SidebarInfoBox
          icon="📊"
          label="Collateral Ratio"
          value="150%"
          color="#f59e0b"
        />

        <SidebarInfoBox
          icon="🔑"
          label="Program ID"
          value={PROGRAM_ID.toBase58()}
          copyable={true}
          onCopy={() => copyToClipboard(PROGRAM_ID.toBase58())}
        />

        <SidebarInfoBox
          icon="👥"
          label="Liquidators"
          value="Auto-Liquidation"
          subtitle="Smart contract enforced"
          color="#a855f7"
        />
      </div>
    </div>
  );
}

/* ---------------- SIDEBAR INFO BOX ---------------- */
function SidebarInfoBox({
  icon,
  label,
  value,
  subtitle,
  color,
  copyable,
  onCopy,
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (onCopy) {
      onCopy();
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      style={{
        padding: "16px",
        borderRadius: "14px",
        background:
          "linear-gradient(145deg, rgba(20,20,20,0.7), rgba(10,10,10,0.8))",
        border: "1px solid rgba(255,255,255,0.06)",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        backdropFilter: "blur(12px)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background =
          "linear-gradient(145deg, rgba(25,25,25,0.8), rgba(15,15,15,0.9))";
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 8px 25px rgba(0,0,0,0.4)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background =
          "linear-gradient(145deg, rgba(20,20,20,0.7), rgba(10,10,10,0.8))";
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "10px",
        }}
      >
        <span style={{ fontSize: "18px" }}>{icon}</span>
        <span
          style={{
            fontSize: "11px",
            color: "rgba(255,255,255,0.7)",
            textTransform: "uppercase",
            letterSpacing: "0.8px",
            flex: 1,
            fontWeight: "500",
          }}
        >
          {label}
        </span>
        {copyable && (
          <button
            onClick={handleCopy}
            style={{
              padding: "6px 10px",
              fontSize: "11px",
              background: copied ? "#10b981" : "rgba(255,255,255,0.08)",
              color: "white",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "6px",
              cursor: "pointer",
              transition: "all 0.2s ease",
              fontWeight: "600",
            }}
            onMouseEnter={(e) => {
              e.target.style.background = copied
                ? "#10b981"
                : "rgba(255,255,255,0.15)";
              e.target.style.transform = "scale(1.05)";
            }}
            onMouseLeave={(e) => {
              e.target.style.background = copied
                ? "#10b981"
                : "rgba(255,255,255,0.08)";
              e.target.style.transform = "scale(1)";
            }}
          >
            {copied ? "✅" : "📋"}
          </button>
        )}
      </div>

      <div
        style={{
          fontSize: copyable ? "12px" : "18px",
          fontWeight: "800",
          color: color || "#ffffff",
          fontFamily: copyable ? "monospace" : "inherit",
          wordBreak: "break-all",
          lineHeight: "1.3",
          textShadow: "0 1px 2px rgba(0,0,0,0.5)",
        }}
      >
        {copyable && value?.length > 30
          ? `${value.slice(0, 6)}...${value.slice(-6)}`
          : value}
      </div>

      {subtitle && (
        <div
          style={{
            fontSize: "11px",
            color: "rgba(255,255,255,0.5)",
            marginTop: "6px",
            fontStyle: "italic",
          }}
        >
          {subtitle}
        </div>
      )}
    </div>
  );
}

/* ---------------- SECTION CARD ---------------- */
function SectionCard({ title, subtitle, color, children }) {
  return (
    <section
      style={{
        padding: "36px",
        borderRadius: "22px",
        background:
          "linear-gradient(145deg, rgba(15,15,15,0.9), rgba(5,5,5,0.95))",
        border: "1px solid rgba(255,255,255,0.06)",
        backdropFilter: "blur(20px)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        position: "relative",
        overflow: "hidden",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "0 12px 40px rgba(0,0,0,0.6)";
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.5)";
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "4px",
          background: `linear-gradient(90deg, ${color}, transparent)`,
        }}
      />
      <h2
        style={{
          marginTop: 0,
          marginBottom: "12px",
          color,
          fontSize: "28px",
          fontWeight: "800",
          letterSpacing: "-0.2px",
        }}
      >
        {title}
      </h2>
      <p
        style={{
          color: "rgba(255,255,255,0.7)",
          marginBottom: "30px",
          fontSize: "16px",
          lineHeight: "1.5",
        }}
      >
        {subtitle}
      </p>
      {children}
    </section>
  );
}

/* ---------------- INFO CARD ---------------- */
function InfoCard({ icon, title, description }) {
  return (
    <div
      style={{
        padding: "28px",
        borderRadius: "18px",
        background:
          "linear-gradient(145deg, rgba(20,20,20,0.8), rgba(10,10,10,0.9))",
        border: "1px solid rgba(255,255,255,0.08)",
        backdropFilter: "blur(16px)",
        color: "#ffffff",
        textAlign: "center",
        transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
        boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
        cursor: "pointer",
        position: "relative",
        overflow: "hidden",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-8px) scale(1.02)";
        e.currentTarget.style.boxShadow =
          "0 16px 40px rgba(0,0,0,0.6), 0 0 20px rgba(128,0,255,0.2)";
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0) scale(1)";
        e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.4)";
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
      }}
    >
      <div
        style={{
          fontSize: "40px",
          marginBottom: "16px",
          filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))",
        }}
      >
        {icon}
      </div>
      <h3
        style={{
          marginBottom: "16px",
          fontSize: "20px",
          fontWeight: "700",
          letterSpacing: "-0.1px",
        }}
      >
        {title}
      </h3>
      <p
        style={{
          opacity: 0.8,
          fontSize: "15px",
          lineHeight: "1.5",
          fontWeight: "300",
        }}
      >
        {description}
      </p>
    </div>
  );
}

export default App;
