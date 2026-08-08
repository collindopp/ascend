"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ background: "#0a0a0b", color: "#f5f5f7", fontFamily: "system-ui, sans-serif" }}>
        <div
          style={{
            display: "flex",
            minHeight: "100vh",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
            textAlign: "center",
            padding: "24px",
          }}
        >
          <p style={{ fontSize: "14px", fontWeight: 500 }}>ASCEND hit a problem</p>
          <p style={{ fontSize: "14px", color: "#a1a1a8", maxWidth: "360px" }}>
            Something went wrong loading the app. Try refreshing the page.
          </p>
          <button
            onClick={reset}
            style={{
              marginTop: "8px",
              height: "36px",
              padding: "0 16px",
              borderRadius: "6px",
              border: "1px solid #3a3a40",
              background: "#1b1b1f",
              color: "#f5f5f7",
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            Retry
          </button>
        </div>
      </body>
    </html>
  );
}
