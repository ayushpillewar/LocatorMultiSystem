import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Alert, Modal } from 'react-native';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';
import { DebugLogger, getDeviceInfo } from '../utils/debugUtils';
import * as Location from 'expo-location';
import { getCurrentUser } from '@aws-amplify/auth';
import { AppStyles } from '@/constants/appStyles';

/**
 * Development Debug Panel - Only shows in development mode
 * Add this component anywhere in your app during development
 */
export function DebugPanel() {
  const [isVisible, setIsVisible] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  if (!__DEV__) return null; // Only show in development

  const runLocationTest = async () => {
    try {
      DebugLogger.info('DebugPanel', 'Running location test...');
      
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Debug', 'Location permission required');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      
      setDebugInfo({
        type: 'location',
        data: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy,
          altitude: location.coords.altitude,
          timestamp: new Date(location.timestamp).toLocaleString()
        }
      });
    } catch (error) {
      DebugLogger.error('DebugPanel', 'Location test failed', error);
      Alert.alert('Debug Error', error.message);
    }
  };

  const runAuthTest = async () => {
    try {
      DebugLogger.info('DebugPanel', 'Running auth test...');
      
      const user = await getCurrentUser();
      setDebugInfo({
        type: 'auth',
        data: {
          username: user.username,
          signInDetails: user.signInDetails,
          userId: user.userId
        }
      });
    } catch (error) {
      DebugLogger.error('DebugPanel', 'Auth test failed', error);
      setDebugInfo({
        type: 'auth',
        data: { error: 'No user signed in' }
      });
    }
  };

  const showDeviceInfo = () => {
    const info = getDeviceInfo();
    setDebugInfo({
      type: 'device',
      data: info
    });
  };

  const clearLogs = () => {
    console.clear();
    Alert.alert('Debug', 'Console logs cleared');
  };

  return (
    <>
      {/* Floating debug button */}
      <TouchableOpacity 
        style={styles.floatingButton}
        onPress={() => setIsVisible(true)}
      >
        <ThemedText style={styles.floatingButtonText}>🐛</ThemedText>
      </TouchableOpacity>

      {/* Debug panel modal */}
      <Modal
        visible={isVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <ThemedView style={styles.container}>
          <View style={styles.header}>
            <ThemedText type="title">🛠️ Debug Panel</ThemedText>
            <TouchableOpacity 
              onPress={() => setIsVisible(false)}
              style={styles.closeButton}
            >
              <ThemedText style={styles.closeButtonText}>✕</ThemedText>
            </TouchableOpacity>
          </View>

          <View style={[AppStyles.gap16, { marginTop: 4 }]}>
            <TouchableOpacity
              style={[AppStyles.primaryButton, { backgroundColor: '#007AFF' }]}
              onPress={runLocationTest}
            >
              <ThemedText style={AppStyles.primaryButtonText}>📍 Test Location</ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[AppStyles.primaryButton, { backgroundColor: '#007AFF' }]}
              onPress={runAuthTest}
            >
              <ThemedText style={AppStyles.primaryButtonText}>🔐 Test Auth</ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[AppStyles.primaryButton, { backgroundColor: '#007AFF' }]}
              onPress={showDeviceInfo}
            >
              <ThemedText style={AppStyles.primaryButtonText}>📱 Device Info</ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[AppStyles.primaryButton, { backgroundColor: '#007AFF' }]}
              onPress={clearLogs}
            >
              <ThemedText style={AppStyles.primaryButtonText}>🗑️ Clear Logs</ThemedText>
            </TouchableOpacity>
          </View>

          {debugInfo && (
            <ThemedView style={[AppStyles.card, { marginTop: 20 }]}>
              <ThemedText type="subtitle">Result ({debugInfo.type}):</ThemedText>
              <ThemedText style={[AppStyles.caption, AppStyles.monoText]}>
                {JSON.stringify(debugInfo.data, null, 2)}
              </ThemedText>
            </ThemedView>
          )}
        </ThemedView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000,
  },
  floatingButtonText: {
    fontSize: 20,
    color: 'white',
  },
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  closeButton: {
    padding: 10,
  },
  closeButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});