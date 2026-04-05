# Locator — Application Structure & Developer Guide

## Overview

**Locator** is a cross-platform mobile application (iOS + Android) built with **React Native** via **Expo SDK 54**. It tracks a user's GPS position in both the foreground and background, sends location data to a remote REST API, and gates full functionality behind an **Apple In-App Purchase (IAP)** subscription. Authentication is handled by **AWS Cognito** (via AWS Amplify v6).

---

## Entry Point

The application entry point is declared in `package.json`:

```json
"main": "expo-router/entry"
```

Expo Router uses file-based routing. The real root layout file is:

```
app/_layout.tsx   ← RootLayout — bootstraps the entire app
```

When the app launches, `expo-router` loads `app/_layout.tsx`, which:
1. Imports and applies the AWS Amplify configuration (`constants/amplify-config.ts`).
2. Registers global **IAP purchase listeners** (success and error).
3. Wraps all screens in `<AuthWrapper>`, which gates access behind authentication.
4. Declares the navigation `Stack` via `expo-router`.

---

## Directory Structure

```
Locator/
│
├── app/                        # All screens (file-based routing via expo-router)
│   ├── _layout.tsx             # Root layout — app entry, auth gate, IAP listeners
│   ├── login.tsx               # Authentication screen (sign-in / sign-up / password reset)
│   ├── modal.tsx               # Generic modal screen
│   └── (tabs)/                 # Bottom-tab group
│       ├── _layout.tsx         # Tab bar definition (Home + Options tabs)
│       ├── index.tsx           # Home screen — UserProfile + LocationTracker
│       ├── LocationTracker.tsx # Location tracking component (foreground + background)
│       └── explore.tsx         # Options/Explore screen — subscription status + FAQ
│
├── components/                 # Shared UI components
│   ├── AuthWrapper.tsx         # Auth state manager; shows login or children
│   ├── UserProfile.tsx         # Header bar showing user email and sign-out button
│   ├── LocatorImage.tsx        # Branded image component (app logo)
│   └── ui/                     # Primitive themed components
│       ├── themed-text.tsx
│       ├── themed-view.tsx
│       ├── collapsible.tsx
│       ├── haptic-tab.tsx
│       ├── icon-symbol.tsx     # SF Symbol icons (iOS)
│       ├── icon-symbol.ios.tsx # iOS-specific icon impl
│       └── external-link.tsx
│
├── constants/
│   ├── amplify-config.ts       # AWS Amplify / Cognito configuration
│   ├── const.ts                # API base URL, storage keys, Apple IAP product IDs
│   ├── theme.ts                # Color palette (light/dark) + font families
│   └── appStyles.ts            # Shared StyleSheet helpers
│
├── dto/
│   └── models.ts               # TypeScript data models (Location, User, SubscriptionRequestBody, etc.)
│
├── hooks/
│   ├── use-color-scheme.ts     # Wraps RN useColorScheme
│   ├── use-color-scheme.web.ts # Web-specific variant
│   └── use-theme-color.ts      # Resolves a theme color token to a hex value
│
├── services/
│   ├── LocationService.ts      # Foreground + background GPS logic; task manager registration
│   ├── LocationApiService.ts   # REST client — sends/fetches location data, manages subscriptions
│   └── AppleSubscriptionService.tsx  # Apple IAP product fetching and purchase trigger
│
├── utils/
│   └── debugUtils.ts           # Dev-only debug helpers
│
├── scripts/
│   └── reset-project.js        # Utility to scaffold a fresh project
│
├── documentation/              # Project documentation
│   ├── README.md
│   ├── COGNITO_SETUP.md
│   ├── apple-subscription.md
│   └── APPLICATION_STRUCTURE.md  ← this file
│
├── app.json                    # Expo config (bundle IDs, permissions, plugins)
├── package.json                # Dependencies and scripts
├── tsconfig.json               # TypeScript config
└── eas.json                    # EAS Build config
```

---

## Navigation Architecture

Expo Router uses a **file-system-based** navigation hierarchy:

```
Stack (root)
└── (tabs)              ← Tab group, header hidden
    ├── index           → Home (house.fill icon)
    └── Options         → Options/Explore (gearshape.fill icon)
└── modal               ← Presented as a modal sheet
```

