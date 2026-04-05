import { StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LocationTracker } from '@/components/LocationTracker';
import UserProfile from '@/components/UserProfile';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <UserProfile />
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <LocationTracker style={styles.trackerContainer} />
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
