import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { getCurrentUser, signOut } from '@aws-amplify/auth';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function UserProfile() {
  const [user, setUser] = useState<any>(null);
  const primaryColor = useThemeColor({}, 'tint');
  const borderColor = useThemeColor({ light: '#E0E0E0', dark: '#444444' }, 'border');

  useEffect(() => {
    checkCurrentUser();
  }, []);

  const checkCurrentUser = async () => {
    try {
      console.log('👤 [UserProfile] Checking current user...');
      const currentUser = await getCurrentUser();
      console.log('✅ [UserProfile] User found:', currentUser.username || 'Unknown');
      setUser(currentUser);
    } catch (error) {
      console.log('❌ [UserProfile] No user signed in:', error);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (error: any) {
              console.log('Error signing out:', error);
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          },
        },
      ],
    );
  };

  if (!user) {
    return null;
  }

  return (
    <ThemedView style={[styles.container, { borderBottomColor: borderColor }]}>
      <View style={styles.userInfo}>
        <ThemedText type="defaultSemiBold" style={styles.welcomeText}>
          Welcome
        </ThemedText>
        <ThemedText style={styles.emailText}>
          {user.signInDetails?.loginId || user.username}
        </ThemedText>
        {user.attributes?.name && (
          <ThemedText style={styles.nameText}>
            {user.attributes.name}
          </ThemedText>
        )}
      </View>
      <TouchableOpacity
        style={[styles.signOutButton, { borderColor: primaryColor }]}
        onPress={handleSignOut}
      >
        <ThemedText style={[styles.signOutText, { color: primaryColor }]}>
          Sign Out
        </ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  userInfo: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 16,
    marginBottom: 2,
  },
  emailText: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 1,
  },
  nameText: {
    fontSize: 12,
    opacity: 0.6,
  },
  signOutButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
  },
  signOutText: {
    fontSize: 14,
    fontWeight: '500',
  },
});