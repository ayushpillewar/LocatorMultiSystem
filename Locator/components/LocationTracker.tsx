import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, Pressable } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import * as Location from 'expo-location';

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  timestamp: number;
}

interface LocationTrackerProps {
  style?: any;
}

export function LocationTracker({ style }: LocationTrackerProps) {
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [lastUpdateTime, setLastUpdateTime] = useState<string>('');
  const [watchSubscription, setWatchSubscription] = useState<Location.LocationSubscription | null>(null);

  useEffect(() => {
    checkPermissions();
    return () => {
      // Cleanup when component unmounts
      if (watchSubscription) {
        watchSubscription.remove();
      }
    };
  }, []);

  const checkPermissions = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setHasPermission(status === 'granted');
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Location permission is required to track your position. Please enable it in Settings.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Permission error:', error);
      setHasPermission(false);
    }
  };

  const handleStartTracking = async () => {
    if (!hasPermission) {
      await checkPermissions();
      return;
    }

    Alert.alert(
      'Start Location Tracking',
      'This will track your location continuously while the app is active.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start',
          onPress: async () => {
            try {
              const subscription = await Location.watchPositionAsync(
                {
                  accuracy: Location.Accuracy.High,
                  timeInterval: 10000, // Update every 10 seconds
                  distanceInterval: 10, // Update every 10 meters
                },
                (location) => {
                  const locationData: LocationData = {
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                    accuracy: location.coords.accuracy,
                    timestamp: location.timestamp,
                  };

                  setCurrentLocation(locationData);
                  setLastUpdateTime(new Date().toLocaleTimeString());
                  console.log('Location updated:', locationData);
                }
              );

              setWatchSubscription(subscription);
              setIsTracking(true);

              // Get initial location
              const initialLocation = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
              });

              if (initialLocation) {
                const locationData: LocationData = {
                  latitude: initialLocation.coords.latitude,
                  longitude: initialLocation.coords.longitude,
                  accuracy: initialLocation.coords.accuracy,
                  timestamp: initialLocation.timestamp,
                };
                setCurrentLocation(locationData);
                setLastUpdateTime(new Date().toLocaleTimeString());
              }
            } catch (error) {
              console.error('Location tracking error:', error);
              Alert.alert('Error', 'Failed to start location tracking');
            }
          },
        },
      ]
    );
  };

  const handleStopTracking = async () => {
    if (watchSubscription) {
      watchSubscription.remove();
      setWatchSubscription(null);
    }
    setIsTracking(false);
    setLastUpdateTime('');
  };

  const handleGetCurrentLocation = async () => {
    if (!hasPermission) {
      await checkPermissions();
      return;
    }

    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const locationData: LocationData = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        timestamp: location.timestamp,
      };

      setCurrentLocation(locationData);
      setLastUpdateTime(new Date().toLocaleTimeString());
    } catch (error) {
      console.error('Get location error:', error);
      Alert.alert('Error', 'Failed to get current location');
    }
  };

  const formatCoordinate = (value: number, precision: number = 6): string => {
    return value.toFixed(precision);
  };

  const formatAccuracy = (accuracy: number | null): string => {
    if (accuracy === null) return 'Unknown';
    return `±${accuracy.toFixed(1)}m`;
  };

  if (hasPermission === null) {
    return (
      <ThemedView style={[styles.container, style]}>
        <ThemedText style={styles.loadingText}>Checking location permissions...</ThemedText>
      </ThemedView>
    );
  }

  if (!hasPermission) {
    return (
      <ThemedView style={[styles.container, style]}>
        <ThemedText style={styles.errorText}>Location permission is required</ThemedText>
        <Pressable style={styles.button} onPress={checkPermissions}>
          <ThemedText style={styles.buttonText}>Request Permission</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, style]}>
      <ThemedText type="title" style={styles.title}>
        Location Tracker
      </ThemedText>

      <ThemedView style={styles.statusContainer}>
        <ThemedText type="subtitle" style={styles.statusLabel}>
          Status: 
        </ThemedText>
        <ThemedText 
          style={[
            styles.statusText, 
            { color: isTracking ? '#4CAF50' : '#FF9800' }
          ]}
        >
          {isTracking ? 'TRACKING' : 'STOPPED'}
        </ThemedText>
      </ThemedView>

      {currentLocation && (
        <ThemedView style={styles.locationContainer}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Current Location
          </ThemedText>
          
          <ThemedView style={styles.locationDetails}>
            <ThemedView style={styles.coordinateRow}>
              <ThemedText style={styles.label}>Latitude:</ThemedText>
              <ThemedText style={styles.value}>
                {formatCoordinate(currentLocation.latitude)}
              </ThemedText>
            </ThemedView>
            
            <ThemedView style={styles.coordinateRow}>
              <ThemedText style={styles.label}>Longitude:</ThemedText>
              <ThemedText style={styles.value}>
                {formatCoordinate(currentLocation.longitude)}
              </ThemedText>
            </ThemedView>
            
            <ThemedView style={styles.coordinateRow}>
              <ThemedText style={styles.label}>Accuracy:</ThemedText>
              <ThemedText style={styles.value}>
                {formatAccuracy(currentLocation.accuracy)}
              </ThemedText>
            </ThemedView>

            {lastUpdateTime && (
              <ThemedView style={styles.coordinateRow}>
                <ThemedText style={styles.label}>Last Update:</ThemedText>
                <ThemedText style={styles.value}>{lastUpdateTime}</ThemedText>
              </ThemedView>
            )}
          </ThemedView>
        </ThemedView>
      )}

      <ThemedView style={styles.buttonContainer}>
        {!isTracking ? (
          <>
            <Pressable 
              style={[styles.button, styles.startButton]} 
              onPress={handleStartTracking}
            >
              <ThemedText style={styles.buttonText}>Start Tracking</ThemedText>
            </Pressable>
            
            <Pressable 
              style={[styles.button, styles.getCurrentButton]} 
              onPress={handleGetCurrentLocation}
            >
              <ThemedText style={styles.buttonText}>Get Current Location</ThemedText>
            </Pressable>
          </>
        ) : (
          <Pressable 
            style={[styles.button, styles.stopButton]} 
            onPress={handleStopTracking}
          >
            <ThemedText style={styles.buttonText}>Stop Tracking</ThemedText>
          </Pressable>
        )}
      </ThemedView>

      <ThemedView style={styles.noteContainer}>
        <ThemedText style={styles.noteText}>
          Note: This version works in foreground only. For background location tracking, a development build is required.
        </ThemedText>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    borderRadius: 12,
    marginVertical: 10,
  },
  title: {
    textAlign: 'center',
    marginBottom: 20,
  },
  loadingText: {
    textAlign: 'center',
    fontStyle: 'italic',
  },
  errorText: {
    textAlign: 'center',
    color: '#FF5722',
    marginBottom: 15,
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  statusLabel: {
    marginRight: 8,
  },
  statusText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  locationContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    marginBottom: 12,
    textAlign: 'center',
  },
  locationDetails: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
    padding: 15,
  },
  coordinateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
    marginBottom: 8,
  },
  label: {
    fontWeight: '600',
    flex: 1,
  },
  value: {
    flex: 2,
    textAlign: 'right',
    fontFamily: 'monospace',
  },
  buttonContainer: {
    gap: 12,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButton: {
    backgroundColor: '#4CAF50',
  },
  stopButton: {
    backgroundColor: '#FF5722',
  },
  getCurrentButton: {
    backgroundColor: '#2196F3',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  noteContainer: {
    marginTop: 20,
    padding: 12,
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  noteText: {
    fontSize: 12,
    fontStyle: 'italic',
    opacity: 0.8,
    lineHeight: 16,
  },
});