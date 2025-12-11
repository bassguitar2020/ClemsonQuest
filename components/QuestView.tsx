import { useThemeColor } from "@/hooks/use-theme-color";
import { useMemo } from "react";
import { StyleSheet, useColorScheme } from "react-native";
import { View, Text } from "react-native";
import { ThemedText } from "./themed-text";
import { MaterialIcons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { timeRemaining } from "@/util/timeRemaining";
import { Quest } from "@/types/Quest";

export function QuestView({ quest }: { quest: Quest }) {
  const colorScheme = useColorScheme() ?? "light";
  const highlight = useThemeColor({}, "tint");
  const subtle = useThemeColor({ light: "#6F5FA5", dark: "#D7CEFF" }, "accent");
  const accent = useThemeColor({}, "accent");
  const badgeSurface = useThemeColor(
    { light: "rgba(82,45,128,0.12)", dark: "rgba(245,102,0,0.22)" },
    "accent",
  );
  const elevatedSurface = useThemeColor(
    { light: "#F6F2FF", dark: "rgba(255,255,255,0.08)" },
    "background",
  );
  const elevatedCardStyle = useMemo(
    () => [
      styles.card,
      styles.elevatedCard,
      { backgroundColor: elevatedSurface },
    ],
    [elevatedSurface],
  );
  const metaIconColor = colorScheme === "dark" ? "#BFB5F5" : "#9E9E9E";

  return (
    <View style={elevatedCardStyle}>
      <View style={styles.sectionHeader}>
        <View
          style={[styles.sectionTitleChip, { backgroundColor: badgeSurface }]}
        >
          <MaterialIcons name="bolt" size={18} color={accent} />
          <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
            Active Quest
          </ThemedText>
        </View>
        <View style={[styles.difficultyPill, { backgroundColor: highlight }]}>
          <ThemedText
            style={styles.difficultyText}
            lightColor="#FFFFFF"
            darkColor="#FFFFFF"
          >
            {quest.difficulty}
          </ThemedText>
        </View>
      </View>
      <ThemedText type="defaultSemiBold" style={styles.cardHeadline}>
        {quest.title}
      </ThemedText>
      <View style={styles.questMetaRow}>
        <MetaItem
          icon="star"
          label={`${quest.points} points`}
          color={metaIconColor}
        />
        <MetaItem
          icon="schedule"
          label={timeRemaining(quest.expiresAt)}
          color={metaIconColor}
        />
      </View>
      <Link
        href={{ pathname: "/scan/[id]", params: { id: quest.id } }}
        style={[
          styles.ctaButton,
          styles.ctaButtonLarge,
          { backgroundColor: accent },
        ]}
      >
        <ThemedText
          style={styles.ctaText}
          lightColor="#FFFFFF"
          darkColor="#FFFFFF"
        >
          Start
        </ThemedText>
      </Link>
    </View>

    // <View key={q.id} style={styles.questRow}>
    //     <View style={{ flex: 1, gap: 4 }}>
    //         <ThemedText type="defaultSemiBold">{q.title}</ThemedText>
    //         <ThemedText style={styles.questDescription}>{q.description}</ThemedText>
    //         <View style={styles.metaRow}>
    //             <ThemedText style={[styles.metaText, { color: highlight }]}>
    //                 {q.points} pts
    //             </ThemedText>
    //             <ThemedText style={[styles.metaText, { color: subtle }]}>
    //                 {timeRemaining(q.expiresAt)}
    //             </ThemedText>
    //         </View>
    //     </View>
    //     {/* Placeholder "Start" button – could navigate to /scan or open submission UI */}
    //     <TouchableOpacity style={[styles.smallButton, { borderColor: highlight }]}>
    //         <ThemedText style={{ color: highlight }}>Start</ThemedText>
    //     </TouchableOpacity>
    // </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  container: {
    paddingHorizontal: 24,
    gap: 24,
  },
  card: {
    borderRadius: 24,
    padding: 20,
    gap: 12,
  },
  elevatedCard: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitleChip: {
    flexDirection: "row",
    alignItems: "center",
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
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  cardHeadline: {
    fontSize: 17,
    lineHeight: 24,
  },
  questMetaRow: {
    flexDirection: "row",
    gap: 16,
    flexWrap: "wrap",
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaLabel: {
    fontSize: 14,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 18,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  multilineInput: {
    minHeight: 60,
    textAlignVertical: "top",
  },
  row: {
    flexDirection: "row",
    gap: 16,
  },
  rowItem: {
    flex: 1,
  },
  label: {
    fontSize: 13,
    marginBottom: 4,
  },
  primaryButton: {
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 4,
  },
  questRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    marginTop: 12,
  },
  questDescription: {
    fontSize: 14,
  },
  metaRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  metaText: {
    fontSize: 12,
  },
  smallButton: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
  },
  ctaButton: {
    width: "100%",
    borderRadius: 20,
    paddingHorizontal: 28,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaButtonLarge: {
    // larger vertical padding for prominent call-to-action buttons
    paddingVertical: 18,
  },
  ctaText: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
});

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
  star: "star",
  schedule: "schedule",
} as const;
