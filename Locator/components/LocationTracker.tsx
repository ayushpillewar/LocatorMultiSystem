import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, Pressable, ActivityIndicator, Linking, Platform } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import * as Location from 'expo-location';
import { LocationService, LocationHistoryEntry, INTERVAL_OPTIONS, DEFAULT_BG_INTERVAL, DEFAULT_FG_INTERVAL } from '@/services/LocationService';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { AppStyles } from '@/constants/appStyles';

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  timestamp: number;
}

interface LocationTrackerProps {
  style?: any;
}

function IntervalPickerRow({
  label,
  selected,
  onSelect,
  tint,
  isDark,
}: {
  label: string;
  selected: number;
  onSelect: (value: number) => void;
  tint: string;
  isDark: boolean;
}) {
  return (
    <View style={{ marginTop: 10 }}>
      <ThemedText style={{ fontSize: 11, opacity: 0.5, marginBottom: 6, fontWeight: '600', letterSpacing: 0.5 }}>
        {label.toUpperCase()}
      </ThemedText>
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        {INTERVAL_OPTIONS.map((opt) => {
          const active = selected === opt.value;
          return (
            <Pressable
              key={opt.value}
              onPress={() => onSelect(opt.value)}
              style={({ pressed }) => ({
                paddingHorizontal: 14,
                paddingVertical: 6,
                borderRadius: 20,
                borderWidth: 1.5,
                borderColor: active ? tint : isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                backgroundColor: active ? tint + '22' : 'transparent',
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <ThemedText style={{ fontSize: 13, fontWeight: active ? '700' : '500', color: active ? tint : undefined }}>
                {opt.label}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

type ActiveTab = 'tracking' | 'history';

export function LocationTracker({ style }: LocationTrackerProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('tracking');

  // Foreground tracking state
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [lastUpdateTime, setLastUpdateTime] = useState<string>('');
  const [watchSubscription, setWatchSubscription] = useState<Location.LocationSubscription | null>(null);

  // Background service state
  const [isBackgroundTracking, setIsBackgroundTracking] = useState(false);
  const [bgLoading, setBgLoading] = useState(false);

  // Interval state
  const [bgInterval, setBgInterval] = useState(DEFAULT_BG_INTERVAL);
  const [fgInterval, setFgInterval] = useState(DEFAULT_FG_INTERVAL);

  // History state
  const [locationHistory, setLocationHistory] = useState<LocationHistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const locationService = LocationService.getInstance();

  useEffect(() => {
    checkPermissions();
    checkBackgroundTrackingStatus();
    LocationService.getBackgroundInterval().then(setBgInterval);
    LocationService.getForegroundInterval().then(setFgInterval);
    return () => {
      watchSubscription?.remove();
    };
  }, []);

  useEffect(() => {
    if (activeTab === 'history') {
      loadLocationHistory();
    }
  }, [activeTab]);

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
      console.error('[LocationTracker] Permission error:', error);
      setHasPermission(false);
    }
  };

  const checkBackgroundTrackingStatus = async () => {
    const active = await locationService.isBackgroundTrackingActive();
    setIsBackgroundTracking(active);
  };

  const handleBgIntervalChange = async (ms: number) => {
    await LocationService.setBackgroundInterval(ms);
    setBgInterval(ms);
    if (isBackgroundTracking) {
      Alert.alert(
        'Restart Required',
        'The background service needs to restart to apply the new interval. Restart now?',
        [
          { text: 'Later', style: 'cancel' },
          {
            text: 'Restart',
            onPress: async () => {
              setBgLoading(true);
              try {
                await locationService.restartBackgroundTracking();
              } finally {
                setBgLoading(false);
              }
            },
          },
        ]
      );
    }
  };

  const handleFgIntervalChange = async (ms: number) => {
    await LocationService.setForegroundInterval(ms);
    setFgInterval(ms);
    if (isTracking) {
      watchSubscription?.remove();
      setWatchSubscription(null);
      setIsTracking(false);
      setLastUpdateTime('');
      await handleStartTracking(ms);
    }
  };

  const handleToggleBackgroundService = async () => {
    setBgLoading(true);
    try {
      if (isBackgroundTracking) {
        await locationService.stopBackgroundTracking();
        setIsBackgroundTracking(false);
        Alert.alert('Stopped', 'Background location service has been stopped.');
      } else {
        const success = await locationService.startBackgroundTracking();
        if (success) {
          setIsBackgroundTracking(true);
          Alert.alert(
            'Started',
            `Background service is now running. Your location will be sent to the server every ${INTERVAL_OPTIONS.find(o => o.value === bgInterval)?.label ?? '30 s'}.`
          );
        } else {
          Alert.alert(
            'Failed',
            'Could not start background service. Please ensure location permissions are granted.'
          );
        }
      }
    } catch (err) {
      console.error('[LocationTracker] Background toggle error:', err);
      Alert.alert('Error', 'An error occurred while toggling the background service.');
    } finally {
      setBgLoading(false);
    }
  };

  const handleStartTracking = async (interval?: number) => {
    if (!hasPermission) {
      await checkPermissions();
      return;
    }
    try {
      const timeInterval = interval ?? fgInterval;
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval,
          distanceInterval: 10,
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
        }
      );
      setWatchSubscription(subscription);
      setIsTracking(true);

      const initial = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setCurrentLocation({
        latitude: initial.coords.latitude,
        longitude: initial.coords.longitude,
        accuracy: initial.coords.accuracy,
        timestamp: initial.timestamp,
      });
      setLastUpdateTime(new Date().toLocaleTimeString());
    } catch (error) {
      console.error('Location tracking error:', error);
      Alert.alert('Error', 'Failed to start location tracking');
    }
  };

  const handleStopTracking = () => {
    watchSubscription?.remove();
    setWatchSubscription(null);
    setIsTracking(false);
    setLastUpdateTime('');
  };

  const handleGetCurrentLocation = async () => {
    if (!hasPermission) {
      await checkPermissions();
      return;
    }
    try {
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setCurrentLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        timestamp: location.timestamp,
      });
      setLastUpdateTime(new Date().toLocaleTimeString());
    } catch (error) {
      console.error('Get location error:', error);
      Alert.alert('Error', 'Failed to get current location');
    }
  };

  const loadLocationHistory = async () => {
    setHistoryLoading(true);
    try {
      const history = await LocationService.getLocationHistory();
      setLocationHistory(history);
    } finally {
      setHistoryLoading(false);
    }
  };

  const openInMaps = async (latitude: string, longitude: string) => {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const nativeUrl = Platform.select({
      ios: `maps://?q=${lat},${lng}`,
      android: `geo:${lat},${lng}?q=${lat},${lng}`,
      default: `https://www.google.com/maps?q=${lat},${lng}`,
    })!;
    const canOpen = await Linking.canOpenURL(nativeUrl);
    Linking.openURL(canOpen ? nativeUrl : `https://www.google.com/maps?q=${lat},${lng}`);
  };

  const handleClearHistory = () => {
    Alert.alert(
      'Clear History',
      'Are you sure you want to clear all location history?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await LocationService.clearLocationHistory();
            setLocationHistory([]);
          },
        },
      ]
    );
  };

  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';

  const tint = useThemeColor({}, 'tint');
  const cardBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';
  const dividerColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';

  const formatCoordinate = (value: number, precision: number = 6): string =>
    value.toFixed(precision);

  const formatAccuracy = (accuracy: number | null): string =>
    accuracy === null ? 'Unknown' : `±${accuracy.toFixed(1)}m`;

  if (hasPermission === null) {
    return (
      <ThemedView style={[localStyles.centeredState, style]}>
        <ActivityIndicator size="large" color={tint} />
        <ThemedText style={localStyles.stateLabel}>Checking location permissions…</ThemedText>
      </ThemedView>
    );
  }

  if (!hasPermission) {
    return (
      <ThemedView style={[localStyles.centeredState, style]}>
        <ThemedText style={localStyles.stateLabel}>Location access is required</ThemedText>
        <Pressable
          style={({ pressed }) => [AppStyles.primaryButton, { backgroundColor: tint, opacity: pressed ? 0.8 : 1 }]}
          onPress={checkPermissions}
        >
          <ThemedText style={AppStyles.primaryButtonText}>Grant Permission</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[localStyles.container, style]}>

      {/* ── Segment control ──────────────────────────────────────────── */}
      <View style={[AppStyles.segmentBar, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', marginHorizontal: 16, marginTop: 16 }]}>
        {(['tracking', 'history'] as ActiveTab[]).map((tab) => {
          const isActive = activeTab === tab;
          const label = tab === 'tracking'
            ? 'Location Guard'
            : `History${locationHistory.length > 0 ? ` (${locationHistory.length})` : ''}`;
          return (
            <Pressable
              key={tab}
              style={[
                AppStyles.segment,
                isActive && { backgroundColor: tint },
              ]}
              onPress={() => setActiveTab(tab)}
            >
              <ThemedText
                style={[
                  AppStyles.segmentText,
                  { color: isActive ? '#fff' : isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.45)' },
                ]}
              >
                {label}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>

      {/* ════════════════ LIVE TRACKING TAB ════════════════ */}
      {activeTab === 'tracking' && (
        <View style={localStyles.tabContent}>

          {/* Background service card */}
          <View style={[AppStyles.card, { backgroundColor: cardBg }]}>
            <View style={AppStyles.cardHeader}>
              <View style={AppStyles.cardTitleRow}>
                <View style={[AppStyles.statusDot, { backgroundColor: isBackgroundTracking ? '#22C55E' : isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)' }]} />
                <ThemedText style={AppStyles.sectionTitle}>Background Service</ThemedText>
              </View>
              <View style={[AppStyles.pill, { backgroundColor: isBackgroundTracking ? 'rgba(34,197,94,0.12)' : isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]}>
                <ThemedText style={[AppStyles.pillText, { color: isBackgroundTracking ? '#22C55E' : isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.35)' }]}>
                  {isBackgroundTracking ? 'Active' : 'Idle'}
                </ThemedText>
              </View>
            </View>
            <ThemedText style={AppStyles.cardSubtext}>
              {isBackgroundTracking
                ? `Sending your location to the server every ${INTERVAL_OPTIONS.find(o => o.value === bgInterval)?.label ?? '30 s'}`
                : 'Tap below to start tracking in the background'}
            </ThemedText>
            <IntervalPickerRow
              label="Update Interval"
              selected={bgInterval}
              onSelect={handleBgIntervalChange}
              tint={tint}
              isDark={isDark}
            />
            <Pressable
              style={({ pressed }) => [
                AppStyles.primaryButton,
                {
                  backgroundColor: isBackgroundTracking ? '#EF4444' : tint,
                  marginTop: 14,
                  opacity: pressed || bgLoading ? 0.75 : 1,
                },
              ]}
              onPress={handleToggleBackgroundService}
              disabled={bgLoading}
            >
              {bgLoading
                ? <ActivityIndicator color="#fff" size="small" />
                : <ThemedText style={AppStyles.primaryButtonText}>
                    {isBackgroundTracking ? 'Stop Location Guard' : 'Start Location Guard'}
                  </ThemedText>
              }
            </Pressable>
          </View>

          {/* Divider */}
          <View style={[AppStyles.divider, { backgroundColor: dividerColor, marginVertical: 2 }]} />

          {/* Foreground status chip */}
          <View style={localStyles.fgStatusRow}>
            <ThemedText style={localStyles.fgStatusLabel}>Foreground</ThemedText>
            <View style={[AppStyles.pill, { backgroundColor: isTracking ? 'rgba(34,197,94,0.12)' : 'rgba(234,179,8,0.12)' }]}>
              <ThemedText style={[AppStyles.pillText, { color: isTracking ? '#22C55E' : '#EAB308' }]}>
                {isTracking ? 'Tracking' : 'Stopped'}
              </ThemedText>
            </View>
          </View>

          {/* Coordinate card */}
          {currentLocation && (
            <View style={[AppStyles.card, { backgroundColor: cardBg, marginBottom: 12 }]}>
              <ThemedText style={[AppStyles.sectionTitle, { marginBottom: 4 }]}>Current Location</ThemedText>
              {[
                { label: 'Latitude', value: formatCoordinate(currentLocation.latitude) },
                { label: 'Longitude', value: formatCoordinate(currentLocation.longitude) },
                { label: 'Accuracy', value: formatAccuracy(currentLocation.accuracy) },
                ...(lastUpdateTime ? [{ label: 'Updated', value: lastUpdateTime }] : []),
              ].map(({ label, value }, i, arr) => (
                <View
                  key={label}
                  style={[
                    localStyles.coordRow,
                    i < arr.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: dividerColor },
                  ]}
                >
                  <ThemedText style={localStyles.coordLabel}>{label}</ThemedText>
                  <ThemedText style={[localStyles.coordValue, AppStyles.monoText]}>{value}</ThemedText>
                </View>
              ))}
            </View>
          )}

          <Pressable
            style={({ pressed }) => [AppStyles.ghostButton, { borderColor: tint, opacity: pressed ? 0.7 : 1 }]}
            onPress={handleGetCurrentLocation}
          >
            <ThemedText style={[AppStyles.ghostButtonText, { color: tint }]}>Get Current Location</ThemedText>
          </Pressable>
        </View>
      )}

      {/* ════════════════ HISTORY TAB ════════════════ */}
      {activeTab === 'history' && (
        <View style={localStyles.tabContent}>
          <View style={[AppStyles.spaceBetween, { marginBottom: 4 }]}>
            <ThemedText style={AppStyles.sectionTitle}>Location History</ThemedText>
            <View style={AppStyles.row}>
              <Pressable
                style={({ pressed }) => [AppStyles.iconButton, { borderColor: tint, opacity: pressed ? 0.7 : 1 }]}
                onPress={loadLocationHistory}
                disabled={historyLoading}
              >
                <ThemedText style={[AppStyles.iconButtonText, { color: tint }]}>↻  Refresh</ThemedText>
              </Pressable>
              {locationHistory.length > 0 && (
                <Pressable
                  style={({ pressed }) => [AppStyles.iconButton, { borderColor: '#EF4444', marginLeft: 8, opacity: pressed ? 0.7 : 1 }]}
                  onPress={handleClearHistory}
                >
                  <ThemedText style={[AppStyles.iconButtonText, { color: '#EF4444' }]}>Clear</ThemedText>
                </Pressable>
              )}
            </View>
          </View>

          {historyLoading && (
            <ActivityIndicator size="large" color={tint} style={{ marginVertical: 40 }} />
          )}

          {!historyLoading && locationHistory.length === 0 && (
            <View style={AppStyles.emptyState}>
              <ThemedText style={AppStyles.emptyStateTitle}>No history yet</ThemedText>
              <ThemedText style={AppStyles.emptyStateSubtext}>
                Start the background service to begin recording
              </ThemedText>
            </View>
          )}

          {!historyLoading && locationHistory.slice(0, 50).map((entry, index) => (
            <View
              key={index}
              style={[AppStyles.listRow, { borderBottomColor: dividerColor }]}
            >
              <View style={localStyles.historyRowLeft}>
                <ThemedText style={[localStyles.historyCoords, AppStyles.monoText]}>
                  {parseFloat(entry.latitude).toFixed(6)}, {parseFloat(entry.longitude).toFixed(6)}
                </ThemedText>
                <ThemedText style={[AppStyles.caption, AppStyles.monoText, { marginTop: 2 }]}>
                  {entry.insertionTimestamp}
                </ThemedText>
              </View>
              <View style={localStyles.historyRowRight}>
                <View style={[AppStyles.pill, { backgroundColor: entry.sentToApi ? 'rgba(34,197,94,0.12)' : 'rgba(234,179,8,0.12)' }]}>
                  <ThemedText style={[AppStyles.pillText, { color: entry.sentToApi ? '#22C55E' : '#EAB308' }]}>
                    {entry.sentToApi ? 'Synced' : 'Pending'}
                  </ThemedText>
                </View>
                <Pressable
                  style={({ pressed }) => [localStyles.mapsButton, { borderColor: tint, opacity: pressed ? 0.7 : 1 }]}
                  onPress={() => openInMaps(entry.latitude, entry.longitude)}
                >
                  <ThemedText style={[localStyles.mapsButtonText, { color: tint }]}>📍 Maps</ThemedText>
                </Pressable>
              </View>
            </View>
          ))}

          {!historyLoading && locationHistory.length > 50 && (
            <ThemedText style={[AppStyles.caption, { textAlign: 'center', marginTop: 8 }]}>
              Showing 50 of {locationHistory.length} entries
            </ThemedText>
          )}
        </View>
      )}
    </ThemedView>
  );
}

// Only tracker-specific rules that have no equivalent in AppStyles
const localStyles = StyleSheet.create({
  container: {
    borderRadius: 16,
    marginVertical: 10,
    overflow: 'hidden',
  },
  centeredState: {
    borderRadius: 16,
    marginVertical: 10,
    paddingVertical: 48,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 16,
  },
  stateLabel: {
    fontSize: 15,
    opacity: 0.6,
    textAlign: 'center',
  },
  tabContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: 12,
    gap: 12,
  },
  fgStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  fgStatusLabel: {
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.7,
  },
  coordRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  coordLabel: {
    fontSize: 14,
    fontWeight: '500',
    opacity: 0.55,
  },
  coordValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  historyRowLeft: {
    flex: 1,
    marginRight: 12,
  },
  historyCoords: {
    fontSize: 14,
    fontWeight: '600',
  },
  historyRowRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  mapsButton: {
    borderWidth: 1.5,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  mapsButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
