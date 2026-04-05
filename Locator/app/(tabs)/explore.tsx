import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { Collapsible } from '@/components/ui/collapsible';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { AppStyles } from '@/constants/appStyles';
import { Fonts } from '@/constants/theme';
import { STORAGE_KEYS } from '@/services/LocationService';
import { LocationApiService } from '@/services/LocationApiService';
import { User } from '@/dto/models';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppleSubscribeButton } from '@/services/AppleSubscriptionService';

type SubStatus = 'loading' | 'active' | 'expired' | 'unavailable';

function daysRemaining(endDate: string): number {
  const end = new Date(endDate).getTime();
  const now = Date.now();
  return Math.max(0, Math.ceil((end - now) / 86_400_000));
}

function formatDate(raw: string): string {
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

const HELP_ITEMS: { title: string; body: string }[] = [
  {
    title: 'How does background tracking work?',
    body: 'Once started, the background service runs even when the app is closed. It wakes up at your chosen interval, captures your GPS coordinates, and sends them to the server automatically.',
  },
  {
    title: 'How do I change the update interval?',
    body: 'Open the Home tab, find the Background Service card, and tap one of the interval buttons (10 s, 30 s, 1 min, 5 min). If the service is already running you will be prompted to restart it to apply the change.',
  },
  {
    title: 'What is Location History?',
    body: 'Every update sent by the background service is stored locally on your device (up to 500 entries). Switch to the History tab on the Home screen to browse them. Each entry shows coordinates, timestamp, and whether it was successfully synced to the server.',
  },
  {
    title: 'Why does the app need background location permission?',
    body: 'Without background permission the service cannot collect your location while the app is not in the foreground. You can grant it in Settings → Privacy → Location Services → Locator → Always.',
  },
  {
    title: 'Is my location data private?',
    body: 'Your location is sent only to the Locator server and is associated with your account. It is not shared with third parties. You can clear local history at any time from the History tab.',
  },
  {
    title: 'What happens if I lose internet connection?',
    body: 'The background service will still record your location locally and mark those entries as "Pending". They will not be retried automatically — start the service again once you are back online to resume syncing.',
  },
];

export default function ExploreScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';
  const tint = useThemeColor({}, 'tint');
  const cardBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';
  const dividerColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';

  const [user, setUser] = useState<User | null>(null);
  const [subStatus, setSubStatus] = useState<SubStatus>('loading');
  const [refreshing, setRefreshing] = useState(false);

  const loadSubscription = useCallback(async () => {
    try {
      const [token, userId] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.JWT_TOKEN),
        AsyncStorage.getItem(STORAGE_KEYS.USER_ID),
      ]);

      if (!userId) {
        setSubStatus('unavailable');
        return;
      }

      const data = await LocationApiService.getInstance().checkSubscription(userId, token ?? undefined);
      if (!data) {
        setSubStatus('unavailable');
        return;
      }

      setUser(data);
      const expired = new Date(data.subEndDate).getTime() < Date.now();
      setSubStatus(expired ? 'expired' : 'active');
    } catch {
      setSubStatus('unavailable');
    }
  }, []);

  useEffect(() => {
    loadSubscription();
  }, [loadSubscription]);

  const onRefresh = async () => {
    setRefreshing(true);
    setSubStatus('loading');
    await loadSubscription();
    setRefreshing(false);
  };

  const statusColor =
    subStatus === 'active' ? '#22C55E' :
    subStatus === 'expired' ? '#EF4444' : '#EAB308';

  const statusLabel =
    subStatus === 'loading' ? 'Checking…' :
    subStatus === 'active' ? 'Active' :
    subStatus === 'expired' ? 'Expired' : 'Unavailable';



  return (
    <ThemedView style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={tint} />}
      >
        {/* ── Header ─────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <ThemedText style={[styles.title, { fontFamily: Fonts.rounded }]}>Account & Help</ThemedText>
          <ThemedText style={AppStyles.cardSubtext}>Pull to refresh subscription info</ThemedText>
        </View>

        {/* ── Subscription card ───────────────────────────────────────── */}
        <View style={[AppStyles.card, { backgroundColor: cardBg, marginHorizontal: 16 }]}>
          <View style={AppStyles.cardHeader}>
            <View style={AppStyles.cardTitleRow}>
              <View style={[AppStyles.statusDot, { backgroundColor: subStatus === 'loading' ? (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)') : statusColor }]} />
              <ThemedText style={AppStyles.sectionTitle}>Subscription</ThemedText>
            </View>
            {subStatus !== 'loading' && (
              <View style={[AppStyles.pill, { backgroundColor: statusColor + '22' }]}>
                <ThemedText style={[AppStyles.pillText, { color: statusColor }]}>{statusLabel}</ThemedText>
              </View>
            )}
          </View>

          {subStatus === 'loading' && (
            <ActivityIndicator color={tint} style={{ marginVertical: 16 }} />
          )}

          {subStatus === 'unavailable' && (
            <ThemedText style={[AppStyles.cardSubtext, { marginTop: 8 }]}>
              Could not load subscription details. Make sure you are signed in and connected to the internet.
            </ThemedText>
          )}

          {user && subStatus !== 'loading' && (
            <View style={{ marginTop: 10, gap: 0 }}>
              {[
                { label: 'Email', value: user.email },
                { label: 'Started', value: formatDate(user.subStartDate) },
                { label: 'Expires', value: formatDate(user.subEndDate) },
                ...(subStatus === 'active'
                  ? [{ label: 'Days left', value: String(daysRemaining(user.subEndDate)) }]
                  : []),
              ].map(({ label, value }, i, arr) => (
                <View
                  key={label}
                  style={[
                    styles.infoRow,
                    i < arr.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: dividerColor },
                  ]}
                >
                  <ThemedText style={styles.infoLabel}>{label}</ThemedText>
                  <ThemedText style={styles.infoValue}>{value}</ThemedText>
                </View>
              ))}
            </View>
          )}

          {subStatus !== 'loading' && (
            <Pressable
              style={({ pressed }) => [AppStyles.ghostButton, { borderColor: tint, marginTop: 14, opacity: pressed ? 0.7 : 1 }]}
              onPress={onRefresh}
            >
              <ThemedText style={[AppStyles.linkButton, { color: tint }]}>↻  Refresh</ThemedText>
            </Pressable>
          )}
          {subStatus === 'expired' && <AppleSubscribeButton />}
        </View>

        {/* ── Help section ────────────────────────────────────────────── */}
        <View style={styles.section}>
          <ThemedText style={[AppStyles.sectionTitle, { marginBottom: 8, paddingHorizontal: 16 }]}>Help & FAQ</ThemedText>
          <View style={[AppStyles.card, { backgroundColor: cardBg, marginHorizontal: 16, padding: 4 }]}>
            {HELP_ITEMS.map((item, i) => (
              <View
                key={item.title}
                style={i < HELP_ITEMS.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: dividerColor }}
              >
                <Collapsible title={item.title}>
                  <ThemedText style={[AppStyles.cardSubtext, { lineHeight: 20, opacity: 0.75 }]}>
                    {item.body}
                  </ThemedText>
                </Collapsible>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scroll: {
    paddingTop: 64,
    paddingBottom: 40,
    gap: 20,
  },
  header: {
    paddingHorizontal: 16,
    gap: 4,
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  section: {
    gap: 0,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    opacity: 0.55,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
  },
});

