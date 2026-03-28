import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { signUp, signIn, confirmSignUp, resendSignUpCode, fetchAuthSession, getCurrentUser } from '@aws-amplify/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { AppStyles } from '@/constants/appStyles';

interface AuthFormProps {
  onAuthSuccess: () => void;
}

const STORAGE_KEYS = {
  JWT_TOKEN: '@locator/jwt_token',
  USER_ID: '@locator/user_id',
  USER_EMAIL: '@locator/user_email',
};

export default function AuthForm({ onAuthSuccess }: AuthFormProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmationCode, setConfirmationCode] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);

  const primaryColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({ light: '#E0E0E0', dark: '#444444' }, 'icon');
  const inputBackgroundColor = useThemeColor({ light: '#F8F8F8', dark: '#2A2A2A' }, 'background');
  const placeholderColor = useThemeColor({ light: '#888', dark: '#666' }, 'icon');

  const validateForm = () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email');
      return false;
    }
    if (!password.trim()) {
      Alert.alert('Error', 'Please enter your password');
      return false;
    }
    if (!isLogin) {
      if (!fullName.trim()) {
        Alert.alert('Error', 'Please enter your full name');
        return false;
      }
      if (password !== confirmPassword) {
        Alert.alert('Error', 'Passwords do not match');
        return false;
      }
      if (password.length < 8) {
        Alert.alert('Error', 'Password must be at least 8 characters long');
        return false;
      }
    }
    return true;
  };

  const handleSignUp = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await signUp({
        username: email,
        password: password,
        options: {
          userAttributes: {
            email: email,
            name: fullName,
          },
        },
      });
      setShowConfirmation(true);
      Alert.alert(
        'Check your email',
        'We sent you a confirmation code. Please check your email and enter the code below.'
      );
    } catch (error: any) {
      Alert.alert('Sign Up Failed', error.message || 'An error occurred during sign up');
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await signIn({ username: email, password: password });

      // Store JWT token and user info for the background location service
      try {
        const [session, currentUser] = await Promise.all([
          fetchAuthSession(),
          getCurrentUser(),
        ]);
        const token = session.tokens?.idToken?.toString() ?? '';
        await AsyncStorage.multiSet([
          [STORAGE_KEYS.JWT_TOKEN, token],
          [STORAGE_KEYS.USER_ID, currentUser.userId],
          [STORAGE_KEYS.USER_EMAIL, email.toLowerCase().trim()],
        ]);
      } catch (sessionErr) {
        console.warn('[AuthForm] Could not persist session tokens:', sessionErr);
      }

      onAuthSuccess();
    } catch (error: any) {
      Alert.alert('Sign In Failed', error.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSignUp = async () => {
    if (!confirmationCode.trim()) {
      Alert.alert('Error', 'Please enter the confirmation code');
      return;
    }

    setLoading(true);
    try {
      await confirmSignUp({ username: email, confirmationCode: confirmationCode });
      Alert.alert('Success', 'Account confirmed successfully! You can now sign in.');
      setShowConfirmation(false);
      setIsLogin(true);
      // Clear form
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setFullName('');
      setConfirmationCode('');
    } catch (error: any) {
      Alert.alert('Confirmation Failed', error.message || 'Invalid confirmation code');
    } finally {
      setLoading(false);
    }
  };

  const resendConfirmationCode = async () => {
    try {
      await resendSignUpCode({ username: email });
      Alert.alert('Code Sent', 'A new confirmation code has been sent to your email.');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to resend confirmation code');
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setFullName('');
    setConfirmationCode('');
    setShowConfirmation(false);
  };

  const switchAuthMode = () => {
    setIsLogin(!isLogin);
    resetForm();
  };

  if (showConfirmation) {
    return (
      <KeyboardAvoidingView
        style={AppStyles.flex1}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ThemedView style={AppStyles.formContainer}>
          <ThemedText type="title" style={localStyles.titleOverride}>
            Confirm Your Account
          </ThemedText>
          <ThemedText style={AppStyles.subtitle}>
            Enter the confirmation code sent to {email}
          </ThemedText>

          <TextInput
            style={[AppStyles.input, { borderColor, backgroundColor: inputBackgroundColor, color: textColor }]}
            placeholder="Confirmation Code"
            placeholderTextColor={placeholderColor}
            value={confirmationCode}
            onChangeText={setConfirmationCode}
            keyboardType="number-pad"
            maxLength={6}
          />

          <TouchableOpacity
            style={[AppStyles.primaryButton, { backgroundColor: primaryColor, marginTop: 8, marginBottom: 16 }]}
            onPress={handleConfirmSignUp}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <ThemedText style={AppStyles.primaryButtonText}>Confirm Account</ThemedText>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={AppStyles.linkButton} onPress={resendConfirmationCode}>
            <ThemedText style={[AppStyles.linkText, { color: primaryColor }]}>Resend Code</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity style={AppStyles.linkButton} onPress={() => setShowConfirmation(false)}>
            <ThemedText style={[AppStyles.linkText, { color: primaryColor }]}>Back to Sign Up</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={AppStyles.flex1}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={AppStyles.scrollContent} showsVerticalScrollIndicator={false}>
        <ThemedView style={AppStyles.formContainer}>
          <ThemedText type="title" style={localStyles.titleOverride}>
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </ThemedText>
          <ThemedText style={AppStyles.subtitle}>
            {isLogin ? 'Sign in to your account' : 'Sign up to get started'}
          </ThemedText>

          {!isLogin && (
            <TextInput
              style={[AppStyles.input, { borderColor, backgroundColor: inputBackgroundColor, color: textColor }]}
              placeholder="Full Name"
              placeholderTextColor={placeholderColor}
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
            />
          )}

          <TextInput
            style={[AppStyles.input, { borderColor, backgroundColor: inputBackgroundColor, color: textColor }]}
            placeholder="Email"
            placeholderTextColor={placeholderColor}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />

          <TextInput
            style={[AppStyles.input, { borderColor, backgroundColor: inputBackgroundColor, color: textColor }]}
            placeholder="Password"
            placeholderTextColor={placeholderColor}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete={isLogin ? 'current-password' : 'new-password'}
          />

          {!isLogin && (
            <TextInput
              style={[AppStyles.input, { borderColor, backgroundColor: inputBackgroundColor, color: textColor }]}
              placeholder="Confirm Password"
              placeholderTextColor={placeholderColor}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoComplete="new-password"
            />
          )}

          <TouchableOpacity
            style={[AppStyles.primaryButton, { backgroundColor: primaryColor, marginTop: 8, marginBottom: 16 }]}
            onPress={isLogin ? handleSignIn : handleSignUp}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <ThemedText style={AppStyles.primaryButtonText}>
                {isLogin ? 'Sign In' : 'Sign Up'}
              </ThemedText>
            )}
          </TouchableOpacity>

          {isLogin && (
            <TouchableOpacity style={AppStyles.linkButton}>
              <ThemedText style={[AppStyles.linkText, { color: primaryColor }]}>
                Forgot Password?
              </ThemedText>
            </TouchableOpacity>
          )}

          <View style={AppStyles.switchContainer}>
            <ThemedText style={AppStyles.switchText}>
              {isLogin ? "Don't have an account? " : "Already have an account? "}
            </ThemedText>
            <TouchableOpacity onPress={switchAuthMode}>
              <ThemedText style={[AppStyles.linkText, { color: primaryColor }]}>
                {isLogin ? 'Sign Up' : 'Sign In'}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </ThemedView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// Only component-specific overrides that don't belong in the shared sheet
const localStyles = StyleSheet.create({
  titleOverride: {
    textAlign: 'center',
    marginBottom: 8,
  },
});
