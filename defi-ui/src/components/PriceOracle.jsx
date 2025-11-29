import { useState, useEffect } from "react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

export default function PriceOracle() {
  const [prices, setPrices] = useState({
    solInr: null,
    usdcInr: null,
    loading: true,
    error: null,
    lastUpdated: null,
  });

  // Fetch prices from CoinGecko
  const fetchPrices = async () => {
    try {
      const response = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=solana,usd-coin&vs_currencies=inr&include_24hr_change=true"
      );

      if (!response.ok) {
        throw new Error("Failed to fetch prices");
      }

      const data = await response.json();

      setPrices({
        solInr: {
          price: data.solana?.inr || 0,
          change24h: data.solana?.inr_24h_change || 0,
        },
        usdcInr: {
          price: data["usd-coin"]?.inr || 0,
          change24h: data["usd-coin"]?.inr_24h_change || 0,
        },
        loading: false,
        error: null,
        lastUpdated: new Date(),
      });
    } catch (error) {
      console.error("Price fetch error:", error);
      setPrices((prev) => ({
        ...prev,
        loading: false,
        error: "Failed to fetch prices",
      }));
    }
  };

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  if (prices.loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <PriceCardSkeleton />
        <PriceCardSkeleton />
      </div>
    );
  }

  if (prices.error) {
    return (
      <div
        style={{
          padding: "12px",
          borderRadius: "8px",
          background: "rgba(239, 68, 68, 0.1)",
          border: "1px solid rgba(239, 68, 68, 0.3)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            color: "#ef4444",
          }}
        >
          <span>⚠️</span>
          <span style={{ fontSize: "12px" }}>{prices.error}</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {/* SOL Price Card */}
      <PriceCard
        icon="◎"
        name="Solana"
        symbol="SOL"
        price={prices.solInr?.price}
        change24h={prices.solInr?.change24h}
        color="#3b82f6"
        bgGradient="linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(59, 130, 246, 0.05))"
      />

      {/* USDC Price Card */}
      <PriceCard
        icon="💵"
        name="USD Coin"
        symbol="USDC"
        price={prices.usdcInr?.price}
        change24h={prices.usdcInr?.change24h}
        color="#10b981"
        bgGradient="linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(16, 185, 129, 0.05))"
      />
    </div>
  );
}

// Professional Price Card Component
function PriceCard({
  icon,
  name,
  symbol,
  price,
  change24h,
  color,
  bgGradient,
}) {
  const isPositive = change24h >= 0;
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        padding: "14px",
        borderRadius: "12px",
        background: isHovered
          ? "rgba(255,255,255,0.08)"
          : "rgba(255,255,255,0.04)",
        border: `1px solid ${
          isHovered ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.08)"
        }`,
        transition: "all 0.3s ease",
        cursor: "pointer",
        position: "relative",
        overflow: "hidden",
        boxShadow: isHovered
          ? "0 4px 12px rgba(0,0,0,0.3)"
          : "0 2px 6px rgba(0,0,0,0.2)",
      }}
    >
      {/* Gradient Overlay */}
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: "100px",
          height: "100px",
          background: bgGradient,
          borderRadius: "0 12px 0 100%",
          opacity: isHovered ? 0.4 : 0.2,
          transition: "opacity 0.3s ease",
        }}
      ></div>

      {/* Content */}
      <div style={{ position: "relative", zIndex: 1 }}>
        {/* Header Row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "12px",
          }}
        >
          {/* Token Info */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                background: `${color}15`,
                border: `1px solid ${color}40`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "16px",
              }}
            >
              {icon}
            </div>
            <div>
              <h4
                style={{
                  margin: 0,
                  fontSize: "13px",
                  fontWeight: "600",
                  color: "white",
                  lineHeight: "1.2",
                }}
              >
                {name}
              </h4>
              <p
                style={{
                  margin: 0,
                  fontSize: "10px",
                  color: "rgba(255,255,255,0.5)",
                  letterSpacing: "0.3px",
                }}
              >
                {symbol}/INR
              </p>
            </div>
          </div>

          {/* Live Indicator */}
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <div
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "#10b981",
                animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
              }}
            ></div>
            <span
              style={{
                fontSize: "9px",
                color: "rgba(255,255,255,0.5)",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Live
            </span>
          </div>
        </div>

        {/* Price Display */}
        <div style={{ marginBottom: "10px" }}>
          <div
            style={{
              fontSize: "20px",
              fontWeight: "700",
              color: "white",
              fontFamily: "monospace",
              letterSpacing: "-0.5px",
            }}
          >
            ₹
            {price?.toLocaleString("en-IN", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
        </div>

        {/* 24h Change */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div
            style={{
              padding: "4px 8px",
              borderRadius: "6px",
              background: isPositive
                ? "rgba(16, 185, 129, 0.15)"
                : "rgba(239, 68, 68, 0.15)",
              border: `1px solid ${
                isPositive
                  ? "rgba(16, 185, 129, 0.4)"
                  : "rgba(239, 68, 68, 0.4)"
              }`,
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <span
              style={{
                fontSize: "10px",
                color: isPositive ? "#10b981" : "#ef4444",
              }}
            >
              {isPositive ? "▲" : "▼"}
            </span>
            <span
              style={{
                fontSize: "11px",
                fontWeight: "600",
                color: isPositive ? "#10b981" : "#ef4444",
                fontFamily: "monospace",
              }}
            >
              {Math.abs(change24h).toFixed(2)}%
            </span>
          </div>
          <span
            style={{
              fontSize: "10px",
              color: "rgba(255,255,255,0.4)",
              textTransform: "uppercase",
            }}
          >
            24h
          </span>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

// Skeleton Loading Component
function PriceCardSkeleton() {
  return (
    <div
      style={{
        padding: "14px",
        borderRadius: "12px",
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "12px",
        }}
      >
        <div
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "8px",
            background: "rgba(255,255,255,0.1)",
            animation: "shimmer 1.5s infinite",
          }}
        ></div>
        <div style={{ flex: 1 }}>
          <div
            style={{
              height: "14px",
              background: "rgba(255,255,255,0.1)",
              borderRadius: "4px",
              width: "60px",
              marginBottom: "6px",
              animation: "shimmer 1.5s infinite",
            }}
          ></div>
          <div
            style={{
              height: "10px",
              background: "rgba(255,255,255,0.1)",
              borderRadius: "4px",
              width: "40px",
              animation: "shimmer 1.5s infinite",
            }}
          ></div>
        </div>
      </div>
      <div
        style={{
          height: "24px",
          background: "rgba(255,255,255,0.1)",
          borderRadius: "6px",
          width: "120px",
          marginBottom: "10px",
          animation: "shimmer 1.5s infinite",
        }}
      ></div>
      <div
        style={{
          height: "20px",
          background: "rgba(255,255,255,0.1)",
          borderRadius: "6px",
          width: "70px",
          animation: "shimmer 1.5s infinite",
        }}
      ></div>

      <style>{`
        @keyframes shimmer {
          0% {
            opacity: 0.3;
          }
          50% {
            opacity: 0.6;
          }
          100% {
            opacity: 0.3;
          }
        }
      `}</style>
    </div>
  );
}
