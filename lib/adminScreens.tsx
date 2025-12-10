import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
    addDoc,
    collection,
    doc,
    increment,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    Timestamp,
    updateDoc,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { deleteObject, ref } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { useUser } from '@/contexts/user-context';
import { useAdminUser } from '@/lib/useAdminUser';

type AdminTab = 'home' | 'quests' | 'account';

type UserRow = {
    id: string;
    displayName: string;
    email: string;
    team?: string;
};

type Quest = {
    id: string;
    title: string;
    description: string;
    points: number;
    difficulty: 'Easy' | 'Medium' | 'Hard' | string;
    isActive: boolean;
    createdAt?: any;
    expiresAt?: any;
};

type PhotoSubmissionStatus = 'pending' | 'approved' | 'rejected';

type PhotoSubmission = {
    id: string;
    userId: string;
    userName?: string;
    teamName?: string;
    teamKey?: string;
    title?: string;
    status: PhotoSubmissionStatus;
    points: number;
    createdAt?: any;
    photoUrl?: string;
    storagePath?: string;
};

export default function AdminScreen() {
    const [tab, setTab] = useState<AdminTab>('home');

    return (
        <SafeAreaView
            style={{ flex: 1, backgroundColor: '#fff' }}
            edges={['top', 'left', 'right']} // keep bottom for the tab bar
        >
            {/* Top admin tab buttons */}
            <View
            style={{
                flexDirection: 'row',
                paddingHorizontal: 16,
                paddingTop: 8,
                paddingBottom: 8,
            }}
        >
            <AdminTabButton label="Home" active={tab === 'home'} onPress={() => setTab('home')} />
            <AdminTabButton label="Quests" active={tab === 'quests'} onPress={() => setTab('quests')} />
            <AdminTabButton
                label="Account"
                active={tab === 'account'}
                onPress={() => setTab('account')}
            />
        </View>

        {/* Tab content */}
        {tab === 'home' && <AdminHomeScreen />}
        {tab === 'quests' && <AdminQuestsScreen />}
        {tab === 'account' && <AdminAccountScreen />}
        </SafeAreaView>
    );
}

function AdminTabButton({
    label,
    active,
    onPress,
}: {
    label: string;
    active: boolean;
    onPress: () => void;
}) {
    return (
        <Pressable
            onPress={onPress}
            style={{
                flex: 1,
                marginHorizontal: 4,
                borderRadius: 999,
                paddingVertical: 8,
                backgroundColor: active ? '#4a1f8c' : '#f0e7ff',
                alignItems: 'center',
            }}
        >
            <Text style={{ color: active ? '#fff' : '#4a1f8c', fontWeight: '600' }}>{label}</Text>
        </Pressable>
    );
}

export function AdminHomeScreen() {
    const [quests, setQuests] = useState<Quest[]>([]);
    const [loading, setLoading] = useState(true);
    const { teams } = useUser();
    const insets = useSafeAreaInsets();

    useEffect(() => {
        const questsQuery = query(collection(db, 'quests'), orderBy('createdAt', 'desc'));
        const unsubQuests = onSnapshot(questsQuery, (snap) => {
            const now = new Date();
            const list: Quest[] = snap.docs
                .map((d) => {
                    const q = d.data() as any;
                    return {
                        id: d.id,
                        title: q.title ?? '',
                        description: q.description ?? '',
                        points: q.points ?? 0,
                        difficulty: q.difficulty ?? 'Easy',
                        isActive: q.isActive ?? true,
                        createdAt: q.createdAt,
                        expiresAt: q.expiresAt,
                    };
                })
                .filter((q) => {
                    if (!q.isActive) return false;
                    if (!q.expiresAt) return true;
                    const exp = q.expiresAt.toDate ? q.expiresAt.toDate() : q.expiresAt;
                    return exp > now;
                });
            
            setQuests(list);
            setLoading(false);
        });

        return () => {
            unsubQuests();
        };
    }, []);

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator />
            <Text>Loading admin data…</Text>
            </View>
        );
    }

    return (
        <ScrollView
            contentContainerStyle={{
                paddingHorizontal: 16,
                paddingTop: insets.top + 16,
                paddingBottom: insets.bottom + 32,
            }}
        >
            <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 8 }}>Team Scores</Text>
            {teams.map((team) => (
                <View
                    key={team.key}
                    style={{
                        paddingVertical: 8,
                        borderBottomColor: '#eee',
                        borderBottomWidth: 1,
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}
                >
                    <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 8 }}>
                        <View
                            style={{
                                width: 12,
                                height: 12,
                                borderRadius: 12,
                                backgroundColor: team.color,
                            }}
                        />
                        <Text style={{ fontWeight: '600' }}>{team.name}</Text>
                    </View>
                    <Text style={{ fontWeight: '700' }}>{team.points} pts</Text>
                </View>
            ))}

            <View style={{ height: 24 }} />

            <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 8 }}>Active Quests</Text>
            {quests.length === 0 ? (
                <Text>No active quests.</Text>
            ) : (
                quests.map((q) => (
                    <View
                        key={q.id}
                        style={{
                            paddingVertical: 8,
                            borderBottomColor: '#eee',
                            borderBottomWidth: 1,
                        }}
                    >
                        <Text style={{ fontWeight: '600' }}>{q.title}</Text>
                        <Text style={{ fontSize: 12, color: '#666' }}>
                            {q.difficulty} • {q.points} pts
                        </Text>
                    </View>
                ))
            )}
        </ScrollView>
    );
}

