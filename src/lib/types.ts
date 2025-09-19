export type PaymentMethod =
  | {
      type: "basic";
      tokenId: string;
    }
  | {
      type: "agentic";
      purchaseIntentId: string;
    };
