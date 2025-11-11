"use client";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import { useSearchParams } from "next/navigation";
import { validateApiKeyAndGetCrossmintBaseUrl } from "@crossmint/common-sdk-base";
import { PaymentMethod } from "@/lib/types";

const CROSSMINT_CLIENT_API_KEY =
  process.env.NEXT_PUBLIC_CROSSMINT_CLIENT_API_KEY!;
const CROSSMINT_SERVER_API_KEY = process.env.CROSSMINT_SERVER_API_KEY!;

const CROSSMINT_BASE_URL = validateApiKeyAndGetCrossmintBaseUrl(
  CROSSMINT_CLIENT_API_KEY
);

export default function OrderPage() {
  const searchParams = useSearchParams();
  const [productUrl, setProductUrl] = useState("");
  const [note, setNote] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const paymentMethodFromQuery = searchParams.get("paymentMethod") || "";

  const paymentMethod = useMemo(() => {
    if (paymentMethodFromQuery)
      return JSON.parse(paymentMethodFromQuery) as PaymentMethod;
    if (typeof window !== "undefined") {
      try {
        const stored = sessionStorage.getItem("paymentMethod");
        if (stored) return JSON.parse(stored) as PaymentMethod;
      } catch {}
    }
    return undefined;
  }, [paymentMethodFromQuery]);

  useEffect(() => {
    if (!paymentMethod) {
      setError(
        "Missing paymentMethod; please go back and register a card first."
      );
    }
  }, [paymentMethod]);

  const onSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setSubmitting(true);
      setError(null);
      setResult(null);

      if (!paymentMethod) {
        setError(
          "Missing paymentMethod; please go back and register a card first."
        );
        return;
      }

      try {
        const productLocator = `url:${productUrl}:${note || ""}`;

        const createOrderBody = {
          recipient: {
            email,
            physicalAddress: {
              name: "John Doe",
              line1: "123 Sample Street",
              line2: "",
              city: "New York City",
              state: "NY",
              postalCode: "10007",
              country: "US",
            },
          },
          locale: "en-US",
          payment: {
            receiptEmail: email,
            method: "card-token",
          },
          lineItems: {
            productLocator,
          },
        };

        const createOrderRes = await fetch(
          `${CROSSMINT_BASE_URL}/api/2022-06-09/orders`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-client-secret": CROSSMINT_CLIENT_API_KEY,
            },
            body: JSON.stringify(createOrderBody),
          }
        );
        if (!createOrderRes.ok) {
          const text = await createOrderRes.text();
          throw new Error(
            `Create order failed: ${createOrderRes.status} ${text}`
          );
        }
        const orderResponse = await createOrderRes.json();
        const orderId: string = orderResponse?.order?.orderId;
        if (!orderId) {
          throw new Error("Order ID missing in response");
        }

        const paymentRes = await fetch(
          `${CROSSMINT_BASE_URL}/api/unstable/2022-06-09/${orderId}/payment`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-client-secret": CROSSMINT_SERVER_API_KEY,
            },
            body: JSON.stringify(
              getPaymentRequestBodyFromPaymentMethod(paymentMethod)
            ),
          }
        );
        if (!paymentRes.ok) {
          const text = await paymentRes.text();
          throw new Error(`Payment failed: ${paymentRes.status} ${text}`);
        }
        setResult(`Your order has been sent. orderId: ${orderId}`);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setSubmitting(false);
      }
    },
    [productUrl, note, email, paymentMethod]
  );

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
        onSubmit={onSubmit}
        style={{
          width: "480px",
          padding: "30px",
          border: "1px solid #e0e0e0",
          borderRadius: "12px",
          boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
          backgroundColor: "#ffffff",
        }}
      >
        <h2 style={{ fontSize: "22px", margin: 0, marginBottom: 16 }}>
          Create Order
        </h2>
        <div style={{ display: "grid", gap: 12, marginBottom: 16 }}>
          <input
            type="url"
            placeholder="URL of product to purchase"
            value={productUrl}
            onChange={(e) => setProductUrl(e.target.value)}
            required
            style={{
              padding: "10px",
              border: "1px solid #e0e0e0",
              borderRadius: "8px",
              fontSize: "16px",
              color: "#333",
            }}
          />
          <input
            type="text"
            placeholder="Note (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            style={{
              padding: "10px",
              border: "1px solid #e0e0e0",
              borderRadius: "8px",
              fontSize: "16px",
              color: "#333",
            }}
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              padding: "10px",
              border: "1px solid #e0e0e0",
              borderRadius: "8px",
              fontSize: "16px",
              color: "#333",
            }}
          />
        </div>
        <button
          type="submit"
          disabled={submitting || !paymentMethod}
          style={{
            width: "100%",
            padding: "12px",
            backgroundColor: submitting ? "#c0c0c0" : "#00C768",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            cursor: submitting ? "not-allowed" : "pointer",
            fontSize: "16px",
            marginBottom: "12px",
          }}
        >
          {submitting ? "Submitting..." : "Submit"}
        </button>
        {!!error && (
          <div
            style={{ color: "#b00020", fontSize: 14, whiteSpace: "pre-wrap" }}
          >
            {error}
          </div>
        )}
        {!!result && (
          <pre
            style={{
              marginTop: 12,
              maxHeight: 240,
              overflow: "auto",
              background: "#f7f7f7",
              padding: 12,
              color: "#00C768",
              borderRadius: 8,
            }}
          >
            {result}
          </pre>
        )}
        {!paymentMethod && (
          <div style={{ color: "#b00020", marginTop: 8, fontSize: 14 }}>
            Payment method missing. Make sure to register a card first.
          </div>
        )}
      </form>
    </div>
  );
}

function getPaymentRequestBodyFromPaymentMethod(paymentMethod: PaymentMethod): {
  paymentMethodId: string;
} {
  if (paymentMethod.type === "basic") {
    return { paymentMethodId: paymentMethod.paymentMethodId };
  }
  return { paymentMethodId: `vic:${paymentMethod.purchaseIntentId}` };
}
