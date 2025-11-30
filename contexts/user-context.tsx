import {
  createContext,
  SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';

import { auth, db } from '@/lib/firebase';

export type Team = {
  name: string;
  points: number;
  color: string;
  activity: Activity[];
};

export type Activity = { title: string; timeAgo: string };

type UserProfile = {
  firstName: string;
  lastName: string;
  email: string;
};

type UserContextValue = {
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  isProfileHydrated: boolean;
  isLoading: boolean;
  logout: () => Promise<void>;
  teams: Team[];
  setTeams: React.Dispatch<SetStateAction<Team[]>>;
  refreshUserProfile: () => void;
  userData: UserStats | null;
};

type UserStats = {
  team: string;
  points: number;
  tasksCompleted: number;
};

const UserContext = createContext<UserContextValue | undefined>(undefined);

const TEAM_NAME_LOOKUP: Record<string, string> = {
  'blue': 'Blue Team',
  'blue team': 'Blue Team',
  'red': 'Red Team',
  'red team': 'Red Team',
  'yellow': 'Yellow Team',
  'yellow team': 'Yellow Team',
};

function normalizeTeamName(name: unknown) {
  if (typeof name !== 'string') return '';
  const key = name.trim().toLowerCase();
  if (!key) return '';
  return TEAM_NAME_LOOKUP[key] ?? name;
}

function toUserProfile(firebaseUser: User | null): UserProfile {
  if (!firebaseUser) {
    return {
      firstName: '',
      lastName: '',
      email: '',
    };
  }

  const displayName = firebaseUser.displayName ?? '';
  const displayParts = displayName.split(' ').filter(Boolean);
  const [firstName = '', ...rest] = displayParts;

  return {
    firstName,
    lastName: rest.join(' '),
    email: firebaseUser.email ?? '',
  };
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>({
    firstName: '',
    lastName: '',
    email: '',
  });
  const [isProfileHydrated, setProfileHydrated] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userData, setUserData] = useState<UserStats | null>(null);
  const [teams, setTeams] = useState<Team[]>([
    {
      name: 'Blue Team',
      points: 2850,
      color: '#2979FF',
      activity: [{ title: 'Blue Team gained 200 pts', timeAgo: '5m ago' }],
    },
    {
      name: 'Red Team',
      points: 3050,
      color: '#E53935',
      activity: [{ title: 'Jamie completed "Tillman Selfie"', timeAgo: '12m ago' }],
    },
    {
      name: 'Yellow Team',
      points: 2720,
      color: '#FDD835',
      activity: [],
    },
  ]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setProfile(toUserProfile(firebaseUser));
      setUserId(firebaseUser?.uid ?? null);
      setProfileHydrated(true);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!userId) {
      setUserData(null);
      return;
    }

    const userRef = doc(db, 'users', userId);
    const unsubscribe = onSnapshot(userRef, (snapshot) => {
      if (!snapshot.exists()) {
        setUserData(null);
        return;
      }
      const data = snapshot.data();
      setUserData({
        team: normalizeTeamName(data.team),
        points: Number(data.points ?? 0),
        tasksCompleted: Number(data.tasksCompleted ?? 0),
      });
    });

    return unsubscribe;
  }, [userId]);

  const name = useMemo(() => {
    const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(' ').trim();
    return fullName || 'Explorer';
  }, [profile.firstName, profile.lastName]);

  const { firstName, lastName, email } = profile;

  const logout = useCallback(async () => {
    await signOut(auth);
  }, []);

  const refreshUserProfile = useCallback(() => {
    setProfile(toUserProfile(auth.currentUser));
  }, []);

  const value = useMemo(
    () => ({
      name,
      firstName,
      lastName,
      email,
      isProfileHydrated,
      isLoading: !isProfileHydrated,
      logout,
      teams,
      setTeams,
      refreshUserProfile,
      userData,
    }),
    [email, firstName, isProfileHydrated, lastName, logout, name, refreshUserProfile, teams, userData]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }

  return context;
}
