import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  timestamp: number;
}

const LOCATION_TRACKING = 'background-location-task';

// Define the background task for location tracking
TaskManager.defineTask(LOCATION_TRACKING, ({ data, error }) => {
  if (error) {
    console.error('Location task error:', error);
    return;
  }
  if (data) {
    const { locations } = data as any;
    console.log('Background location received:', locations);
    // Here you could store the location data or send it to a server
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
      // Request foreground permissions first
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      
      if (foregroundStatus !== 'granted') {
        console.log('Foreground location permission not granted');
        return false;
      }

      // Request background permissions for iOS (Android handles this differently)
      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
      
      if (backgroundStatus !== 'granted') {
        console.log('Background location permission not granted, but foreground is available');
        // Return true because we can still do foreground location tracking
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
    if (this.isTracking) {
      console.log('Location tracking is already active');
      return true;
    }

    try {
      this.onLocationUpdate = onLocationUpdate;

      // Start foreground location tracking
      this.locationSubscription = await Location.watchPositionAsync(
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

          this.currentLocation = locationData;
          console.log('Location updated:', locationData);
          
          if (this.onLocationUpdate) {
            this.onLocationUpdate(locationData);
          }
        }
      );

      // Try to start background location tracking
      try {
        const isRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TRACKING);
        if (!isRegistered) {
          await Location.startLocationUpdatesAsync(LOCATION_TRACKING, {
            accuracy: Location.Accuracy.High,
            timeInterval: 30000, // Update every 30 seconds in background
            distanceInterval: 50, // Update every 50 meters in background
            deferredUpdatesInterval: 60000, // Defer updates for 60 seconds
            foregroundService: {
              notificationTitle: 'Location Tracking',
              notificationBody: 'Tracking your location in the background',
              notificationColor: '#fff',
            },
          });
          console.log('Background location tracking started');
        }
      } catch (backgroundError) {
        console.log('Background location not available, continuing with foreground only:', backgroundError);
      }

      this.isTracking = true;
      return true;
    } catch (error) {
      console.error('Error starting location tracking:', error);
      return false;
    }
  }

  async stopTracking(): Promise<void> {
    if (!this.isTracking) {
      return;
    }

    try {
      // Stop foreground tracking
      if (this.locationSubscription) {
        this.locationSubscription.remove();
        this.locationSubscription = null;
      }

      // Stop background tracking
      const isRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TRACKING);
      if (isRegistered) {
        await Location.stopLocationUpdatesAsync(LOCATION_TRACKING);
        console.log('Background location tracking stopped');
      }
      console.log('service not registered');
    
      this.isTracking = false;
      this.onLocationUpdate = undefined;
      console.log('Location tracking stopped');
    } catch (error) {
      console.error('Error stopping location tracking:', error);
    }
  }

  getIsTracking(): boolean {
    return this.isTracking;
  }

  getCurrentLocationData(): LocationData | null {
    return this.currentLocation;
  }
}