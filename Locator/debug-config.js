// Add this to your app's entry point for Amplify debugging
import { Amplify } from 'aws-amplify';

// Enable Amplify logging
Amplify.configure({
  // your existing config
  ssr: false,
  // Add debug logging
  Auth: {
    // your auth config
    // cookieStorage: {
    //   domain: 'localhost',
    //   path: '/',
    //   expires: 365,
    //   sameSite: "strict",
    //   secure: true
    // }
  }
});

// Enable verbose logging
console.log('Amplify configured with debug mode');