export function AdminReviewsScreen() {
    const [photoSubmissions, setPhotoSubmissions] = useState<PhotoSubmission[]>([]);
    const insets = useSafeAreaInsets();

    useEffect(() => {
        const submissionsQuery = query(collection(db, 'photoSubmissions'), orderBy('createdAt', 'desc'));
        const unsubSubmissions = onSnapshot(submissionsQuery, (snap) => {
            const list: PhotoSubmission[] = snap.docs
                .map((d) => {
                    const data = d.data() as any;
                    return {
                        id: d.id,
                        userId: data.userId ?? '',
                        userName: data.userName ?? '',
                        teamName: data.teamName ?? '',
                        teamKey: data.teamKey ?? undefined,
                        title: data.title ?? '',
                        status: (data.status as PhotoSubmissionStatus) ?? 'pending',
                        points: Number(data.points ?? 0),
                        createdAt: data.createdAt,
                        photoUrl: data.photoUrl,
                        storagePath: data.storagePath,
                    };
                })
                .filter((s) => s.status === 'pending');
            setPhotoSubmissions(list);
        });

        return () => {
            unsubSubmissions();
        };
    }, []);

    const handleReviewSubmission = async (submission: PhotoSubmission, approve: boolean) => {
        if (!submission.id || !submission.storagePath) return;

        const submissionRef = doc(db, 'photoSubmissions', submission.id);
        const updates: Promise<unknown>[] = [];
        const points = submission.points || 0;

        if (approve) {
            if (submission.teamKey) {
                const scoresRef = doc(db, 'teamPoints', 'scores');
                updates.push(
                    updateDoc(scoresRef, {
                        [submission.teamKey]: increment(points),
                    })
                );
            }

            if (submission.userId) {
                const userRef = doc(db, 'users', submission.userId);
                updates.push(
                    updateDoc(userRef, {
                        points: increment(points),
                        tasksCompleted: increment(1),
                    })
                );
            }
        }

        updates.push(
            updateDoc(submissionRef, {
                status: approve ? 'approved' : 'rejected',
                reviewedAt: serverTimestamp(),
            })
        );

        const storageRef = ref(storage, submission.storagePath);

        try {
            await Promise.all(updates);
        } finally {
            try {
                await deleteObject(storageRef);
            } catch {
                // ignore storage deletion errors
            }
        }
    };

    const handleApproveSubmission = (submission: PhotoSubmission) => {
        void handleReviewSubmission(submission, true);
    };

    const handleRejectSubmission = (submission: PhotoSubmission) => {
        void handleReviewSubmission(submission, false);
    };

    return (
        <ScrollView
            contentContainerStyle={{
                paddingHorizontal: 16,
                paddingTop: insets.top + 16,
                paddingBottom: insets.bottom + 32,
            }}
        >
            <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 8 }}>
                Photo Submissions Awaiting Review
            </Text>
            {photoSubmissions.length === 0 ? (
                <Text>No pending photo submissions.</Text>
            ) : (
                photoSubmissions.map((sub) => (
                    <View
                        key={sub.id}
                        style={{
                            paddingVertical: 8,
                            borderBottomColor: '#eee',
                            borderBottomWidth: 1,
                        }}
                    >
                        <Text style={{ fontWeight: '600' }}>{sub.title || 'Quest submission'}</Text>
                        <Text style={{ fontSize: 12, color: '#666' }}>
                            {(sub.userName || 'Unknown user') +
                                ' • ' +
                                (sub.teamName || 'Unknown team') +
                                ` • ${sub.points} pts`}
                        </Text>
                        {sub.photoUrl ? (
                            <Image
                                source={{ uri: sub.photoUrl }}
                                style={{
                                    marginTop: 8,
                                    borderRadius: 8,
                                    width: '100%',
                                    aspectRatio: 4 / 3,
                                    backgroundColor: '#ddd',
                                }}
                            />
                        ) : null}
                        <View
                            style={{
                                flexDirection: 'row',
                                marginTop: 8,
                                columnGap: 8,
                            }}
                        >
                            <Pressable
                                onPress={() => handleApproveSubmission(sub)}
                                style={{
                                    flex: 1,
                                    borderRadius: 999,
                                    paddingVertical: 8,
                                    alignItems: 'center',
                                    backgroundColor: '#4caf50',
                                }}
                            >
                                <Text style={{ color: '#fff', fontWeight: '600' }}>Approve</Text>
                            </Pressable>
                            <Pressable
                                onPress={() => handleRejectSubmission(sub)}
                                style={{
                                    flex: 1,
                                    borderRadius: 999,
                                    paddingVertical: 8,
                                    alignItems: 'center',
                                    backgroundColor: '#f44336',
                                }}
                            >
                                <Text style={{ color: '#fff', fontWeight: '600' }}>Reject</Text>
                            </Pressable>
                        </View>
                    </View>
                ))
            )}
        </ScrollView>
    );
}