The `unstable_settings.anchor` in `_layout.tsx` is set to `(tabs)`, making the tab group the default anchor screen.

---

## Authentication Flow

```
App Launch
   │
   ▼
RootLayout (_layout.tsx)
   │  imports amplify-config → Amplify.configure()
   │
   ▼
AuthWrapper (components/AuthWrapper.tsx)
   │
   ├─ isLoading = true  → shows ActivityIndicator
   │
   ├─ user = null       → renders <AuthForm /> (app/login.tsx)
   │     • Sign In  → signIn() → refreshIdentityPoolToken() → stores JWT + userId + email in AsyncStorage
   │     • Sign Up  → signUp() → email verification code → confirmSignUp()
   │     • Forgot   → resetPassword() → confirmResetPassword()
   │
   └─ user ≠ null       → renders app children (the tab navigation)
```

`AuthWrapper` subscribes to Amplify Hub events:
- `signedIn` → re-checks auth state
- `signedOut` → clears user state
- `tokenRefresh` → calls `refreshIdentityPoolToken()` to keep AsyncStorage in sync

`refreshIdentityPoolToken()` is exported and called from several places to ensure the latest Cognito `idToken` is always persisted for use by background services that cannot access React context.

---

## AWS Cognito Configuration

File: `constants/amplify-config.ts`

| Setting | Value |
|---|---|
| Region | `ap-south-1` |
| User Pool ID | `ap-south-1_a4laup1vb` |
| App Client ID | `3ihfa3gj922q1scaq8osuab5jp` |
| Sign-in method | Email |
| Email verification | Code-based |
| Password policy | ≥8 chars, upper + lower + number required |
| Guest access | Disabled |

---

## Location Tracking

### Foreground Tracking (`LocationTracker.tsx` + `LocationService.ts`)

Managed in `app/(tabs)/LocationTracker.tsx` using `expo-location`:

1. Requests foreground location permission on mount.
2. Starts `Location.watchPositionAsync()` at the user-selected foreground interval (default: **10 s**).
3. Each update is sent directly through `LocationApiService.sendLocation()`.

### Background Tracking (`LocationService.ts`)

Implemented with `expo-task-manager` + `expo-background-fetch`:

```
TaskManager.defineTask('background-location-task', callback)
```

- Registered at **module load time** (required by expo-task-manager).
- Started via `Location.startLocationUpdatesAsync()`.
- Uses a **time-gate**: reads `BG_LAST_SEND_TIME` from AsyncStorage and skips the API call if the user-selected interval hasn't elapsed, preventing burst updates from the OS.
- On each valid tick: reads JWT + user info from AsyncStorage, creates a `Location` DTO, calls `LocationApiService.sendLocation()`, and appends an entry to the local `LocationHistoryEntry` store (capped at **500 entries**).

### Interval Options

| Label | Value |
|---|---|
| 10 s | 10,000 ms |
| 30 s | 30,000 ms (default BG) |
| 1 min | 60,000 ms |
| 5 min | 300,000 ms |

Default foreground interval: **10,000 ms**

### Permissions Required

| Platform | Permission |
|---|---|
| iOS | `NSLocationWhenInUseUsageDescription`, `NSLocationAlwaysAndWhenInUseUsageDescription`, UIBackgroundModes: `location`, `background-fetch`, `background-processing` |
| Android | `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION`, `ACCESS_BACKGROUND_LOCATION` |

---

## REST API

Base URL: `https://majboormajdoor.com`

All requests include `Content-Type: application/json` and, when authenticated, `Authorization: Bearer <idToken>`.

| Method | Path | Description |
|---|---|---|
| `POST` | `/location` | Send a location update |
| `GET` | `/location` | Fetch full location history |
| `GET` | `/subscribe?userId=<id>` | Check subscription status → returns `User` |
| `PUT` | `/subscribe` | Create/update a subscription |

Implemented in `services/LocationApiService.ts` as a singleton.

---

## Data Models (`dto/models.ts`)

### `Location`
| Field | Type | Description |
|---|---|---|
| `latitude` | `number` | GPS latitude |
| `longitude` | `number` | GPS longitude |
| `insertionTimestamp` | `string` | Formatted timestamp (`YYYY-MM-DD HH:mm:ss`) |
| `userName` | `string` | Display name or email |
| `userId` | `string` | Cognito user ID |
| `ttl` | `number?` | Optional DynamoDB TTL |

