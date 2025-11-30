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

export type TeamKey = 'blue' | 'red' | 'yellow';

export type Team = {
  key: TeamKey;
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
  userId: string | null;
};

type UserStats = {
  team: string;
  teamKey?: TeamKey;
  points: number;
  tasksCompleted: number;
};

const UserContext = createContext<UserContextValue | undefined>(undefined);

const TEAM_NAME_LOOKUP: Record<string, TeamKey> = {
  blue: 'blue',
  'blue team': 'blue',
  red: 'red',
  'red team': 'red',
  yellow: 'yellow',
  'yellow team': 'yellow',
};

const TEAM_PRESETS: Record<TeamKey, { name: string; color: string; activity: Activity[]; points: number }> = {
  blue: {
    name: 'Blue Team',
    color: '#2979FF',
    points: 2850,
    activity: [{ title: 'Blue Team gained 200 pts', timeAgo: '5m ago' }],
  },
  red: {
    name: 'Red Team',
    color: '#E53935',
    points: 3050,
    activity: [{ title: 'Jamie completed "Tillman Selfie"', timeAgo: '12m ago' }],
  },
  yellow: {
    name: 'Yellow Team',
    color: '#FDD835',
    points: 2720,
    activity: [],
  },
};

const TEAM_ORDER: TeamKey[] = ['blue', 'red', 'yellow'];

function normalizeTeamName(name: unknown) {
  if (typeof name !== 'string') {
    return { displayName: '', key: undefined };
  }
  const trimmed = name.trim();
  if (!trimmed) {
    return { displayName: '', key: undefined };
  }
  const lookupKey = trimmed.toLowerCase();
  const key = TEAM_NAME_LOOKUP[lookupKey];
  if (!key) {
    return { displayName: trimmed, key: undefined };
  }
  return { displayName: TEAM_PRESETS[key].name, key };
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
  const [teams, setTeams] = useState<Team[]>(() =>
    TEAM_ORDER.map((key) => ({
      key,
      name: TEAM_PRESETS[key].name,
      color: TEAM_PRESETS[key].color,
      points: TEAM_PRESETS[key].points,
      activity: [...TEAM_PRESETS[key].activity],
    }))
  );

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
      const teamInfo = normalizeTeamName(data.team);
      setUserData({
        team: teamInfo.displayName,
        teamKey: teamInfo.key,
        points: Number(data.points ?? 0),
        tasksCompleted: Number(data.tasksCompleted ?? 0),
      });
    });

    return unsubscribe;
  }, [userId]);

  useEffect(() => {
    const scoresRef = doc(db, 'teamPoints', 'scores');
    const unsubscribe = onSnapshot(scoresRef, (snapshot) => {
      if (!snapshot.exists()) return;
      const data = snapshot.data() as Partial<Record<string, number>>;
      setTeams((prev) =>
        prev.map((team) => {
          const nextPoints = Number(data[team.key]);
          if (!Number.isFinite(nextPoints) || nextPoints === team.points) {
            return team;
          }
          return { ...team, points: nextPoints };
        })
      );
    });

    return unsubscribe;
  }, []);

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
      userId,
    }),
    [
      email,
      firstName,
      isProfileHydrated,
      lastName,
      logout,
      name,
      refreshUserProfile,
      teams,
      userData,
      userId,
    ]
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
