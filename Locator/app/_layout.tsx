import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as IAP from 'expo-iap';
import { useEffect } from 'react';
import 'react-native-reanimated';
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from '@/hooks/use-color-scheme';
import AuthWrapper, { refreshIdentityPoolToken } from '@/components/AuthWrapper';

// Configure AWS Amplify
import '../constants/amplify-config';
import { LocationApiService } from '@/services/LocationApiService';
import { SubscriptionRequestBody } from '@/dto/models';
import { STORAGE_KEYS } from '@/services/LocationService';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    // Fires when a purchase or subscription completes successfully
    const purchaseUpdated = IAP.purchaseUpdatedListener(async (purchase) => {
      const transactionId = purchase.transactionId;
      if (!transactionId) return;

      try {
        await refreshIdentityPoolToken(); // Ensure we have the latest tokens for API calls
        const token = await AsyncStorage.getItem(STORAGE_KEYS.JWT_TOKEN);
        const userId = await AsyncStorage.getItem(STORAGE_KEYS.USER_ID);
        if (!userId || !token) {
          console.warn('No user session found. Cannot validate subscription.');
          return;
        }
        // TODO: send transactionId to your backend here for server-side validation
        // e.g. await validateTransactionOnServer(transactionId);
        const sub : SubscriptionRequestBody = new SubscriptionRequestBody(userId, 'monthly');
        const service = LocationApiService.getInstance();
        await service.subscribeToService(sub, token); // Placeholder for your subscription logic
        // Must call finishTransaction — Apple will auto-refund after 24h if not acknowledged
        await IAP.finishTransaction({ purchase, isConsumable: false });
        console.log('Subscription purchase completed:', purchase.productId);
      } catch (error) {
        console.error('Failed to finish transaction:', error);
      }
    });

    // Fires when a purchase fails or is cancelled by the user
    const purchaseError = IAP.purchaseErrorListener((error) => {
      if (error.code !== IAP.ErrorCode.UserCancelled) {
        console.error('Purchase error:', error.message);
      }
    });

    return () => {
      purchaseUpdated.remove();
      purchaseError.remove();
    };
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthWrapper>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
        <StatusBar style="auto" />
      </AuthWrapper>
    </ThemeProvider>
  );
}
