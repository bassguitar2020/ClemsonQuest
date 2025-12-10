// lib/useAdminUser.ts
import { doc, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from './firebase';

export type AppUser = {
    id: string;
    displayName: string;
    email: string;
    team?: string;
    role?: 'admin' | 'player' | string;
};

const CURRENT_USER_ID = 'admin1'; // TEMP: hardcoded for testing

export function useAdminUser() {
    const [user, setUser] = useState<AppUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
            const ref = doc(db, 'users', CURRENT_USER_ID);
            const unsub = onSnapshot(ref, (snap) => {
            if (!snap.exists()) {
                setUser(null);
                setLoading(false);
                return;
            }
            const data = snap.data() as any;
            setUser({
                id: snap.id,
                displayName: data.displayName ?? '',
                email: data.email ?? '',
                team: data.team ?? '',
                role: data.role ?? 'player',
            });
            setLoading(false);
        });

        return () => unsub();
    }, []);

    const isAdmin = user?.role === 'admin';

    return { user, isAdmin, loading };
}
