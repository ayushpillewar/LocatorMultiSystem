import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { getCurrentUser, signOut, fetchAuthSession} from '@aws-amplify/auth';
import { Hub } from '@aws-amplify/core';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import AuthForm from '@/components/ui/login';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '@/constants/const';

interface AuthWrapperProps {
  children: React.ReactNode;
}

export async function refreshIdentityPoolToken() {
      // Store JWT token and user info for the background location service
      try {
        console.log('[AuthWrapper] Refreshing identity pool token...');
        const [session, currentUser] = await Promise.all([
          fetchAuthSession(),
          getCurrentUser(),
        ]);

        const token = session.tokens?.idToken?.toString() ?? '';
        
        await AsyncStorage.multiSet([
          [STORAGE_KEYS.JWT_TOKEN, token],
          [STORAGE_KEYS.USER_ID, currentUser.userId],
          [STORAGE_KEYS.USER_EMAIL, currentUser.signInDetails?.loginId ?? ''],
        ]);
      } catch (sessionErr) {
        console.warn('[AuthWrapper] Could not persist session tokens:', sessionErr);
      }
  }

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const primaryColor = useThemeColor({}, 'tint');

  useEffect(() => {
    checkAuthState();
    
    // Listen for auth events
    const hubListener = Hub.listen('auth', ({ payload: { event, data } }) => {
      switch (event) {
        case 'signIn':
          setUser(data);
          console.log('User signed in:', data.username);
          refreshIdentityPoolToken(); // Refresh tokens on sign in
          break;
        case 'signUp':
          console.log('User signed up:', data.username);
          break;
        case 'signOut':
          setUser(null);
          console.log('User signed out');
          break;
        case 'signIn_failure':
          console.log('User sign in failed:', data);
          break;
        case 'tokenRefresh':
          console.log('Token refreshed');
          break;
        case 'tokenRefresh_failure':
          console.log('Token refresh failed');
          break;
        case 'configured':
          console.log('Auth module configured');
          break;
        default:
          break;
      }
    });

    return () => hubListener();
  }, []);

  const checkAuthState = async () => {
    try {
      const authenticatedUser = await getCurrentUser();
      refreshIdentityPoolToken(); // Ensure tokens are refreshed and stored
      setUser(authenticatedUser);
    } catch (error) {
      // User is not authenticated
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setUser(null);
    } catch (error) {
      console.log('Error signing out:', error);
    }
  };

  const handleAuthSuccess = () => {
    // Auth state will be updated via Hub listener
    checkAuthState();
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={primaryColor} />
        <ThemedText style={styles.loadingText}>Checking authentication...</ThemedText>
      </ThemedView>
    );
  }

  if (!user) {
    return <AuthForm onAuthSuccess={handleAuthSuccess} />;
  }

  // User is authenticated, render the main app
  return (
    <View style={{ flex: 1 }}>
      {children}
    </View>
  );
}

// Export sign out function for use in other components
export { AuthWrapper };

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
});