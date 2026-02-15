import { StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { LocationTracker } from '@/components/LocationTracker';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <ThemedView style={styles.headerContainer}>
          <ThemedText type="title" style={styles.headerTitle}>
            📍 Location Tracker App
          </ThemedText>
          <ThemedText style={styles.headerSubtitle}>
            Track your current location and view real-time coordinates
          </ThemedText>
        </ThemedView>

        <LocationTracker style={styles.trackerContainer} />

        <ThemedView style={styles.infoContainer}>
          <ThemedText type="subtitle" style={styles.infoTitle}>
            ℹ️ How to use:
          </ThemedText>
          <ThemedText style={styles.infoText}>
            1. Tap "Get Current Location" to get your current position
          </ThemedText>
          <ThemedText style={styles.infoText}>
            2. Tap "Start Tracking" to continuously track your location
          </ThemedText>
          <ThemedText style={styles.infoText}>
            3. The app will update your coordinates every 10 seconds
          </ThemedText>
          <ThemedText style={styles.infoText}>
            4. Location tracking works while the app is active/foreground
          </ThemedText>
        </ThemedView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 50,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 20,
  },
  headerTitle: {
    textAlign: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    textAlign: 'center',
    opacity: 0.7,
    fontSize: 16,
  },
  trackerContainer: {
    marginBottom: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  infoContainer: {
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 12,
  },
  infoTitle: {
    marginBottom: 12,
  },
  infoText: {
    marginBottom: 6,
    lineHeight: 20,
    opacity: 0.8,
  },
});
