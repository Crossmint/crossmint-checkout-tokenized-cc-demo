"use client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CrossmintProvider,
  CrossmintPaymentMethodManagement,
  CrossmintAuthProvider,
  useCrossmintAuth,
} from "@crossmint/client-sdk-react-ui";
import type { CrossmintPaymentMethod } from "@crossmint/client-sdk-base";
import type { PaymentMethod } from "@/lib/types";

const CROSSMINT_CLIENT_API_KEY = process.env.CROSSMINT_CLIENT_API_KEY!;

export default function BasicCheckoutPage() {
  return (
    <CrossmintProvider apiKey={CROSSMINT_CLIENT_API_KEY}>
      <CrossmintAuthProvider>
        <PaymentFormWrapper />
      </CrossmintAuthProvider>
    </CrossmintProvider>
  );
}

function PaymentFormWrapper() {
  const { jwt, login } = useCrossmintAuth();
  const router = useRouter();

  const handlePaymentMethodSelected = (
    paymentMethod: CrossmintPaymentMethod
  ) => {
    console.log("Payment method selected:", paymentMethod.paymentMethodId);
    console.log("Card details:", {
      brand: paymentMethod.card.brand,
      last4: paymentMethod.card.last4,
      expiration: `${paymentMethod.card.expiration.month}/${paymentMethod.card.expiration.year}`,
    });

    const appPaymentMethod: PaymentMethod = {
      type: "basic",
      paymentMethodId: paymentMethod.paymentMethodId,
    };

    try {
      if (typeof window !== "undefined") {
        sessionStorage.setItem(
          "paymentMethod",
          JSON.stringify(appPaymentMethod)
        );
      }
    } catch (error) {
      console.error("Failed to save payment method to session storage:", error);
    }

    router.push(
      `/order?paymentMethod=${encodeURIComponent(
        JSON.stringify(appPaymentMethod)
      )}`
    );
  };

  if (!jwt) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          padding: "20px",
        }}
      >
        <div
          style={{
            width: "400px",
            padding: "30px",
            border: "1px solid #e0e0e0",
            borderRadius: "12px",
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
            backgroundColor: "#ffffff",
            textAlign: "center",
          }}
        >
          <h2
            style={{
              fontSize: "24px",
              fontWeight: "600",
              color: "#333333",
              margin: "0 0 24px 0",
            }}
          >
            Basic Flow
          </h2>
          <p style={{ marginBottom: "24px", color: "#666666" }}>
            Please sign in to manage your payment methods
          </p>
          <button
            type="button"
            onClick={() => login()}
            style={{
              width: "100%",
              padding: "12px",
              backgroundColor: "#00C768",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "16px",
            }}
          >
            Sign In
          </button>
          <Link
            href="/agentic"
            style={{
              display: "block",
              width: "100%",
              padding: "12px",
              backgroundColor: "#f0f0f0",
              color: "#333",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "16px",
              marginTop: "16px",
              textAlign: "center",
              textDecoration: "none",
            }}
          >
            Switch to Agentic Flow
          </Link>
          <div
            style={{
              marginTop: "24px",
              textAlign: "center",
              fontSize: "14px",
              color: "#666666",
            }}
          >
            Powered by Crossmint
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        padding: "20px",
      }}
    >
      <div
        style={{
          width: "400px",
          padding: "30px",
          border: "1px solid #e0e0e0",
          borderRadius: "12px",
          boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
          backgroundColor: "#ffffff",
        }}
      >
        <div
          style={{
            marginBottom: "24px",
            textAlign: "left",
          }}
        >
          <h2
            style={{
              fontSize: "24px",
              fontWeight: "600",
              color: "#333333",
              margin: "0 0 8px 0",
            }}
          >
            Basic Flow
          </h2>
          <p style={{ margin: "0", fontSize: "14px", color: "#666666" }}>
            Select or add a payment method
          </p>
        </div>
        <div style={{ marginBottom: "20px" }}>
          <CrossmintPaymentMethodManagement
            jwt={jwt}
            onPaymentMethodSelected={handlePaymentMethodSelected}
          />
        </div>
        <Link
          href="/agentic"
          style={{
            display: "block",
            width: "100%",
            padding: "12px",
            backgroundColor: "#f0f0f0",
            color: "#333",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "16px",
            marginBottom: "16px",
            textAlign: "center",
            textDecoration: "none",
          }}
        >
          Switch to Agentic Flow
        </Link>
        <div
          style={{
            textAlign: "center",
            fontSize: "14px",
            color: "#666666",
          }}
        >
          Powered by Crossmint
        </div>
        <div
          style={{
            marginTop: "20px",
            padding: "12px",
            backgroundColor: "#f9f9f9",
            borderRadius: "8px",
            fontSize: "12px",
            color: "#666666",
          }}
        >
          <strong>Test Card:</strong>
          <br />
          Mastercard: 5186161910000103
          <br />
          CVV: Any 3 digits (e.g., 123)
          <br />
          Expiry: Any future date
        </div>
      </div>
    </div>
  );
}
