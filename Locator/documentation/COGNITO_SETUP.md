# AWS Cognito Authentication Setup Guide

## Overview
This guide will help you configure your existing AWS Cognito User Pool with your React Native Expo app using AWS Amplify v6.

## Prerequisites
- Existing AWS Cognito User Pool
- AWS Account with appropriate permissions
- React Native/Expo development environment

## Step 1: Configure amplify-config.ts

Replace the placeholder values in `/amplify-config.ts` with your actual Cognito User Pool configuration:

```typescript
import { Amplify } from 'aws-amplify';

const amplifyConfig = {
  Auth: {
    Cognito: {
      region: 'your-aws-region',                    // e.g., 'us-east-1', 'eu-west-1'
      userPoolId: 'your-user-pool-id',             // e.g., 'us-east-1_XXXXXXXXX'
      userPoolClientId: 'your-app-client-id',      // e.g., '1234567890abcdefghijk'
      loginWith: {
        email: true,
      },
      signUpVerificationMethod: 'code',
      userAttributes: {
        email: {
          required: true,
        },
        name: {
          required: true,
        },
      },
      allowGuestAccess: false,
      passwordFormat: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireNumbers: true,
        requireSpecialCharacters: false,
      },
    },
  },
};

Amplify.configure(amplifyConfig);
export default amplifyConfig;
```

## Step 2: Find Your Cognito User Pool Information

### In AWS Console:
1. Go to **AWS Cognito** service
2. Click on **User Pools**
3. Select your existing user pool
4. Note down the **Pool Id** (this is your `userPoolId`)
5. Go to **App Integration** tab
6. Under **App clients and analytics**, find your app client
7. Note down the **Client ID** (this is your `userPoolWebClientId`)
8. The region is visible in the Pool Id (e.g., `us-east-1_XXXXXXXXX` → region is `us-east-1`)

### Required User Pool Settings:
Ensure your Cognito User Pool has these settings configured:

#### Authentication Flow:
- The app uses standard username/password authentication
- Email verification is handled through confirmation codes
- No additional authentication flows need to be configured in Cognito

#### Required Attributes:
- **email** (recommended as username)
- **name** (optional, for full name)

#### Sign-up Configuration:
- Allow users to sign themselves up: **Enabled**
- Email verification: **Required** (recommended)

## Step 3: App Client Configuration

In your Cognito User Pool app client settings:

1. **App client secret**: Not required for mobile apps (leave disabled)
2. **OAuth 2.0 settings** (if using OAuth): Configure as needed
3. **Authentication flows**: Standard flows are automatically supported

Note: With Amplify v6, you don't need to manually configure authentication flows like USER_PASSWORD_AUTH - the library handles this automatically.

## Step 4: Test the Integration

1. Start your Expo development server:
   ```bash
   npm start
   ```

2. The app will now show the authentication screen for new users
3. Test sign up with a valid email address
4. Check your email for verification code
5. After verification, test sign in
6. You should see the main app with a user profile header

## Step 5: Security Considerations

### Production Checklist:
- [ ] Enable MFA (Multi-Factor Authentication) if required
- [ ] Configure password policy (minimum length, complexity)
- [ ] Set up account takeover protection
- [ ] Configure Lambda triggers if needed (pre-sign-up, post-confirmation, etc.)
- [ ] Review and configure token expiration times
- [ ] Set up proper IAM roles and policies

### Environment Variables (Recommended):
For production, consider using environment variables instead of hardcoded values:

```typescript
const amplifyConfig = {
  Auth: {
    Cognito: {
      region: process.env.EXPO_PUBLIC_AWS_REGION,
      userPoolId: process.env.EXPO_PUBLIC_USER_POOL_ID,
      userPoolClientId: process.env.EXPO_PUBLIC_USER_POOL_CLIENT_ID,
      loginWith: {
        email: true,
      },
      signUpVerificationMethod: 'code',
      userAttributes: {
        email: {
          required: true,
        },
        name: {
          required: true,
        },
      },
      allowGuestAccess: false,
    },
  },
}
```

Create a `.env` file (add to `.gitignore`):
```
EXPO_PUBLIC_AWS_REGION=us-east-1
EXPO_PUBLIC_USER_POOL_ID=us-east-1_XXXXXXXXX
EXPO_PUBLIC_USER_POOL_CLIENT_ID=your-client-id
```

## Troubleshooting

### Common Issues:

1. **"Configuration error" or "Auth module not configured"**
   - Ensure you've imported the amplify-config.ts file in your app layout
   - Verify all required configuration values are set

2. **"Invalid verification code provided"**
   - Check that email verification is properly configured
   - Ensure the user is entering the correct 6-digit code

3. **"User is not confirmed"**
   - User needs to complete email verification process

4. **Authentication errors on sign in**
   - Verify userPoolId and userPoolClientId are correct
   - Check that the region matches your user pool location

5. **"Cannot read property" errors**
   - Make sure you're using Amplify v6 compatible imports
   - Update from `Auth.method()` to individual method imports

### Debug Mode:
Enable AWS Amplify debug logging by adding to your amplify-config.ts:

```typescript
import { Amplify } from 'aws-amplify';

// Enable debug logging
Amplify.configure(amplifyConfig, {
  ...amplifyConfig,
  Logging: {
    level: 'DEBUG',
  },
});
```

## Next Steps

1. Customize the authentication UI to match your app design
2. Add password reset functionality
3. Implement social sign-in if needed
4. Add user profile management features
5. Configure additional security features like MFA

## Additional Features Available

The authentication system includes:
- ✅ Sign up with email verification
- ✅ Sign in with email/password
- ✅ Auto sign-out functionality  
- ✅ Authentication state management
- ✅ Dark/Light theme support
- ✅ Form validation and error handling
- ✅ Loading states
- ✅ Responsive design
- ✅ Built with AWS Amplify v6

Need help implementing additional features? Let me know!