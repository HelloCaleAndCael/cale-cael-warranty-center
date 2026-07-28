import type { LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  return null;
};

export default function WarrantyHome() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#111111",
        color: "#ffffff",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div style={{ textAlign: "center", maxWidth: 600 }}>
        <h1
          style={{
            fontSize: "40px",
            letterSpacing: "4px",
            marginBottom: "10px",
          }}
        >
          CALE & CAEL
        </h1>

        <h2
          style={{
            fontWeight: 300,
            marginBottom: "30px",
          }}
        >
          Warranty Center
        </h2>

        <p
          style={{
            color: "#c5c5c5",
            fontSize: "18px",
          }}
        >
          Built to last. Guaranteed for life.
        </p>

        <div
          style={{
            marginTop: "50px",
            padding: "16px 32px",
            border: "1px solid #555",
            display: "inline-block",
            borderRadius: "8px",
          }}
        >
          🚀 Application initialized successfully
        </div>
      </div>
    </div>
  );
}