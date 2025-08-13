"use client";
import React, { useEffect, useRef, useState } from "react";
import {
  // @ts-ignore
  useBasisTheory as useBasisTheoryAI,
  // @ts-ignore
  BasisTheoryProvider as BasisTheoryAIProvider,
} from "@basis-theory-ai/react";
import {
  CardElement,
  useBasisTheory,
  BasisTheoryProvider,
} from "@basis-theory/react-elements";

const CROSSMINT_BASE_URL = "https://staging.crossmint.com";
const CROSSMINT_API_KEY = "";

function CheckoutWithBT({ jwt, apiKey }: { jwt: string; apiKey: string }) {
  const { bt } = useBasisTheory(apiKey);
  return (
    <BasisTheoryProvider bt={bt}>
      <PaymentForm jwt={jwt} apiKey={apiKey} />
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

function PaymentForm({ jwt, apiKey }: { jwt: string; apiKey: string }) {
  const cardRef = useRef(null);
  const { verifyPurchaseIntent } = useBasisTheoryAI();
  const { bt } = useBasisTheory();
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!bt) {
      throw new Error("Basis Theory not initialized");
    }

    const token = await bt.tokens.create({
      type: "card",
      data: cardRef.current,
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
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardElement id="my-card" ref={cardRef} />
      <button type="submit">Pay Now</button>
    </form>
  );
}
