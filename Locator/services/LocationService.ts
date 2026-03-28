import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LocationApiService } from './LocationApiService';
import { Location as LocationModel } from '../dto/models';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  timestamp: number;
}

export interface LocationHistoryEntry {
  userId: string;
  insertionTimestamp: string;
  latitude: string;
  longitude: string;
  userEmail: string;
  sentToApi: boolean;
}

export const STORAGE_KEYS = {
  JWT_TOKEN: '@locator/jwt_token',
  USER_ID: '@locator/user_id',
  USER_EMAIL: '@locator/user_email',
  USER_NAME: '@locator/user_name',
  LOCATION_HISTORY: '@locator/location_history',
};

const LOCATION_TRACKING = 'background-location-task';
const MAX_HISTORY_ENTRIES = 500;

function formatTimestamp(timestamp: number): string {
  const ts = new Date(timestamp);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${ts.getFullYear()}-${pad(ts.getMonth() + 1)}-${pad(ts.getDate())} ${pad(ts.getHours())}:${pad(ts.getMinutes())}:${pad(ts.getSeconds())}`;
}

async function saveLocationToHistory(entry: LocationHistoryEntry): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.LOCATION_HISTORY);
    const history: LocationHistoryEntry[] = raw ? JSON.parse(raw) : [];
    history.unshift(entry); // newest first
    if (history.length > MAX_HISTORY_ENTRIES) {
      history.splice(MAX_HISTORY_ENTRIES);
    }
    await AsyncStorage.setItem(STORAGE_KEYS.LOCATION_HISTORY, JSON.stringify(history));
  } catch (err) {
    console.error('[LocationService] Error saving location history:', err);
  }
}

// Define the background task — must be registered at module load time
TaskManager.defineTask(LOCATION_TRACKING, async ({ data, error }: any) => {
  if (error) {
    console.error('[BG Task] Location task error:', error);
    return;
  }
  if (!data) return;

  const { locations } = data as { locations: Location.LocationObject[] };
  try {
    const [token, userId, userEmail, userName] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEYS.JWT_TOKEN),
      AsyncStorage.getItem(STORAGE_KEYS.USER_ID),
      AsyncStorage.getItem(STORAGE_KEYS.USER_EMAIL),
      AsyncStorage.getItem(STORAGE_KEYS.USER_NAME),
    ]);

    for (const location of locations) {
      const insertionTimestamp = formatTimestamp(location.timestamp);

      let sentToApi = false;
      try {
        const locationModel = new LocationModel(
          location.coords.latitude,
          location.coords.longitude,
          insertionTimestamp,
          userName ?? userEmail ?? '',
          userId ?? '',
        );
        await LocationApiService.getInstance().sendLocation(locationModel, token ?? undefined);
        sentToApi = true;
      } catch (fetchErr) {
        console.error('[BG Task] Failed to POST location:', fetchErr);
      }

      await saveLocationToHistory({
        userId: userId ?? '',
        insertionTimestamp,
        latitude: String(location.coords.latitude),
        longitude: String(location.coords.longitude),
        userEmail: userEmail ?? '',
        sentToApi,
      });
    }
  } catch (err) {
    console.error('[BG Task] Processing error:', err);
  }
});

export class LocationService {
  private static instance: LocationService;
  private isTracking: boolean = false;
  private currentLocation: LocationData | null = null;
  private locationSubscription: Location.LocationSubscription | null = null;
  private onLocationUpdate?: (location: LocationData) => void;

  private constructor() {}

  public static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  async requestPermissions(): Promise<boolean> {
    try {
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      if (foregroundStatus !== 'granted') {
        console.log('Foreground location permission not granted');
        return false;
      }
      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
      if (backgroundStatus !== 'granted') {
        console.log('Background location permission not granted, foreground only.');
        return true;
      }
      return true;
    } catch (error) {
      console.error('Error requesting location permissions:', error);
      return false;
    }
  }

  async getCurrentLocation(): Promise<LocationData | null> {
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
      this.currentLocation = locationData;
      return locationData;
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  }

  async startTracking(onLocationUpdate?: (location: LocationData) => void): Promise<boolean> {
    if (this.isTracking) return true;
    try {
      this.onLocationUpdate = onLocationUpdate;
      this.locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 10000,
          distanceInterval: 10,
        },
        (location) => {
          const locationData: LocationData = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy,
            timestamp: location.timestamp,
          };
          this.currentLocation = locationData;
          this.onLocationUpdate?.(locationData);
        }
      );
      this.isTracking = true;
      return true;
    } catch (error) {
      console.error('Error starting location tracking:', error);
      return false;
    }
  }

  async stopTracking(): Promise<void> {
    if (!this.isTracking) return;
    try {
      this.locationSubscription?.remove();
      this.locationSubscription = null;
      this.isTracking = false;
      this.onLocationUpdate = undefined;
    } catch (error) {
      console.error('Error stopping location tracking:', error);
    }
  }

  // ─── Background service (API-backed) ───────────────────────────────────────

  async startBackgroundTracking(): Promise<boolean> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return false;

      const isRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TRACKING);
      if (isRegistered) return true;

      await Location.startLocationUpdatesAsync(LOCATION_TRACKING, {
        accuracy: Location.Accuracy.High,
        timeInterval: 30000,       // every 30 s
        distanceInterval: 50,      // or every 50 m
        deferredUpdatesInterval: 60000,
        foregroundService: {
          notificationTitle: 'Locator Running',
          notificationBody: 'Sending your location to the server',
          notificationColor: '#4CAF50',
        },
        showsBackgroundLocationIndicator: true,
        pausesUpdatesAutomatically: false,
      });
      console.log('[LocationService] Background tracking started');
      return true;
    } catch (error) {
      console.error('[LocationService] Error starting background tracking:', error);
      return false;
    }
  }

  async stopBackgroundTracking(): Promise<void> {
    try {
      const isRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TRACKING);
      if (isRegistered) {
        await Location.stopLocationUpdatesAsync(LOCATION_TRACKING);
        console.log('[LocationService] Background tracking stopped');
      }
    } catch (error) {
      console.error('[LocationService] Error stopping background tracking:', error);
    }
  }

  async isBackgroundTrackingActive(): Promise<boolean> {
    try {
      return await TaskManager.isTaskRegisteredAsync(LOCATION_TRACKING);
    } catch {
      return false;
    }
  }

  // ─── History helpers ────────────────────────────────────────────────────────

  static async getLocationHistory(): Promise<LocationHistoryEntry[]> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.LOCATION_HISTORY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  static async clearLocationHistory(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.LOCATION_HISTORY);
    } catch (err) {
      console.error('[LocationService] Error clearing history:', err);
    }
  }

  static async getApiLocationHistory(): Promise<LocationModel[]> {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.JWT_TOKEN);
      return await LocationApiService.getInstance().getLocationHistory(token ?? undefined);
    } catch (err) {
      console.error('[LocationService] Error fetching API location history:', err);
      return [];
    }
  }

  // ─── Accessors ──────────────────────────────────────────────────────────────

  getIsTracking(): boolean {
    return this.isTracking;
  }

  getCurrentLocationData(): LocationData | null {
    return this.currentLocation;
  }
}