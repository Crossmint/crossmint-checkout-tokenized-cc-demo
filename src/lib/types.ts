export type PaymentMethod =
  | {
      type: "basic";
      paymentMethodId: string;
    }
  | {
      type: "agentic";
      purchaseIntentId: string;
    };
