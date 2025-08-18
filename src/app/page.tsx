"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CROSSMINT_BASE_URL } from "@/lib/crossmint";
import {
  // @ts-ignore
  useBasisTheory as useBasisTheoryAI,
  // @ts-ignore
  BasisTheoryProvider as BasisTheoryAIProvider,
} from "@basis-theory-ai/react";
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

function CheckoutWithBT({ jwt, apiKey }: { jwt: string; apiKey: string }) {
  const { bt } = useBasisTheory(apiKey);
  return (
    <BasisTheoryProvider bt={bt}>
      <PaymentForm jwt={jwt} />
    </BasisTheoryProvider>
  );
}

export default function CheckoutPage() {
  const [jwt, setJwt] = useState(null);
  const [apiKey, setApiKey] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch API key on mount
  useEffect(() => {
    async function fetchApiKey() {
      try {
        const res = await fetch(
          `${CROSSMINT_BASE_URL}/api/unstable/setupTokenizeCard`
        );
        const data = await res.json();
        setJwt(data.jwt);
        setApiKey(data.basisTheoryAPIKey);
      } catch (error) {
        console.error("Failed to fetch API key:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchApiKey();
  }, []);

  if (loading || !jwt || !apiKey) {
    return <div>Loading Basis Theory...</div>;
  }

  return (
    <BasisTheoryAIProvider apiKey={jwt}>
      <CheckoutWithBT jwt={jwt} apiKey={apiKey} />
    </BasisTheoryAIProvider>
  );
}

function PaymentForm({ jwt }: { jwt: string }) {
  const cardNumberRef = useRef<ICardNumberElement | null>(null);
  const cardExpirationRef = useRef<ICardExpirationDateElement | null>(null);
  const cardCvcRef = useRef<ICardVerificationCodeElement | null>(null);
  const [cardholderName, setCardholderName] = useState("");
  const { verifyPurchaseIntent } = useBasisTheoryAI();
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

    console.log({ token });

    const createPaymentMethodRequestBody = {
      entityId: "crossmint-preview",
      tokenId: token.id,
    };

    const response = await fetch(
      `https://api.sandbox.basistheory.ai/projects/6f1ab300-8dca-4ac4-8766-ad7e7a735b0b/payment-methods`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify(createPaymentMethodRequestBody),
      }
    );
    const paymentMethod = await response.json();
    console.log("paymentMethod", paymentMethod);

    const paymentIntentData = {
      paymentMethodId: paymentMethod.id,
    };

    const response2 = await fetch(
      `${CROSSMINT_BASE_URL}/api/unstable/setupTokenizeCard/createPurchaseIntent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": CROSSMINT_API_KEY,
        },
        body: JSON.stringify(paymentIntentData),
      }
    );

    const purchaseIntent = await response2.json();

    console.log("purchaseIntent", purchaseIntent);

    const paymentIntent = await verifyPurchaseIntent(
      "6f1ab300-8dca-4ac4-8766-ad7e7a735b0b",
      purchaseIntent.purchaseIntentId
    );

    console.log({ paymentIntent });

    try {
      if (typeof window !== "undefined") {
        sessionStorage.setItem("paymentIntent", paymentIntent);
      }
    } catch (_err) {}

    router.push(`/order?paymentIntent=${encodeURIComponent(paymentIntent)}`);
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
            Payment Information
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
