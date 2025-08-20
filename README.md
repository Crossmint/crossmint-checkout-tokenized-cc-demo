# Tokenized Credit Card Demo

This is a Next.js application that demonstrates tokenized credit card processing using Basis Theory and Crossmint APIs. The app shows how to securely tokenize credit card information and process agentic payments without handling sensitive card data directly.

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

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Set up HTTPS for local development (Required)**
   Due to security reasons, the card verification process cannot happen in an HTTP environment. Use ngrok to create an HTTPS tunnel:
   ```bash
   ngrok http 3000 (or the port shown in your terminal)
   ```

5. **Open your browser**
   Navigate to the HTTPS URL provided by ngrok (e.g., `https://abc123.ngrok.io`) instead of the local HTTP URL

## ⚠️ Important Notes

### Test Card Information
Please use this Mastercard test card: **5120350110725465** (any CVC and expiration date)

## 🎯 What This Demo Does

This application demonstrates a complete tokenized credit card payment flow:

1. **Card Tokenization**: Securely tokenizes credit card information using Basis Theory
2. **Payment Method Creation**: Creates a payment method from the tokenized card
3. **Purchase Intent**: Initiates a purchase intent through Crossmint
4. **Verification**: Verifies the purchase intent and returns a payment intent ID
### New Order Flow (after card registration)

1. After the card is registered on the home page, the app redirects to `/order` with a `paymentIntent`.
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
- `CheckoutPage`: Main component that fetches API credentials
- `CheckoutWithBT`: Wraps the payment form with Basis Theory providers
- `PaymentForm`: Handles card input and payment submission

### API Flow
1. **Setup**: Fetches JWT and API key
2. **Tokenization**: Uses Basis Theory to tokenize card data
3. **Payment Method**: Creates payment method from token
4. **Purchase Intent**: Initiates purchase through Crossmint
5. **Verification**: Verifies and returns final payment intent

## 📄 License

This project is licensed under the MIT License.
