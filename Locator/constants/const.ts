
// Centralized constants for the Locator app
// API -------------------
export const API_BASE_URL = 'https://majboormajdoor.com';
const STORAGE_KEYS = {
  JWT_TOKEN: '@locator/jwt_token',
  USER_ID: '@locator/user_id',
  USER_EMAIL: '@locator/user_email',
};
export { STORAGE_KEYS };

// Apple IAP -------------------
export const PRODUCT_IDS = [
    'com.yourapp.locator.monthly',
    'com.yourapp.locator.yearly'
];
