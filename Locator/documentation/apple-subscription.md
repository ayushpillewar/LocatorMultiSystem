# Apple Subscriptions & StoreKit — Locator App

## Overview

There are two ways to handle subscriptions in an iOS React Native / Expo app:

| Method | Billing handled by | Apple cut | Best for |
|---|---|---|---|
| **StoreKit (App Store)** | Apple | 15–30% | Most apps — simple, trusted |
| **Stripe + Apple Pay** | Your backend | Stripe fees only | Complex billing, existing payment infra |

This document focuses on **StoreKit**, which is the standard approach for subscription apps.

---

## What is StoreKit?

StoreKit is Apple's native framework for in-app purchases and subscriptions. When you use StoreKit:

- Apple presents the payment sheet (users trust it)
- Apple charges the user's Apple ID payment method
- Apple handles renewals, cancellations, refunds, and receipts
- You receive a server notification when anything changes
- Apple takes **15%** (if revenue < $1M/year via Small Business Program) or **30%**

### StoreKit 2 vs StoreKit 1

| | StoreKit 1 | StoreKit 2 |
|---|---|---|
| Released | 2009 | iOS 15+ (2021) |
| Receipt validation | Base64 receipt → your server | Signed JWS transactions — simpler |
| API style | Callback/delegate based | Swift async/await |
| React Native support | `react-native-iap` | `expo-iap` (recommended for Expo) |

Use **`expo-iap`** — it wraps StoreKit 2 on iOS and Google Play Billing on Android.

---

## Installation

```bash
npx expo install expo-iap
```

Add the plugin to `app.json`:

```json
{
  "expo": {
    "plugins": ["expo-iap"]
  }
}
```

Rebuild your dev client after adding the plugin:

```bash
npx expo prebuild
npx expo run:ios
```

---

## StoreKit Subscription Flow

```
User taps Subscribe
       ↓
expo-iap fetches product from App Store
       ↓
Apple payment sheet appears (Face ID / Touch ID)
       ↓
Transaction created → your app receives it
       ↓
Send receipt/transaction to your backend for validation
       ↓
Unlock premium features
       ↓
Apple auto-renews monthly → server notification → re-validate
```

---

## Implementation

### 1. Fetch Products

```tsx
import * as IAP from 'expo-iap';
import { useEffect, useState } from 'react';

const PRODUCT_IDS = [
  'com.yourapp.locator.monthly',
  'com.yourapp.locator.yearly',
];

export function useSubscriptionProducts() {
  const [products, setProducts] = useState<IAP.Product[]>([]);

  useEffect(() => {
    async function load() {
      await IAP.initConnection();
      const result = await IAP.getSubscriptions({ skus: PRODUCT_IDS });
      setProducts(result);
    }
    load();

    return () => {
      IAP.endConnection();
    };
  }, []);

  return products;
}
```

### 2. Purchase a Subscription

```tsx
import * as IAP from 'expo-iap';

export async function purchaseSubscription(productId: string) {
  try {
    await IAP.requestSubscription({ sku: productId });
    // purchaseUpdatedListener below will handle the result
  } catch (error) {
    console.error('Purchase failed:', error);
  }
}
```

### 3. Listen for Purchase Updates

Set up listeners at the top level (e.g., in `app/_layout.tsx`):

```tsx
import * as IAP from 'expo-iap';
import { useEffect } from 'react';

export default function RootLayout() {
  useEffect(() => {
    const purchaseUpdated = IAP.purchaseUpdatedListener(async (purchase) => {
      const receipt = purchase.transactionReceipt;
      if (receipt) {
        // Send to your backend for validation
        await validateReceiptOnServer(receipt);
        // Acknowledge the purchase (required — or Apple will refund it)
        await IAP.finishTransaction({ purchase, isConsumable: false });
      }
    });

    const purchaseError = IAP.purchaseErrorListener((error) => {
      console.error('Purchase error:', error);
    });

    return () => {
      purchaseUpdated.remove();
      purchaseError.remove();
    };
  }, []);

  // ... rest of layout
}
```

### 4. Restore Purchases

Users who reinstall the app or switch devices need to restore:

```tsx
import * as IAP from 'expo-iap';

export async function restorePurchases() {
  const purchases = await IAP.getAvailablePurchases();
  for (const purchase of purchases) {
    await validateReceiptOnServer(purchase.transactionReceipt);
  }
}
```

---

## Backend Receipt Validation

> **Never trust the client alone.** Always validate the receipt on your server.

### Option A: Apple's Validation API (StoreKit 1)

```
POST https://buy.itunes.apple.com/verifyReceipt          ← production
POST https://sandbox.itunes.apple.com/verifyReceipt      ← sandbox

Body: { "receipt-data": "<base64>", "password": "<shared_secret>" }
```

### Option B: App Store Server API (StoreKit 2 — recommended)

Use signed JWS tokens — no receipt string needed, simpler and more secure:

```
GET https://api.storekit.itunes.apple.com/inApps/v1/subscriptions/{originalTransactionId}
```

Requires a **private key** from App Store Connect for JWT signing.

### Shared Secret

Required for receipt validation:
1. App Store Connect → your app → **Monetization** → **Subscriptions**
2. Scroll to **App-Specific Shared Secret** → **Manage** → **Generate**

---

## Server Notifications (App Store Server Notifications V2)

Apple will POST to your server URL when:
- Subscription renews
- User cancels
- Billing fails / grace period starts
- Refund is issued
- User upgrades/downgrades

Set your URL:
1. App Store Connect → your app → **General** → **App Information**
2. **App Store Server Notifications** → enter your URL

Your endpoint receives a signed JWS payload. Decode it with your Apple public key.

```ts
// Minimal Node.js example
app.post('/apple/notifications', (req, res) => {
  const { signedPayload } = req.body;
  // Decode and verify JWS using apple's public JWKS
  // Update user subscription status in your DB
  res.sendStatus(200);
});
```

---

## Sandbox Testing

1. App Store Connect → **Users and Access** → **Sandbox Testers** → **+**
2. Create a sandbox Apple ID (use a unique email, doesn't need to be real)
3. On your **physical test device**:
   - Settings → App Store → sign out
   - Sign in with sandbox Apple ID
4. Purchases will cost $0.00
5. Subscriptions auto-renew every **5 minutes** (monthly) in sandbox

---

## Required App Store Review Info

Before submitting:
- Add a **subscription review screenshot** (your paywall UI)
- Provide a **restore purchases** button — Apple requires it
- Include a link to your **Terms of Use** and **Privacy Policy** in the paywall

---

## Key Constraints

| Constraint | Detail |
|---|---|
| **iOS only** | StoreKit does not run on Android or web |
| **Physical device** | Required for real purchases (simulator = StoreKit configuration file needed) |
| **Expo Go** | Does NOT work — requires a dev build (`npx expo run:ios`) |
| **App Store approval** | Products must be approved before going live |
| **finishTransaction** | Must be called or Apple will refund after 24h (auto-consumable) |
| **Apple cut** | 30% (or 15% via Small Business Program) |
