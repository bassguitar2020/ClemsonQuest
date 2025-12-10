import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { addDoc, collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useUser } from '@/contexts/user-context';
import { useThemeColor } from '@/hooks/use-theme-color';
import { db } from '@/lib/firebase';

type Quest = {
    id: string;
    title: string;
    description: string;
    points: number;
    difficulty: 'Easy' | 'Medium' | 'Hard' | string;
    createdAt: any;
    expiresAt: any;
};

export default function QuestsScreen() {
    const { isAdmin, userId } = useUser();
    const insets = useSafeAreaInsets();

    const [quests, setQuests] = useState<Quest[]>([]);
    const [loading, setLoading] = useState(true);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [points, setPoints] = useState('100');
    const [hours, setHours] = useState('2');
    const [isCreating, setCreating] = useState(false);

    const surface = useThemeColor({ light: '#FFFFFF', dark: 'rgba(255,255,255,0.05)' }, 'background');
    const accent = useThemeColor({}, 'accent');
    const highlight = useThemeColor({}, 'tint');
    const subtle = useThemeColor({ light: '#6F5FA5', dark: '#D7CEFF' }, 'accent');

    const containerStyle = useMemo(
    () => [
        styles.container,
        {
        paddingTop: insets.top + 16,
        paddingBottom: insets.bottom + 32,
        },
    ],
    [insets.bottom, insets.top]
    );

  // Subscribe to quests
    useEffect(() => {
    const q = query(collection(db, 'quests'), orderBy('expiresAt', 'asc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const now = new Date();
        const data: Quest[] = snapshot.docs
            .map((doc) => {
                const d = doc.data() as any;
                return {
                    id: doc.id,
                    title: d.title ?? '(no title)',
                    description: d.description ?? '',
                    points: d.points ?? 0,
                    difficulty: d.difficulty ?? 'Easy',
                    createdAt: d.createdAt,
                    expiresAt: d.expiresAt,
                };
            })
            .filter((q) => {
                if (!q.expiresAt) return true; // no expiration so always vis.
                const exp = q.expiresAt.toDate ? q.expiresAt.toDate() : q.expiresAt;
                return exp > now;
            });
        setQuests(data);
        setLoading(false);
    });

    return () => unsubscribe();
}, []);

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
        await addDoc(collection(db, 'quests'), {
            title: trimmedTitle,
            description: trimmedDesc,
            points: pts,
            expiresAt,
            createdAt: new Date(),
            createdBy: userId,
    });

        setTitle('');
        setDescription('');
        setPoints('100');
        setHours('2');
    } finally {
        setCreating(false);
    }
    };

    const timeRemaining = (expiresAt: any) => {
        if (!expiresAt) {
            // No deadline set
            return 'No deadline';
        }
    
        // Support Firestore Timestamp, Date, or raw value
        const exp: Date =
            typeof expiresAt?.toDate === 'function'
            ? expiresAt.toDate()
            : expiresAt instanceof Date
            ? expiresAt
            : new Date(expiresAt);

        if (isNaN(exp.getTime())) {
            // Something weird in the data – don’t crash the app
            return 'No deadline';
        }

        const diffMs = exp.getTime() - Date.now();
        if (diffMs <= 0) return 'Expired';

        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const mins = Math.floor((diffMs / (1000 * 60)) % 60);

        if (hours <= 0) return `${mins} min left`;
        return `${hours}h ${mins}m left`;
    };


return (
    <ThemedView style={styles.root}>
        <ScrollView contentContainerStyle={containerStyle} showsVerticalScrollIndicator={false}>
        {isAdmin && (
        <ThemedView style={[styles.card, { backgroundColor: surface }]}>
            <View style={styles.headerRow}>
                <MaterialIcons name="add-task" size={24} color={accent} />
                <ThemedText type="subtitle" style={styles.cardTitle}>
                    Create a quest
            </ThemedText>
            </View>
            <TextInput
                placeholder="Quest title"
                value={title}
                onChangeText={setTitle}
                style={styles.input}
            />
            <TextInput
                placeholder="Description (what should students do?)"
                value={description}
                onChangeText={setDescription}
                style={[styles.input, styles.multilineInput]}
                multiline
            />
            <View style={styles.row}>
            <View style={styles.rowItem}>
                <ThemedText style={styles.label}>Points</ThemedText>
                <TextInput
                    keyboardType="numeric"
                    value={points}
                    onChangeText={setPoints}
                    style={styles.input}
                />
            </View>
            <View style={styles.rowItem}>
                <ThemedText style={styles.label}>Hours available</ThemedText>
                <TextInput
                    keyboardType="numeric"
                    value={hours}
                    onChangeText={setHours}
                    style={styles.input}
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
                {isCreating ? 'Creating…' : 'Create quest'}
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
            quests.map((q) => (
            <View key={q.id} style={styles.questRow}>
                <View style={{ flex: 1, gap: 4 }}>
                <ThemedText type="defaultSemiBold">{q.title}</ThemedText>
                <ThemedText style={styles.questDescription}>{q.description}</ThemedText>
                <View style={styles.metaRow}>
                    <ThemedText style={[styles.metaText, { color: highlight }]}>
                        {q.points} pts
                    </ThemedText>
                    <ThemedText style={[styles.metaText, { color: subtle }]}>
                        {timeRemaining(q.expiresAt)}
                    </ThemedText>
                </View>
                </View>
                {/* Placeholder "Start" button – could navigate to /scan or open submission UI */}
                <TouchableOpacity style={[styles.smallButton, { borderColor: highlight }]}>
                    <ThemedText style={{ color: highlight }}>Start</ThemedText>
                </TouchableOpacity>
            </View>
            ))
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
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
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
        textAlignVertical: 'top',
    },
    row: {
        flexDirection: 'row',
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
        alignItems: 'center',
        marginTop: 4,
    },
    questRow: {
        flexDirection: 'row',
        gap: 12,
        alignItems: 'center',
        marginTop: 12,
    },
    questDescription: {
        fontSize: 14,
    },
    metaRow: {
        flexDirection: 'row',
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
