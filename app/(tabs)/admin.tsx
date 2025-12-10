import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
    addDoc,
    collection,
    doc,
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
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { db } from '../../lib/firebase';
import { useAdminUser } from '../../lib/useAdminUser';

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
        {tab === 'home' && <AdminHome />}
        {tab === 'quests' && <AdminQuests />}
        {tab === 'account' && <AdminAccount />}
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

function AdminHome() {
    const [users, setUsers] = useState<UserRow[]>([]);
    const [quests, setQuests] = useState<Quest[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const usersQuery = query(collection(db, 'users'), orderBy('displayName'))

        const unsubUsers = onSnapshot(usersQuery, (snap) => {
            setUsers(
                snap.docs.map((d) => {
                    const u = d.data() as any;
                    return {
                        id: d.id,
                        displayName: u.displayName ?? '',
                        email: u.email ?? '',
                    };
                })
            );
        });
        
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
            unsubUsers();
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
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 8 }}>Active Users</Text>
            {users.length === 0 ? (
                <Text>No users yet.</Text>
            ) : (
                users.map((u) => (
                    <View
                        key={u.id}
                        style={{
                            paddingVertical: 8,
                            borderBottomColor: '#eee',
                            borderBottomWidth: 1,
                        }}
                    >
                        <Text style={{ fontWeight: '600' }}>{u.displayName}</Text>
                        <Text style={{ fontSize: 12, color: '#666' }}>
                            Team: {u.team || 'Unassigned'}
                        </Text>
                    </View>
                ))
            )}

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


function AdminQuests() {
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
            setShowDatePicker(true);
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

    return (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
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
                        setShowDatePicker(false);
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


function AdminAccount() {
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