export function AdminQuestsScreen() {
    const { user } = useAdminUser();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [points, setPoints] = useState('100');
    const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Easy');
    //const [expiresAtText, setExpiresAtText] = useState(''); // e.g. '2025-12-31 23:59' - implementing datepicker instead
    const [expiresAt, setExpiresAt] = useState<Date | null>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [saving, setSaving] = useState(false);
    const [quests, setQuests] = useState<Quest[]>([]);

    // small helper function for web
    const handleOpenDeadlinePicker = () => {
        if (Platform.OS === 'web') {
            // fallback (prompt)
            const input = window.prompt(
                'Enter quest deadline (YYYY-MM-DD HH:MM)',
                expiresAt ? formatDateTime(expiresAt) : ''
            );
            if (!input) {
                setExpiresAt(null);
                return;
            }
            const parsed = new Date(input);
            if (!isNaN(parsed.getTime())) {
                setExpiresAt(parsed);
            } else {
                alert('Could not parse that date. Use format YYYY-MM-DD HH:MM');
            }
        } else {
            // Native (iOS/Android) – show system date/time picker
            setShowDatePicker((prev) => !prev)
        }
    };

    useEffect(() => {
        const q = query(collection(db, 'quests'), orderBy('createdAt', 'desc'));
        const unsub = onSnapshot(q, (snap) => {
            const list: Quest[] = snap.docs.map((d) => {
                const qd = d.data() as any;
                return {
                    id: d.id,
                    title: qd.title ?? '',
                    description: qd.description ?? '',
                    points: qd.points ?? 0,
                    difficulty: qd.difficulty ?? 'Easy',
                    isActive: qd.isActive ?? true,
                    createdAt: qd.createdAt,
                    expiresAt: qd.expiresAt,
                };
            });
            setQuests(list);
        });

        return () => unsub();
    }, []);

    const handleCreateQuest = async () => {
        if (!title.trim()) return;

        setSaving(true);
        try {
            const expiresAtTimestamp = expiresAt ? Timestamp.fromDate(expiresAt) : null;
            
            await addDoc(collection(db, 'quests'), {
                title: title.trim(),
                description: description.trim(),
                points: Number(points) || 0,
                difficulty,
                isActive: true,
                createdAt: serverTimestamp(),
                expiresAt: expiresAtTimestamp,
                createdBy: user?.id ?? null,
            });

            // reset form
            setTitle('');
            setDescription('');
            setPoints('100');
            setDifficulty('Easy');
            setExpiresAt(null);
        } finally {
            setSaving(false);
        }
    };

    const insets = useSafeAreaInsets();

    return (
        <ScrollView
            contentContainerStyle={{
                paddingHorizontal: 16,
                paddingTop: insets.top + 16,
                paddingBottom: insets.bottom + 32,
            }}
        >
            <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 8 }}>Create Quest</Text>

            {/* Title */}
            <TextInput
                placeholder="Quest title"
                value={title}
                onChangeText={setTitle}
                style={{
                    borderWidth: 1,
                    borderColor: '#ddd',
                    borderRadius: 8,
                    padding: 8,
                    marginBottom: 8,
                }}
            />

            {/* Description */}
            <TextInput
                placeholder="Quest description"
                value={description}
                onChangeText={setDescription}
                multiline
                style={{
                    borderWidth: 1,
                    borderColor: '#ddd',
                    borderRadius: 8,
                    padding: 8,
                    marginBottom: 8,
                    minHeight: 60,
                }}
            />

            {/* Points */}
            <TextInput
                placeholder="Points"
                keyboardType="numeric"
                value={points}
                onChangeText={setPoints}
                style={{
                    borderWidth: 1,
                    borderColor: '#ddd',
                    borderRadius: 8,
                    padding: 8,
                    marginBottom: 8,
                    maxWidth: 120,
                }}
            />

            {/* Difficulty picker (simple buttons) */}
            <View style={{ flexDirection: 'row', marginBottom: 8 }}>
                {(['Easy', 'Medium', 'Hard'] as const).map((d) => (
                <Pressable
                    key={d}
                    onPress={() => setDifficulty(d)}
                    style={{
                        paddingVertical: 6,
                        paddingHorizontal: 12,
                        borderRadius: 999,
                        borderWidth: 1,
                        borderColor: difficulty === d ? '#4a1f8c' : '#ddd',
                        backgroundColor: difficulty === d ? '#4a1f8c' : '#fff',
                        marginRight: 8,
                    }}
                >
                    <Text style={{ color: difficulty === d ? '#fff' : '#333' }}>{d}</Text>
                </Pressable>
                ))}
            </View>

            {/* Expires at picker */}
            <Text style={{ marginBottom: 4 }}>Quest Deadline</Text>
            
            <Pressable
                onPress={handleOpenDeadlinePicker}
                style={{
                    borderWidth: 1,
                    borderColor: '#ddd',
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    marginBottom: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}
            >
                <Text style={{ color: expiresAt ? '#000' : '#999' }}>
                    {expiresAt ? formatDateTime(expiresAt) : 'Choose date & time'}
                </Text>
                <Ionicons name="calendar-outline" size={20} color="#4a1f8c" />
            </Pressable>

            {showDatePicker && Platform.OS !== 'web' && (
                <DateTimePicker
                    value={expiresAt ?? new Date()}
                    mode="datetime"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    /* Making the scroll visible on Mobile IOS */ 
                    themeVariant="light"
                    textColor="#000000"
                    style={{ backgroundColor: '#ffffff' }}
                    onChange={(event, selectedDate) => {
                        // On Android, user can cancel -> selectedDate is undefined
                        if (Platform.OS === 'android') {
                            setShowDatePicker(false);
                        }
                        if (selectedDate) {
                            setExpiresAt(selectedDate);
                        }
                    }}
                />
            )}

            {/* Create Quest Button*/}
            <Pressable
                onPress={handleCreateQuest}
                disabled={saving}
                style={{
                    backgroundColor: saving ? '#b19cd9' : '#4a1f8c',
                    borderRadius: 999,
                    paddingVertical: 12,
                    alignItems: 'center',
                    marginBottom: 24,
                }}
            >
                <Text style={{ color: '#fff', fontWeight: '700' }}>
                    {saving ? 'Creating…' : 'Create Quest'}
                </Text>
            </Pressable>

            {/* Existing quests list */}
            <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 8 }}>All Quests</Text>

            {quests.map((q) => (
                <View
                    key={q.id}
                    style={{
                        paddingVertical: 8,
                        borderBottomColor: '#eee',
                        borderBottomWidth: 1,
                    }}
                >
                    <Text style={{ fontWeight: '600' }}>{q.title}</Text>
                    <Text style={{ fontSize: 12, color: '#666' }}>
                        {q.difficulty} • {q.points} pts • {q.isActive ? 'Active' : 'Inactive'}
                    </Text>
                </View>
            ))}
        </ScrollView>
    );
}