### `User`
| Field | Type | Description |
|---|---|---|
| `userId` | `string` | Cognito user ID |
| `email` | `string` | User email |
| `subStartDate` | `string` | Subscription start date |
| `subEndDate` | `string` | Subscription end date |
| `insertionTimestamp` | `string` | Account creation timestamp |

### `SubscriptionRequestBody`
| Field | Type | Description |
|---|---|---|
| `userId` | `string` | Cognito user ID |
| `subType` | `string` | `'monthly'` or `'yearly'` |

### `LocationHistoryEntry` (local storage)
| Field | Type |
|---|---|
| `userId` | `string` |
| `insertionTimestamp` | `string` |
| `latitude` | `string` |
| `longitude` | `string` |
| `userEmail` | `string` |
| `sentToApi` | `boolean` |

---

## Apple In-App Purchase (Subscription)

Implemented via `expo-iap` and `services/AppleSubscriptionService.tsx`.

Product IDs (defined in `constants/const.ts`):
- `com.yourapp.locator.monthly`
- `com.yourapp.locator.yearly`

**Purchase flow:**
1. `AppleSubscribeButton` renders in the Explore/Options screen.
2. `useSubscriptionProducts()` hook calls `IAP.initConnection()` and `IAP.fetchProducts()` on mount.
3. On button press, `purchaseSubscription()` calls `IAP.requestPurchase()`.
4. The global `purchaseUpdatedListener` in `app/_layout.tsx` receives the result:
   - Refreshes identity pool tokens.
   - Calls `LocationApiService.subscribeToService()` with the user ID and plan.
   - Calls `IAP.finishTransaction()` to acknowledge the purchase (Apple auto-refunds if not acknowledged within 24 hours).
5. Errors are handled by `purchaseErrorListener` (user cancellation is silently ignored).

---

## AsyncStorage Keys

Defined in both `constants/const.ts` and `services/LocationService.ts` (they must stay in sync):

| Key | Value stored |
|---|---|
| `@locator/jwt_token` | Cognito `idToken` string |
| `@locator/user_id` | Cognito `userId` |
| `@locator/user_email` | Sign-in email address |
| `@locator/user_name` | Display name |
| `@locator/location_history` | JSON array of `LocationHistoryEntry` (max 500) |
| `@locator/bg_update_interval` | Background interval in ms |
| `@locator/fg_update_interval` | Foreground interval in ms |
| `@locator/bg_last_send_time` | Epoch ms of last background API send |

---

## Theming

The app supports **light and dark mode** automatically via `userInterfaceStyle: "automatic"` in `app.json`.

- `constants/theme.ts` — defines `Colors` (light/dark palettes) and `Fonts` (platform-specific font stacks).
- `hooks/use-theme-color.ts` — resolves a color token to the current scheme's value.
- `hooks/use-color-scheme.ts` — wraps React Native's `useColorScheme`.

Tint colors:
- Light: `#0a7ea4`
- Dark: `#4CC2FF`

---

## Key Dependencies

| Package | Purpose |
|---|---|
| `expo-router ~6.0` | File-based navigation |
| `aws-amplify ^6.16` | Auth SDK |
| `@aws-amplify/react-native ^1.3` | React Native Amplify adapter |
| `expo-location ~19.0` | GPS foreground + background |
| `expo-task-manager ~14.0` | Background task registration |
| `expo-background-fetch ~14.0` | Background wakeup |
| `expo-iap ^3.4` | Apple/Google In-App Purchases |
| `@react-native-async-storage/async-storage ^2.2` | Local persistent storage |
| `react-native-reanimated ~4.1` | Animations |
| `react-native-gesture-handler ~2.28` | Gesture input |

---

## Build & Run

```bash
# Start Expo dev server
npm run start

# Run on iOS simulator / device
npm run ios
# or
npx expo run:ios --device

# Run on Android
npm run android

# Lint
npm run lint
```

EAS project ID: `b88d9295-be6d-4f3e-b956-97917e74d207`  
iOS bundle ID: `com.majboormajdoor.Locator`  
Android package: `com.majboormajdoor.Locator`
