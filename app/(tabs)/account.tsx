import { Image } from 'expo-image';
import { useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useUser } from '@/contexts/user-context';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function AccountScreen() {
  const { name, email, isLoading, logout } = useUser();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [isSigningOut, setSigningOut] = useState(false);

  const cardSurface = useThemeColor(
    { light: '#FFFFFF', dark: 'rgba(255,255,255,0.05)' },
    'background'
  );
  const accent = useThemeColor({}, 'accent');
  const highlight = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');
  const dividerColor = useThemeColor(
    { light: 'rgba(19,6,41,0.08)', dark: 'rgba(255,255,255,0.12)' },
    'accent'
  );

  const containerStyle = useMemo(
    () => [
      styles.container,
      {
        paddingTop: insets.top + 24,
        paddingBottom: insets.bottom + 24,
      },
    ],
    [insets.bottom, insets.top]
  );

  if (isLoading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={highlight} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={containerStyle}>
      <View style={styles.header}>
        <Image
          source={require('@/assets/images/clemsonLogo.png')}
          style={styles.logo}
          contentFit="contain"
        />
        <View>
          <ThemedText type="title" style={styles.title}>
            Your Account
          </ThemedText>
          <ThemedText style={styles.subtitle}>Manage your ClemsonQuest profile</ThemedText>
        </View>
      </View>

      <ThemedView style={[styles.card, { backgroundColor: cardSurface }]}>
        <ThemedText type="subtitle" style={[styles.cardTitle, { color: highlight }]}>
          Profile
        </ThemedText>
        <View style={styles.detailRow}>
          <ThemedText type="defaultSemiBold" style={styles.detailLabel}>
            Name
          </ThemedText>
          <ThemedText style={styles.detailValue}>{name}</ThemedText>
        </View>
        <View style={[styles.separator, { backgroundColor: dividerColor }]} />
        <View style={styles.detailRow}>
          <ThemedText type="defaultSemiBold" style={styles.detailLabel}>
            Email
          </ThemedText>
          <ThemedText style={styles.detailValue}>{email || 'Not set'}</ThemedText>
        </View>
      </ThemedView>

      <ThemedView style={[styles.card, { backgroundColor: cardSurface }]}>
        <ThemedText type="subtitle" style={[styles.cardTitle, { color: accent }]}>
          Status
        </ThemedText>
        <ThemedText style={styles.statusText}>
          You are signed in and ready to complete quests. Logging out will clear your saved info on
          this device.
        </ThemedText>
        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: highlight }]}
          disabled={isSigningOut}
          activeOpacity={0.85}
          onPress={async () => {
            if (isSigningOut) return;
            setSigningOut(true);
            try {
              await logout();
              router.replace('/');
            } finally {
              setSigningOut(false);
            }
          }}
        >
          <ThemedText style={styles.logoutText} lightColor="#FFFFFF" darkColor="#FFFFFF">
            {isSigningOut ? 'Logging out...' : 'Log Out'}
          </ThemedText>
        </TouchableOpacity>
      </ThemedView>

      <View style={styles.footer}>
        <ThemedText style={[styles.footerText, { color: textColor }]}>
          Need to update your info? Log out and sign back in with your preferred name or email.
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    gap: 24,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 15,
    marginTop: 4,
  },
  card: {
    borderRadius: 24,
    padding: 20,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  detailLabel: {
    fontSize: 16,
  },
  detailValue: {
    fontSize: 16,
    flexShrink: 1,
    textAlign: 'right',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
  },
  statusText: {
    fontSize: 15,
    lineHeight: 22,
  },
  logoutButton: {
    marginTop: 8,
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    marginTop: 'auto',
  },
  footerText: {
    fontSize: 13,
    lineHeight: 20,
    opacity: 0.7,
  },
});