export function AdminAccountScreen() {
    const { user } = useAdminUser();
    const [displayName, setDisplayName] = useState(user?.displayName ?? '');
    const [email, setEmail] = useState(user?.email ?? '');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (user) {
            setDisplayName(user.displayName);
            setEmail(user.email);
        }
    }, [user?.id]);

    const handleSave = async () => {
        if (!user) return;
        setSaving(true);
        try {
            await updateDoc(doc(db, 'users', user.id), {
                displayName: displayName.trim(),
                email: email.trim(),
            });
        } finally {
            setSaving(false);
        }
    };

    if (!user) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text>No admin user loaded.</Text>
            </View>
        );
    }

    return (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 16 }}>Admin Account</Text>

            <Text style={{ marginBottom: 4 }}>Name</Text>
            <TextInput
                value={displayName}
                onChangeText={setDisplayName}
                style={{
                    borderWidth: 1,
                    borderColor: '#ddd',
                    borderRadius: 8,
                    padding: 8,
                    marginBottom: 12,
                }}
            />

            <Text style={{ marginBottom: 4 }}>Email</Text>
            <TextInput
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                style={{
                    borderWidth: 1,
                    borderColor: '#ddd',
                    borderRadius: 8,
                    padding: 8,
                    marginBottom: 16,
                }}
            />

            <Pressable
                onPress={handleSave}
                disabled={saving}
                style={{
                    backgroundColor: saving ? '#b19cd9' : '#4a1f8c',
                    borderRadius: 999,
                    paddingVertical: 12,
                    alignItems: 'center',
                }}
            >
                <Text style={{ color: '#fff', fontWeight: '700' }}>
                    {saving ? 'Saving…' : 'Save'}
                </Text>
            </Pressable>
        </ScrollView>
    );
}


//   {Helper function}
function formatDateTime(date: Date) {
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    return `${year}-${month}-${day} ${hours}:${minutes}`;
}
