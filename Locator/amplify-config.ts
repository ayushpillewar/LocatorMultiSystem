import { Amplify } from 'aws-amplify';

// Replace these with your actual Cognito User Pool configuration
const amplifyConfig = {
  Auth: {
    Cognito: {
      region: 'ap-south-1', // e.g., 'us-east-1'
      userPoolId: 'ap-south-1_a4laup1vb', // e.g., 'us-east-1_XXXXXXXXX'
      userPoolClientId: '3ihfa3gj922q1scaq8osuab5jp', // e.g., '1234567890abcdef'
      loginWith: {
        email: true,
      },
      signUpVerificationMethod: 'code', // 'code' | 'link' 
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