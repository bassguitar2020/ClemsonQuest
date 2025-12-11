import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useUser } from "@/contexts/user-context";
import { useThemeColor } from "@/hooks/use-theme-color";
import { db } from "@/lib/firebase";
import { timeRemaining } from "@/util/timeRemaining";
import { QuestView } from "@/components/QuestView";
import { useQuests } from "@/hooks/use-quests";

export default function QuestsScreen() {
  const { isAdmin, userId } = useUser();
  const insets = useSafeAreaInsets();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [points, setPoints] = useState("100");
  const [hours, setHours] = useState("2");
  const [isCreating, setCreating] = useState(false);

  const surface = useThemeColor(
    { light: "#FFFFFF", dark: "rgba(255,255,255,0.05)" },
    "background",
  );
  const accent = useThemeColor({}, "accent");
  const highlight = useThemeColor({}, "tint");
  const subtle = useThemeColor({ light: "#6F5FA5", dark: "#D7CEFF" }, "accent");

  const { data: quests, isLoading } = useQuests();

  const containerStyle = useMemo(
    () => [
      styles.container,
      {
        paddingTop: insets.top + 16,
        paddingBottom: insets.bottom + 32,
      },
    ],
    [insets.bottom, insets.top],
  );

  // Subscribe to quests

  const createQuest = async () => {
    if (!isAdmin || !userId) return;
    const trimmedTitle = title.trim();
    const trimmedDesc = description.trim();
    const pts = Number(points) || 0;
    const hrs = Number(hours) || 1;
    if (!trimmedTitle || !trimmedDesc || pts <= 0) return;

    setCreating(true);
    try {
      const expiresAt = new Date(Date.now() + hrs * 60 * 60 * 1000);
      await addDoc(collection(db, "quests"), {
        title: trimmedTitle,
        description: trimmedDesc,
        points: pts,
        expiresAt,
        createdAt: new Date(),
        createdBy: userId,
      });

      setTitle("");
      setDescription("");
      setPoints("100");
      setHours("2");
    } finally {
      setCreating(false);
    }
  };

  return (
    <ThemedView style={styles.root}>
      <ScrollView
        contentContainerStyle={containerStyle}
        showsVerticalScrollIndicator={false}
      >
        {isAdmin && (
          <ThemedView style={[styles.card, { backgroundColor: surface }]}>
            <View style={styles.headerRow}>
              <MaterialIcons name="add-task" size={24} color={accent} />
              <ThemedText type="subtitle" style={styles.cardTitle}>
                Create Quests
              </ThemedText>
            </View>
            <TextInput
              placeholder="Quest title"
              placeholderTextColor={subtle}
              value={title}
              onChangeText={setTitle}
              style={[styles.input, { color: subtle }]}
            />
            <TextInput
              placeholder="Description (what should students do?)"
              placeholderTextColor={subtle}
              value={description}
              onChangeText={setDescription}
              style={[styles.input, styles.multilineInput, { color: subtle }]}
              multiline
            />
            <View style={styles.row}>
              <View style={styles.rowItem}>
                <ThemedText style={styles.label}>Points</ThemedText>
                <TextInput
                  keyboardType="numeric"
                  value={points}
                  onChangeText={setPoints}
                  style={[styles.input, { color: subtle }]}
                />
              </View>
              <View style={styles.rowItem}>
                <ThemedText style={styles.label}>Hours available</ThemedText>
                <TextInput
                  keyboardType="numeric"
                  value={hours}
                  onChangeText={setHours}
                  style={[styles.input, { color: subtle }]}
                />
              </View>
            </View>
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: accent }]}
              onPress={createQuest}
              disabled={isCreating}
              activeOpacity={0.85}
            >
              <ThemedText lightColor="#FFFFFF" darkColor="#FFFFFF">
                {isCreating ? "Creating…" : "Create quest"}
              </ThemedText>
            </TouchableOpacity>
          </ThemedView>
        )}

        <ThemedView style={[styles.card, { backgroundColor: surface }]}>
          <View style={styles.headerRow}>
            <MaterialIcons name="flag" size={24} color={highlight} />
            <ThemedText type="subtitle" style={styles.cardTitle}>
              Active quests
            </ThemedText>
          </View>
          {quests.length === 0 ? (
            <ThemedText style={{ color: subtle }}>
              No active quests right now. Check back soon!
            </ThemedText>
          ) : (
            quests.map((q) => <QuestView quest={q} />)
          )}
        </ThemedView>
      </ScrollView>
    </ThemedView>
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
});
