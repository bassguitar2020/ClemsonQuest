import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useUser } from '@/contexts/user-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Link, useLocalSearchParams } from 'expo-router';

export default function HomeScreen() {
  const { name, firstName: profileFirstName, teams, userData } = useUser();
  const colorScheme = useColorScheme() ?? 'light';
  const firstName = profileFirstName || (name ? name.split(' ')[0] : 'Explorer');
  const insets = useSafeAreaInsets();

  const { status } = useLocalSearchParams();

  const highlight = useThemeColor({}, 'tint');
  const accent = useThemeColor({}, 'accent');
  const surface = useThemeColor({ light: '#FFFFFF', dark: 'rgba(255,255,255,0.05)' }, 'background');
  const elevatedSurface = useThemeColor(
    { light: '#F6F2FF', dark: 'rgba(255,255,255,0.08)' },
    'background'
  );
  const badgeSurface = useThemeColor(
    { light: 'rgba(82,45,128,0.12)', dark: 'rgba(245,102,0,0.22)' },
    'accent'
  );
  const streakSurface = useThemeColor(
    { light: 'rgba(245,102,0,0.16)', dark: 'rgba(245,102,0,0.28)' },
    'tint'
  );
  const subtleText = colorScheme === 'dark' ? '#D7CEFF' : '#6F5FA5';
  const metaIconColor = colorScheme === 'dark' ? '#BFB5F5' : '#9E9E9E';

  const containerStyle = styles.container;
  const scrollContentStyle = useMemo(
    () => [
      styles.scrollContent,
      {
        paddingTop: insets.top + 16,
        paddingBottom: insets.bottom + 32,
      },
    ],
    [insets.bottom, insets.top]
  );
  const cardStyle = useMemo(() => [styles.card, { backgroundColor: surface }], [surface]);
  const elevatedCardStyle = useMemo(
    () => [styles.card, styles.elevatedCard, { backgroundColor: elevatedSurface }],
    [elevatedSurface]
  );

  const userTeam = useMemo(() => {
    if (!teams.length) return undefined;
    if (userData?.team) {
      return teams.find((team) => team.name === userData.team) ?? teams[0];
    }
    return teams[0];
  }, [teams, userData?.team]);

  const TITLE = `${name} took a photo of someone wearing Clemson Orange`;

  const isComplete = userTeam?.activity.some((a) => a.title === TITLE) ?? false;

  return (
    <>
    <ThemedView style={containerStyle}>
      <ScrollView
        contentContainerStyle={scrollContentStyle}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.headerCard}>
          <View style={styles.headerTextGroup}>
            <ThemedText type="title" style={styles.appTitle}>
              ClemsonQuest
            </ThemedText>
          </View>
            {userTeam && (
              <View style={styles.teamInfo}>
                <View style={[styles.teamChip, { borderColor: userTeam.color }]}>
                  <View style={[styles.teamDot, { backgroundColor: userTeam.color }]} />
                  <ThemedText type="defaultSemiBold">{userTeam.name}</ThemedText>
                </View>
                <ThemedText style={[styles.teamRank, { color: subtleText }]}>
                  Rank #{teams.indexOf(userTeam) + 1}
                </ThemedText>
              </View>
            )}
        </View>

        <View style={[styles.streakCard, { backgroundColor: streakSurface }]}>
          <View style={styles.streakIcon}>
            <MaterialIcons name="whatshot" size={28} color={highlight} />
          </View>
          <View style={styles.streakInfo}>
            <ThemedText type="defaultSemiBold" style={styles.streakTitle}>
              7 Day Streak!
            </ThemedText>
            <ThemedText style={[styles.subtitle, { color: subtleText }]}>
              Keep it up, {firstName}! Daily log-ins earn bonus points.
            </ThemedText>
          </View>
        </View>


        {!isComplete && <View style={elevatedCardStyle}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionTitleChip, { backgroundColor: badgeSurface }]}>
              <MaterialIcons name="bolt" size={18} color={accent} />
              <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                Active Quest
              </ThemedText>
            </View>
            <View style={[styles.difficultyPill, { backgroundColor: highlight }]}>
              <ThemedText style={styles.difficultyText} lightColor="#FFFFFF" darkColor="#FFFFFF">
                Easy
              </ThemedText>
            </View>
          </View>
          <ThemedText type="defaultSemiBold" style={styles.cardHeadline}>
            Take a picture with someone wearing Clemson orange.
          </ThemedText>
          <View style={styles.questMetaRow}>
            <MetaItem icon="star" label="150 pts" color={metaIconColor} />
            <MetaItem icon="schedule" label="1h 20m left" color={metaIconColor} />
          </View>
          <Link href="/scan" style={[styles.ctaButton, styles.ctaButtonLarge, { backgroundColor: accent }]}>
            <ThemedText style={styles.ctaText} lightColor="#FFFFFF" darkColor="#FFFFFF">
              Start
            </ThemedText>
          </Link>
        </View>}

        <View style={cardStyle}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionTitleChip, { backgroundColor: badgeSurface }]}>
              <MaterialIcons name="history" size={18} color={accent} />
              <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                Recent Activity
              </ThemedText>
            </View>
          </View>
          <View style={styles.activityList}>
            {teams.flatMap(team => team.activity).map((item, index) => (
              <View key={`${item.title}-${index}`} style={styles.activityRow}>
                <ThemedText style={styles.activityText}>{item.title}</ThemedText>
                <ThemedText style={[styles.activityTime, { color: subtleText }]}>
                  {item.timeAgo}
                </ThemedText>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </ThemedView>
    </>
  );
}

function MetaItem({
  icon,
  label,
  color,
}: {
  icon: keyof typeof ICON_MAP;
  label: string;
  color: string;
}) {
  return (
    <View style={styles.metaItem}>
      <MaterialIcons name={ICON_MAP[icon]} size={16} color={color} />
      <ThemedText style={[styles.metaLabel, { color }]}>{label}</ThemedText>
    </View>
  );
}

const ICON_MAP = {
  star: 'star',
  schedule: 'schedule',
} as const;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    gap: 24,
  },
  headerCard: {
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
    backgroundColor: 'transparent',
  },
  headerTextGroup: {
    gap: 4,
    alignItems: 'flex-start',
  },
  appTitle: {
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
  },
  teamInfo: {
    alignItems: 'flex-end',
    gap: 6,
  },
  teamChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  teamDot: {
    width: 12,
    height: 12,
    borderRadius: 30,
  },
  teamRank: {
    fontSize: 13,
  },
  streakCard: {
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  streakIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  streakInfo: {
    flex: 1,
    gap: 6,
  },
  streakTitle: {
    fontSize: 18,
  },
  card: {
    borderRadius: 20,
    padding: 20,
    gap: 16,
  },
  elevatedCard: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  sectionTitle: {
    fontSize: 14,
  },
  difficultyPill: {
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  cardHeadline: {
    fontSize: 17,
    lineHeight: 24,
  },
  questMetaRow: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaLabel: {
    fontSize: 14,
  },
  ctaButton: {
    width: '100%',
    borderRadius: 20,
    paddingHorizontal: 28,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  viewAll: {
    fontSize: 14,
  },
  activityList: {
    gap: 14,
  },
  activityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  activityText: {
    flex: 1,
    fontSize: 15,
  },
  activityTime: {
    fontSize: 12,
  },
});
