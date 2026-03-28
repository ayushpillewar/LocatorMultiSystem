/**
 * Debugging utilities for the Location Tracker app
 * Use these throughout your app for better debugging visibility
 */

// Enhanced console logging with prefixes and colors
export class DebugLogger {
  static info(component: string, message: string, data?: any) {
    console.log(`ℹ️ [${component}] ${message}`, data ? data : '');
  }
  
  static success(component: string, message: string, data?: any) {
    console.log(`✅ [${component}] ${message}`, data ? data : '');
  }
  
  static warning(component: string, message: string, data?: any) {
    console.warn(`⚠️ [${component}] ${message}`, data ? data : '');
  }
  
  static error(component: string, message: string, error?: any) {
    console.error(`❌ [${component}] ${message}`, error ? error : '');
  }
  
  static location(component: string, message: string, coords?: any) {
    console.log(`📍 [${component}] ${message}`, coords ? coords : '');
  }
  
  static auth(component: string, message: string, data?: any) {
    console.log(`🔐 [${component}] ${message}`, data ? data : '');
  }
  
  static network(component: string, message: string, data?: any) {
    console.log(`🌐 [${component}] ${message}`, data ? data : '');
  }
}

// Device information helper
export const getDeviceInfo = () => {
  const info = {
    platform: process.env.EXPO_OS,
    isDev: __DEV__,
    timestamp: new Date().toISOString()
  };
  DebugLogger.info('DeviceInfo', 'Device information', info);
  return info;
};

// Performance timing helper
export class PerfTracker {
  private static timers: Map<string, number> = new Map();
  
  static start(label: string) {
    this.timers.set(label, Date.now());
    DebugLogger.info('Performance', `Started timing: ${label}`);
  }
  
  static end(label: string) {
    const startTime = this.timers.get(label);
    if (startTime) {
      const duration = Date.now() - startTime;
      DebugLogger.info('Performance', `${label} took ${duration}ms`);
      this.timers.delete(label);
      return duration;
    }
    return null;
  }
}

// Error handler helper
export const handleAsyncError = (component: string, operation: string) => {
  return (error: any) => {
    DebugLogger.error(component, `Failed ${operation}`, {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
  };
};

// Location debugging helper
export const debugLocationChange = (component: string, location: any, previousLocation?: any) => {
  const locationInfo = {
    latitude: location.latitude,
    longitude: location.longitude,
    accuracy: location.accuracy,
    timestamp: new Date(location.timestamp).toLocaleString(),
    provider: location.provider
  };
  
  if (previousLocation) {
    const distance = calculateDistance(
      previousLocation.latitude, 
      previousLocation.longitude, 
      location.latitude, 
      location.longitude
    );
    locationInfo.distanceFromPrevious = `${distance.toFixed(2)}m`;
  }
  
  DebugLogger.location(component, 'Location update', locationInfo);
};

// Calculate distance between two coordinates (in meters)
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // Distance in meters
};