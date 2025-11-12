"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CrossmintProvider,
  CrossmintPaymentMethodManagement,
  CrossmintAuthProvider,
  useCrossmintAuth,
  OrderIntentVerification,
} from "@crossmint/client-sdk-react-ui";
import type {
  CrossmintPaymentMethod,
  OrderIntent,
} from "@crossmint/client-sdk-base";
import type { PaymentMethod } from "@/lib/types";
import { validateApiKeyAndGetCrossmintBaseUrl } from "@crossmint/common-sdk-base";

const CROSSMINT_CLIENT_API_KEY =
  process.env.NEXT_PUBLIC_CROSSMINT_CLIENT_API_KEY || "";
const CROSSMINT_BASE_URL = validateApiKeyAndGetCrossmintBaseUrl(
  CROSSMINT_CLIENT_API_KEY
);
const BASIS_THEORY_PROJECT_ID =
  process.env.NEXT_PUBLIC_BASIS_THEORY_PROJECT_ID || "";
const BASIS_THEORY_ENVIRONMENT =
  (process.env.NEXT_PUBLIC_BASIS_THEORY_ENVIRONMENT as
    | "production"
    | "sandbox") || "sandbox";
const BT_JWT = process.env.NEXT_PUBLIC_BT_JWT || "";

export default function AgenticCheckoutPage() {
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
  const [verificationState, setVerificationState] = useState<{
    orderIntent: OrderIntent;
    paymentMethod: PaymentMethod;
  } | null>(null);

  const handlePaymentMethodSelected = async (
    paymentMethod: CrossmintPaymentMethod
  ) => {
    console.log("Payment method selected:", paymentMethod.paymentMethodId);
    console.log("Card details:", {
      brand: paymentMethod.card.brand,
      last4: paymentMethod.card.last4,
      expiration: `${paymentMethod.card.expiration.month}/${paymentMethod.card.expiration.year}`,
    });

    try {
      // Create order intent
      const response = await fetch(
        `${CROSSMINT_BASE_URL}/api/unstable/order-intents`,
        {
          method: "POST",
          headers: {
            "X-API-KEY": CROSSMINT_CLIENT_API_KEY,
            Authorization: `Bearer ${jwt}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            payment: {
              paymentMethodId: paymentMethod.paymentMethodId,
            },
            mandates: [
              {
                type: "maxAmount",
                value: "100.00",
                details: {
                  currency: "840",
                  period: "weekly",
                },
              },
            ],
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create order intent: ${errorText}`);
      }

      const orderIntent = (await response.json()) as OrderIntent;
      console.log("Order intent created:", orderIntent);

      const appPaymentMethod: PaymentMethod = {
        type: "agentic",
        purchaseIntentId: orderIntent.orderIntentId,
      };

      // Verify order intent if required
      if (orderIntent.phase === "requires-verification") {
        console.log(
          "Verification required for order intent:",
          orderIntent.orderIntentId
        );
        // Set state to trigger verification component
        setVerificationState({
          orderIntent,
          paymentMethod: appPaymentMethod,
        });
        return;
      }

      // If no verification needed, save and navigate immediately
      if (typeof window !== "undefined") {
        sessionStorage.setItem(
          "paymentMethod",
          JSON.stringify(appPaymentMethod)
        );
        sessionStorage.setItem("orderIntent", JSON.stringify(orderIntent));
      }

      router.push(
        `/order?paymentMethod=${encodeURIComponent(
          JSON.stringify(appPaymentMethod)
        )}&orderIntentId=${encodeURIComponent(orderIntent.orderIntentId)}`
      );
    } catch (error) {
      console.error("Error in payment method selection:", error);
      alert(
        `Failed to process payment method: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const handleVerificationComplete = (paymentIntent: unknown) => {
    console.log("Verification complete:", paymentIntent);

    if (!verificationState) return;

    const { orderIntent, paymentMethod } = verificationState;

    // Save payment method to session storage
    if (typeof window !== "undefined") {
      sessionStorage.setItem("paymentMethod", JSON.stringify(paymentMethod));
      sessionStorage.setItem("orderIntent", JSON.stringify(orderIntent));
    }

    // Navigate to order page
    router.push(
      `/order?paymentMethod=${encodeURIComponent(
        JSON.stringify(paymentMethod)
      )}&orderIntentId=${encodeURIComponent(orderIntent.orderIntentId)}`
    );
  };

  const handleVerificationError = (error: Error) => {
    console.error("Verification error:", error);
    alert(`Verification failed: ${error.message}`);
    setVerificationState(null);
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
            Agentic Flow
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
            href="/"
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
            Switch to Basic Flow
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
    <>
      {verificationState && (
        <OrderIntentVerification
          basisTheoryProjectId={BASIS_THEORY_PROJECT_ID}
          jwt={BT_JWT}
          environment={BASIS_THEORY_ENVIRONMENT}
          orderIntent={verificationState.orderIntent}
          onVerificationComplete={handleVerificationComplete}
          onVerificationError={handleVerificationError}
        />
      )}
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
              Agentic Flow
            </h2>
            <p style={{ margin: "0", fontSize: "14px", color: "#666666" }}>
              {verificationState
                ? "Verifying payment method..."
                : "Select or add a payment method"}
            </p>
          </div>
          <div style={{ marginBottom: "20px" }}>
            <CrossmintPaymentMethodManagement
              jwt={jwt}
              onPaymentMethodSelected={handlePaymentMethodSelected}
            />
          </div>
          <Link
            href="/"
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
            Switch to Basic Flow
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
    </>
  );
}
