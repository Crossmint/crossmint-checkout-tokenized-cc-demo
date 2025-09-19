# Tokenized Credit Card Demo

This is a Next.js application that demonstrates tokenized credit card processing using Basis Theory and Crossmint APIs. The app shows how to securely tokenize credit card information and process payments without handling sensitive card data directly. It includes two separate flows: a "basic" flow and an "agentic" flow, each on its own page.

## 🚀 Quick Start

### Prerequisites
- Node.js (version 18 or higher)
- npm or yarn package manager

### Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Crossmint/crossmint-checkout-tokenized-cc-demo
   cd crossmint-checkout-tokenized-cc-demo
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure API Keys**
   Open `src/app/consts.ts` and add your Crossmint Client API Key.

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Set up HTTPS for local development (Required)**
   Due to security reasons, the card verification process cannot happen in an HTTP environment. Use ngrok to create an HTTPS tunnel:
   ```bash
   ngrok http 3000 (or the port shown in your terminal)
   ```

6. **Open your browser**
   Navigate to the HTTPS URL provided by ngrok (e.g., `https://abc123.ngrok.io`) instead of the local HTTP URL

##  Flows

This demo includes two separate flows, for more info about the flows, please refer to the [Crossmint Documentation](https://docs.crossmint.com/solutions/ai-agents/agentic-commerce/payment-methods):

-   **Basic Flow**: Accessible at the root path (`/`). This flow tokenizes a credit card and registers the token with Crossmint, works for every card.
-   **Agentic Flow**: Accessible at `/agentic`. This flow tokenizes a card and creates a scoped purchase intent, which is more suitable for agentic commerce operations, works only for Visa or Mastercard.

You can switch between the flows using the buttons provided on each page.

### Agentic Flow Notes

-   **Visa cards are not yet supported** in the agentic flow.
-   **Mastercard verification** may pop up twice, and you might need to click "Try Again" multiple times. This is a known issue that will be fixed soon.

### Test Card Information
Please use this Mastercard test card: **5186161910000103** (any CVC and expiration date)

## 🎯 What This Demo Does

This application demonstrates a complete tokenized credit card payment flow:

1. **Card Tokenization**: Securely tokenizes credit card information using Basis Theory
2. **Payment Method Creation (Agentic Flow)**: Creates a payment method from the tokenized card.
3. **Purchase Intent (Agentic Flow)**: Initiates a purchase intent through Crossmint.
4. **Token Registration (Basic Flow)**: Registers the card token with Crossmint.
5. **Verification (Agentic Flow)**: Verifies the purchase intent and returns a payment intent ID.
### New Order Flow (after card registration)

1. After the card is registered on the home page (`/` or `/agentic`), the app redirects to `/order`.
2. On `/order`, the user enters:
   - URL of product to purchase
   - Optional note
   - Email
3. On submit, the app:
   - Calls `POST /api/2022-06-09/orders` with `lineItems.productLocator = url:<url>:<note>` and collects `response.order.orderId`.
   - Calls `POST /api/unstable/orders/{orderId}/payment` with body `{ token: "vic:<paymentIntent>" }`.
4. The result of the payment call is displayed on the page.


Note this implementation is in staging. When the production version is available OTP flows and passkey generation/verification steps will be part of the user's card registration and payment flow.

## 📋 Expected Results

When you successfully complete the payment flow, you should see the following console output (in your browser's developer tools):

### 1. Token Creation
```json
{
  "token": {
    "id": "6b03dfb8-0d84-414d-b97f-687b418291d6",
    "type": "card",
    "card": {
      "bin": "51203501",
      "last4": "5465",
      "expirationMonth": "12",
      "expirationYear": "2030",
      "brand": "mastercard"
    },
    "data": {
      "number": "XXXXXXXXXXXX5465",
      "expirationMonth": "12",
      "expirationYear": "2030"
    },
    "privacy": {
      "classification": "pci",
      "impactLevel": "high",
      "restrictionPolicy": "mask"
    }
  }
}
```

### 2. Payment Method Creation
```json
{
  "paymentMethod": {
    "id": "eea862d4-0bb6-4620-93c2-9a45832f5d9c",
    "type": "card",
    "card": {
      "brand": "mastercard",
      "type": "credit"
    },
    "credentialTypes": ["virtual-card"],
    "createdAt": "2025-08-13T20:07:12.443Z"
  }
}
```

### 3. Purchase Intent
```json
{
  "purchaseIntent": {
    "purchaseIntentId": "13d2fe18-2175-4d36-bba9-76afcd29e934"
  }
}
```

### 4. Final Payment Intent (Ultimate Result)
```json
{
  "paymentIntent": {
    "id": "13d2fe18-2175-4d36-bba9-76afcd29e934",
    "intentId": "13d2fe18-2175-4d36-bba9-76afcd29e934",
    "purchaseIntentStatus": "active",
    "status": "SUCCESS",
    "updatedAt": "2025-08-13T20:07:14.039Z",
    "verification": {
      "method": "mastercard",
      "verifiedAt": "2025-08-13T20:07:14.002Z",
      "correlationId": "..."
    }
  }
}
```

## 🔧 How It Works

### Key Components
- `BasicCheckoutPage` (`/`): Main component for the basic flow.
- `AgenticCheckoutPage` (`/agentic`): Main component for the agentic flow.
- `CheckoutWithBT`: Wraps the payment form with Basis Theory providers
- `PaymentForm`: Handles card input and payment submission

### API Flow

#### Agentic Flow
1. **Setup**: Fetches JWT and API key from Crossmint.
2. **Tokenization**: Uses Basis Theory to tokenize card data.
3. **Payment Method**: Creates a Basis Theory payment method from the token.
4. **Purchase Intent**: Creates a purchase intent in Crossmint.
5. **Verification**: Verifies the purchase intent.

#### Basic Flow
1. **Setup**: Fetches API key from Crossmint.
2. **Tokenization**: Uses Basis Theory to tokenize card data.
3. **Token Registration**: Registers the token with Crossmint.

## 📄 License

This project is licensed under the MIT License.
