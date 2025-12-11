import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { memo, useMemo } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useUser } from "@/contexts/user-context";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useApprovedPhotoSubmissions } from "@/hooks/use-quests";

type RankedTeam = {
  position: number;
  name: string;
  points: string;
  trend: string;
  color: string;
  isUserTeam: boolean;
};

export default function TeamsScreen() {
  const { userData } = useUser();
  const { data: submissions, isLoading } = useApprovedPhotoSubmissions();

  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? "light";

  const cardSurface = useThemeColor(
    { light: "#FFFFFF", dark: "rgba(255,255,255,0.05)" },
    "background",
  );
  const highlight = useThemeColor({}, "tint");
  const accent = useThemeColor({}, "accent");
  const subtleText = colorScheme === "dark" ? "#D7CEFF" : "#6F5FA5";
  const background = useThemeColor(
    { light: "#F4F3FA", dark: "#14101F" },
    "background",
  );

  // -----------------------------
  // BUILD TEAMS FROM SUBMISSIONS
  // -----------------------------
  const teams = useMemo(() => {
    const map = new Map<
      string,
      { name: string; key: string; points: number }
    >();

    for (const sub of submissions) {
      if (!map.has(sub.teamKey)) {
        map.set(sub.teamKey, {
          key: sub.teamKey,
          name: sub.teamName,
          points: 0,
        });
      }
      map.get(sub.teamKey)!.points += sub.points;
    }

    return Array.from(map.values());
  }, [submissions]);

  // -----------------------------
  // RANK
  // -----------------------------
  const rankedTeams = useMemo(() => {
    const sorted = [...teams].sort((a, b) => b.points - a.points);

    return sorted.map((t, i) => ({
      position: i + 1,
      name: t.name,
      points: t.points.toLocaleString(),
      trend: "",
      color: t.key,
      isUserTeam: userData?.teamKey == t.key,
    }));
  }, [teams, userData]);

  const containerStyle = useMemo(
    () => [
      styles.container,
      {
        paddingTop: insets.top + 12,
        paddingBottom: insets.bottom + 24,
      },
    ],
    [insets.bottom, insets.top],
  );

  return (
    <ThemedView style={[styles.root, { backgroundColor: background }]}>
      <ScrollView
        contentContainerStyle={containerStyle}
        showsVerticalScrollIndicator={false}
      >
        <ThemedView
          style={[styles.summaryCard, { backgroundColor: cardSurface }]}
        >
          <View style={styles.summaryHeader}>
            <MaterialIcons name="emoji-events" size={28} color={highlight} />
            <ThemedText
              type="title"
              style={[styles.summaryTitle, { textAlign: "center" }]}
            >
              Team Standings
            </ThemedText>
            <MaterialIcons name="emoji-events" size={28} color={highlight} />
          </View>

          <ThemedText
            style={[
              styles.summarySubtitle,
              { color: subtleText },
              { textAlign: "center" },
            ]}
          >
            Check out the points earned in the team standings below!
          </ThemedText>
        </ThemedView>

        <ThemedView
          style={[styles.rankingCard, { backgroundColor: cardSurface }]}
        >
          {rankedTeams.map((team) => (
            <TeamRow
              key={team.position}
              team={team}
              subtleColor={subtleText}
              leaderColor={highlight}
              yourHighlight="transparent"
              yourAccent={accent}
            />
          ))}
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}

const TeamRow = memo(function TeamRow({
  team,
  subtleColor,
  leaderColor,
  yourHighlight,
  yourAccent,
}: {
  team: RankedTeam;
  subtleColor: string;
  leaderColor: string;
  yourHighlight: string;
  yourAccent: string;
}) {
  const isLeader = team.position === 1;
  const trendColor = team.isUserTeam
    ? yourAccent
    : isLeader
      ? leaderColor
      : subtleColor;

  return (
    <View
      style={[
        styles.teamRow,
        team.isUserTeam && { backgroundColor: yourHighlight },
      ]}
    >
      <View style={styles.teamLeft}>
        <View style={[styles.teamBadge, { backgroundColor: team.color }]} />
        <View>
          <ThemedText type="defaultSemiBold" style={styles.teamName}>
            #{team.position} {team.name}
          </ThemedText>
          <ThemedText style={[styles.teamTrend, { color: trendColor }]}>
            {team.isUserTeam ? "You" : team.trend}
          </ThemedText>
        </View>
      </View>
      <View style={styles.teamRight}>
        <ThemedText type="defaultSemiBold" style={styles.teamPoints}>
          {team.points}
        </ThemedText>
        {isLeader && (
          <View style={[styles.leaderChip, { backgroundColor: leaderColor }]}>
            <ThemedText
              lightColor="#FFFFFF"
              darkColor="#FFFFFF"
              style={styles.leaderText}
            >
              Leading
            </ThemedText>
          </View>
        )}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    paddingHorizontal: 24,
    gap: 24,
  },
  summaryCard: {
    borderRadius: 24,
    padding: 24,
    gap: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 4,
  },
  summaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  summaryTitle: {
    fontSize: 24,
    fontWeight: "800",
  },
  summarySubtitle: {
    fontSize: 16,
    lineHeight: 24,
  },
  metricRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  metricItem: {
    gap: 6,
    flexShrink: 1,
    flexBasis: "45%",
  },
  metricValue: {
    fontSize: 20,
  },
  metricLabel: {
    fontSize: 13,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  rankingCard: {
    borderRadius: 24,
    padding: 16,
    gap: 8,
  },
  teamRow: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  teamLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  teamBadge: {
    width: 16,
    height: 16,
    borderRadius: 16,
  },
  teamName: {
    fontSize: 17,
  },
  teamTrend: {
    fontSize: 13,
    marginTop: 2,
  },
  teamRight: {
    alignItems: "flex-end",
    gap: 6,
  },
  teamPoints: {
    fontSize: 18,
  },
  leaderChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  leaderText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
});
