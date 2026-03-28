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
import { signUp, signIn, confirmSignUp, resendSignUpCode } from '@aws-amplify/auth';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';

interface AuthFormProps {
  onAuthSuccess: () => void;
}

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
  const borderColor = useThemeColor({ light: '#E0E0E0', dark: '#444444' }, 'border');
  const inputBackgroundColor = useThemeColor({ light: '#F8F8F8', dark: '#2A2A2A' }, 'background');

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
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ThemedView style={styles.formContainer}>
          <ThemedText type="title" style={styles.title}>
            Confirm Your Account
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Enter the confirmation code sent to {email}
          </ThemedText>

          <TextInput
            style={[
              styles.input,
              {
                borderColor,
                backgroundColor: inputBackgroundColor,
                color: textColor,
              }
            ]}
            placeholder="Confirmation Code"
            placeholderTextColor={useThemeColor({ light: '#666', dark: '#999' }, 'text')}
            value={confirmationCode}
            onChangeText={setConfirmationCode}
            keyboardType="number-pad"
            maxLength={6}
          />

          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: primaryColor }]}
            onPress={handleConfirmSignUp}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <ThemedText style={styles.primaryButtonText}>Confirm Account</ThemedText>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkButton} onPress={resendConfirmationCode}>
            <ThemedText style={[styles.linkText, { color: primaryColor }]}>
              Resend Code
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkButton} onPress={() => setShowConfirmation(false)}>
            <ThemedText style={[styles.linkText, { color: primaryColor }]}>
              Back to Sign Up
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <ThemedView style={styles.formContainer}>
          <ThemedText type="title" style={styles.title}>
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            {isLogin ? 'Sign in to your account' : 'Sign up to get started'}
          </ThemedText>

          {!isLogin && (
            <TextInput
              style={[
                styles.input,
                {
                  borderColor,
                  backgroundColor: inputBackgroundColor,
                  color: textColor,
                }
              ]}
              placeholder="Full Name"
              placeholderTextColor={useThemeColor({ light: '#666', dark: '#999' }, 'text')}
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
            />
          )}

          <TextInput
            style={[
              styles.input,
              {
                borderColor,
                backgroundColor: inputBackgroundColor,
                color: textColor,
              }
            ]}
            placeholder="Email"
            placeholderTextColor={useThemeColor({ light: '#666', dark: '#999' }, 'text')}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />

          <TextInput
            style={[
              styles.input,
              {
                borderColor,
                backgroundColor: inputBackgroundColor,
                color: textColor,
              }
            ]}
            placeholder="Password"
            placeholderTextColor={useThemeColor({ light: '#666', dark: '#999' }, 'text')}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete={isLogin ? 'current-password' : 'new-password'}
          />

          {!isLogin && (
            <TextInput
              style={[
                styles.input,
                {
                  borderColor,
                  backgroundColor: inputBackgroundColor,
                  color: textColor,
                }
              ]}
              placeholder="Confirm Password"
              placeholderTextColor={useThemeColor({ light: '#666', dark: '#999' }, 'text')}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoComplete="new-password"
            />
          )}

          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: primaryColor }]}
            onPress={isLogin ? handleSignIn : handleSignUp}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <ThemedText style={styles.primaryButtonText}>
                {isLogin ? 'Sign In' : 'Sign Up'}
              </ThemedText>
            )}
          </TouchableOpacity>

          {isLogin && (
            <TouchableOpacity style={styles.linkButton}>
              <ThemedText style={[styles.linkText, { color: primaryColor }]}>
                Forgot Password?
              </ThemedText>
            </TouchableOpacity>
          )}

          <View style={styles.switchContainer}>
            <ThemedText style={styles.switchText}>
              {isLogin ? "Don't have an account? " : "Already have an account? "}
            </ThemedText>
            <TouchableOpacity onPress={switchAuthMode}>
              <ThemedText style={[styles.linkText, { color: primaryColor }]}>
                {isLogin ? 'Sign Up' : 'Sign In'}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </ThemedView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  formContainer: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    maxWidth: 400,
    width: '100%',
    alignSelf: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 32,
    opacity: 0.7,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 16,
  },
  primaryButton: {
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  linkButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '500',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  switchText: {
    fontSize: 14,
  },
});
