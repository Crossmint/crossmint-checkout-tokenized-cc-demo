"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CROSSMINT_BASE_URL, CROSSMINT_CLIENT_API_KEY } from "@/app/consts";
import { BtAiProvider as BasisTheoryAIProvider } from "@basis-theory-ai/react";
import {
  useBasisTheory,
  BasisTheoryProvider,
  CardNumberElement,
  CardExpirationDateElement,
  CardVerificationCodeElement,
  type ICardNumberElement,
  type ICardExpirationDateElement,
  type ICardVerificationCodeElement,
} from "@basis-theory/react-elements";
import { PaymentMethod } from "@/lib/types";

function CheckoutWithBT({
  apiKey,
}: {
  jwt: string;
  apiKey: string;
  basisTheoryProjectId: string;
}) {
  const { bt } = useBasisTheory(apiKey);
  return (
    <BasisTheoryProvider bt={bt}>
      <PaymentForm />
    </BasisTheoryProvider>
  );
}

export default function BasicCheckoutPage() {
  const [jwt, setJwt] = useState(null);
  const [apiKey, setApiKey] = useState(null);
  const [basisTheoryProjectId, setBasisTheoryProjectId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch API key on mount
  useEffect(() => {
    async function fetchApiKey() {
      try {
        const res = await fetch(
          `${CROSSMINT_BASE_URL}/api/unstable/setupTokenizeCard`,
          {
            headers: {
              "x-api-key": CROSSMINT_CLIENT_API_KEY,
            },
          }
        );
        const data = await res.json();
        setJwt(data.jwt);
        setApiKey(data.basisTheoryAPIKey);
        setBasisTheoryProjectId(data.basisTheoryProjectId);
      } catch (error) {
        console.error("Failed to fetch API key:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchApiKey();
  }, []);

  if (loading || !jwt || !apiKey || !basisTheoryProjectId) {
    return <div>Loading Basis Theory...</div>;
  }

  return (
    <BasisTheoryAIProvider jwt={jwt}>
      <CheckoutWithBT
        jwt={jwt}
        apiKey={apiKey}
        basisTheoryProjectId={basisTheoryProjectId}
      />
    </BasisTheoryAIProvider>
  );
}

function PaymentForm() {
  const cardNumberRef = useRef<ICardNumberElement | null>(null);
  const cardExpirationRef = useRef<ICardExpirationDateElement | null>(null);
  const cardCvcRef = useRef<ICardVerificationCodeElement | null>(null);
  const [cardholderName, setCardholderName] = useState("");
  const { bt } = useBasisTheory();
  const router = useRouter();
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!bt) {
      throw new Error("Basis Theory not initialized");
    }

    const numberElement = cardNumberRef.current;
    const expirationElement = cardExpirationRef.current;
    const cvcElement = cardCvcRef.current;

    if (
      !numberElement ||
      !expirationElement ||
      !cvcElement ||
      !cardholderName
    ) {
      console.error(
        "One or more card elements are not ready or cardholder name is not set"
      );
      return;
    }

    const token = await bt.tokens.create({
      type: "card",
      data: {
        number: numberElement,
        expiration_month: expirationElement.month(),
        expiration_year: expirationElement.year(),
        cvc: cvcElement,
        cardholder_name: cardholderName,
      },
    });

    await fetch(
      `${CROSSMINT_BASE_URL}/api/unstable/setupTokenizeCard/registerToken`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": CROSSMINT_CLIENT_API_KEY,
        },
        body: JSON.stringify({
          token: token.id,
        }),
      }
    );
    const appPaymentMethod: PaymentMethod = {
      type: "basic",
      tokenId: token.id,
    };
    try {
      if (typeof window !== "undefined") {
        sessionStorage.setItem(
          "paymentMethod",
          JSON.stringify(appPaymentMethod)
        );
      }
    } catch {}

    router.push(
      `/order?paymentMethod=${encodeURIComponent(
        JSON.stringify(appPaymentMethod)
      )}`
    );
  };

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
      <form
        onSubmit={handleSubmit}
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
        </div>
        <div style={{ display: "grid", gap: 12, marginBottom: "20px" }}>
          <input
            type="text"
            name="cardholderName"
            placeholder="Cardholder name"
            value={cardholderName}
            onChange={(e) => setCardholderName(e.target.value)}
            autoComplete="cc-name"
            required
            style={{
              padding: "10px",
              border: "1px solid #e0e0e0",
              borderRadius: "8px",
              fontSize: "16px",
              color: "#666666",
            }}
          />
          <CardNumberElement id="card-number" ref={cardNumberRef} />
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <CardExpirationDateElement
              id="card-expiration"
              ref={cardExpirationRef}
            />
            <CardVerificationCodeElement id="card-cvc" ref={cardCvcRef} />
          </div>
        </div>
        <button
          type="submit"
          style={{
            width: "100%",
            padding: "12px",
            backgroundColor: "#00C768",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "16px",
            marginBottom: "16px",
          }}
        >
          Register
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
      </form>
    </div>
  );
}
