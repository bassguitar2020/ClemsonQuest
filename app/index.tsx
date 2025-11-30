import { useEffect, useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
  View,
  TouchableOpacity,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { FirebaseError } from 'firebase/app';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useUser } from '@/contexts/user-context';
import { auth, db } from '@/lib/firebase';

const CLEMSON_EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@clemson\.edu$/i;
const MIN_PASSWORD_LENGTH = 6;
type AuthMode = 'signin' | 'signup';
const TEAMS = ['Red Team', 'Yellow Team', 'Blue Team'] as const;

export default function LoginScreen() {
  const router = useRouter();
  const { firstName, lastName, email, refreshUserProfile } = useUser();
  const lastNameInputRef = useRef<TextInput>(null);
  const emailInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);
  const [authMode, setAuthMode] = useState<AuthMode>('signin');
  const [formValues, setFormValues] = useState({
    firstName,
    lastName,
    email,
    password: '',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setSubmitting] = useState(false);
  const colorScheme = useColorScheme() ?? 'light';
  const insets = useSafeAreaInsets();

  const inputBackground = useThemeColor(
    { light: 'rgba(82,45,128,0.08)', dark: 'rgba(255,255,255,0.08)' },
    'background'
  );
  const buttonBackground = useThemeColor({}, 'tint');
  const buttonTextColor = '#FFFFFF';
  const accentColor = useThemeColor({}, 'accent');

  useEffect(() => {
    setFormValues({
      firstName,
      lastName,
      email,
      password: '',
    });
  }, [email, firstName, lastName]);

  const handleChange = (field: keyof typeof formValues) => (value: string) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
    if (error) {
      setError('');
    }
  };

  const isSignUp = authMode === 'signup';
  const trimmedFirst = formValues.firstName.trim();
  const trimmedLast = formValues.lastName.trim();
  const trimmedEmail = formValues.email.trim().toLowerCase();
  const trimmedPassword = formValues.password.trim();
  const hasValidEmail = CLEMSON_EMAIL_REGEX.test(trimmedEmail);
  const meetsPasswordRequirement = trimmedPassword.length >= MIN_PASSWORD_LENGTH;
  const isSubmitDisabled =
    isSubmitting ||
    !hasValidEmail ||
    !meetsPasswordRequirement ||
    (isSignUp && (!trimmedFirst || !trimmedLast));

  const ensureProfile = async (displayFirst: string, displayLast: string) => {
    if (!auth.currentUser) return;
    const desiredDisplay = [displayFirst, displayLast].filter(Boolean).join(' ').trim();
    if (!desiredDisplay || auth.currentUser.displayName === desiredDisplay) return;
    await updateProfile(auth.currentUser, { displayName: desiredDisplay });
    refreshUserProfile();
  };

  const assignTeam = () => {
    const index = Math.floor(Math.random() * TEAMS.length);
    return TEAMS[index];
  };

  const createUserRecord = async (userId: string, profile: { firstName: string; lastName: string; email: string }) => {
    const team = assignTeam();
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
      ...profile,
      team,
      points: 0,
      tasksCompleted: 0,
      createdAt: new Date().toISOString(),
    });
  };

  const handleSubmit = async () => {
    if (!trimmedEmail) {
      setError('Please enter your Clemson email.');
      return;
    }
    if (!hasValidEmail) {
      setError('Use a Clemson email that ends with @clemson.edu.');
      return;
    }
    if (!trimmedPassword) {
      setError('Please enter your password.');
      return;
    }
    if (!meetsPasswordRequirement) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (isSignUp) {
      if (!trimmedFirst) {
        setError('Please enter your first name.');
        return;
      }
      if (!trimmedLast) {
        setError('Please enter your last name.');
        return;
      }
    }

    setError('');
    setSubmitting(true);
    try {
      if (isSignUp) {
        const credential = await createUserWithEmailAndPassword(auth, trimmedEmail, trimmedPassword);
        await createUserRecord(credential.user.uid, {
          firstName: trimmedFirst,
          lastName: trimmedLast,
          email: trimmedEmail,
        });
        await ensureProfile(trimmedFirst, trimmedLast);
      } else {
        await signInWithEmailAndPassword(auth, trimmedEmail, trimmedPassword);
      }
      router.replace('/(tabs)');
    } catch (err) {
      if (err instanceof FirebaseError) {
        switch (err.code) {
          case 'auth/user-not-found':
            setError('No account found for that email. Try signing up.');
            break;
          case 'auth/invalid-credential':
          case 'auth/wrong-password':
            setError('Incorrect password. Please try again.');
            break;
          case 'auth/invalid-email':
            setError('That email address looks invalid. Double-check it and try again.');
            break;
          case 'auth/network-request-failed':
            setError('Network error. Check your connection and try again.');
            break;
          case 'auth/email-already-in-use':
            setError('That email is already registered. Try signing in instead.');
            break;
          case 'auth/too-many-requests':
            setError('Too many attempts. Please wait and try again later.');
            break;
          default:
            setError('Unable to sign in right now. Please try again.');
        }
      } else {
        setError('Unexpected error. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const contentStyle = useMemo(
    () => [
      styles.content,
      {
        paddingHorizontal: 24,
        paddingTop: Math.max(32, insets.top + 16),
        paddingBottom: Math.max(32, insets.bottom + 24),
      },
    ],
    [insets.bottom, insets.top]
  );

  return (
    <ThemedView style={{ flex: 1 }}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: 'padding', android: 'height' })}
        style={{ flex: 1 }}
      >
        <SafeAreaView style={{ flex: 1 }}>
          <View style={contentStyle}>
            <ThemedText type="title" style={[styles.title, { color: buttonBackground }]}>
              ClemsonQuest
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              Sign in to start connecting with fellow students.
            </ThemedText>
            <View style={styles.modeSwitch}>
              {(['signin', 'signup'] as AuthMode[]).map((mode) => {
                const isActive = mode === authMode;
                return (
                  <TouchableOpacity
                    key={mode}
                    onPress={() => setAuthMode(mode)}
                    style={[
                      styles.modeButton,
                      {
                        backgroundColor: isActive ? buttonBackground : 'transparent',
                        borderColor: buttonBackground,
                      },
                    ]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isActive }}
                  >
                    <ThemedText
                      style={[
                        styles.modeButtonText,
                        { color: isActive ? '#FFFFFF' : buttonBackground },
                      ]}
                    >
                      {mode === 'signin' ? 'Sign In' : 'Sign Up'}
                    </ThemedText>
                  </TouchableOpacity>
                );
              })}
            </View>
            {isSignUp && (
              <>
                <TextInput
                  placeholder="First name"
                  placeholderTextColor={Colors[colorScheme].icon}
                  value={formValues.firstName}
                  onChangeText={handleChange('firstName')}
                  onSubmitEditing={() => lastNameInputRef.current?.focus()}
                  returnKeyType="next"
                  autoCapitalize="words"
                  autoComplete="given-name"
                  style={[
                    styles.input,
                    {
                      backgroundColor: inputBackground,
                      color: Colors[colorScheme].text,
                      borderColor: accentColor,
                    },
                  ]}
                />
                <TextInput
                  ref={lastNameInputRef}
                  placeholder="Last name"
                  placeholderTextColor={Colors[colorScheme].icon}
                  value={formValues.lastName}
                  onChangeText={handleChange('lastName')}
                  onSubmitEditing={() => emailInputRef.current?.focus()}
                  returnKeyType="next"
                  autoCapitalize="words"
                  autoComplete="family-name"
                  style={[
                    styles.input,
                    {
                      backgroundColor: inputBackground,
                      color: Colors[colorScheme].text,
                      borderColor: accentColor,
                    },
                  ]}
                />
              </>
            )}
            <TextInput
              ref={emailInputRef}
              placeholder="Clemson email"
              placeholderTextColor={Colors[colorScheme].icon}
              value={formValues.email}
              onChangeText={handleChange('email')}
              onSubmitEditing={() => passwordInputRef.current?.focus()}
              returnKeyType="next"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              keyboardType="email-address"
              style={[
                styles.input,
                {
                  backgroundColor: inputBackground,
                  color: Colors[colorScheme].text,
                  borderColor: accentColor,
                },
              ]}
            />
            <TextInput
              ref={passwordInputRef}
              placeholder="Password"
              placeholderTextColor={Colors[colorScheme].icon}
              value={formValues.password}
              onChangeText={handleChange('password')}
              onSubmitEditing={handleSubmit}
              returnKeyType="done"
              secureTextEntry
              textContentType="password"
              style={[
                styles.input,
                {
                  backgroundColor: inputBackground,
                  color: Colors[colorScheme].text,
                  borderColor: accentColor,
                },
              ]}
            />
            {!!error && (
              <ThemedText lightColor="#d93025" darkColor="#ff6f6f" style={styles.errorText}>
                {error}
              </ThemedText>
            )}
            <TouchableOpacity
              style={[
                styles.button,
                {
                  backgroundColor: buttonBackground,
                  opacity: isSubmitDisabled ? 0.55 : 1,
                },
              ]}
              onPress={handleSubmit}
              disabled={isSubmitDisabled}
              activeOpacity={0.9}
            >
              <ThemedText style={[styles.buttonText, { color: buttonTextColor }]}>
                {isSubmitting
                  ? authMode === 'signin'
                    ? 'Signing in...'
                    : 'Creating account...'
                  : authMode === 'signin'
                    ? 'Sign In'
                    : 'Create Account'}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 16,
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
  },
  errorText: {
    textAlign: 'center',
  },
  modeSwitch: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  modeButton: {
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 999,
    borderWidth: 1,
  },
  modeButtonText: {
    fontWeight: '600',
  },
  button: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 3,
  },
  buttonText: {
    fontWeight: '600',
    fontSize: 16,
  },
});
