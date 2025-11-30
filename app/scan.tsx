import { useEffect, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import { doc, increment, updateDoc } from 'firebase/firestore';

import { useUser } from '@/contexts/user-context';
import { db } from '@/lib/firebase';

const QUEST_POINTS = 200;

export default function PhotoQuestScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [isCameraReady, setCameraReady] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { name, teams, setTeams, userData, userId } = useUser();

  const accent = useThemeColor({}, 'accent');
  const highlight = useThemeColor({}, 'tint');
  const surface = useThemeColor({ light: '#FFFFFF', dark: 'rgba(255,255,255,0.05)' }, 'background');

  useEffect(() => {
    if (!permission) requestPermission();
  }, [permission]);

  const TITLE = `${name} took a photo of someone wearing Clemson Orange`;
  const userTeam = useMemo(() => {
    if (!teams.length) return undefined;
    if (userData?.teamKey) {
      return teams.find((team) => team.key === userData.teamKey) ?? teams[0];
    }
    if (userData?.team) {
      return teams.find((team) => team.name === userData.team) ?? teams[0];
    }
    return teams[0];
  }, [teams, userData?.team, userData?.teamKey]);

  const takePhoto = async () => {
    if (!cameraRef.current || !isCameraReady) return;
    const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
    setPhotoUri(photo.uri);
    setIsPreview(true);

    if (userTeam) {
      const updates: Promise<unknown>[] = [];
      const scoresRef = doc(db, 'teamPoints', 'scores');
      updates.push(
        updateDoc(scoresRef, {
          [userTeam.key]: increment(QUEST_POINTS),
        })
      );

      if (userId) {
        const userRef = doc(db, 'users', userId);
        updates.push(
          updateDoc(userRef, {
            points: increment(QUEST_POINTS),
            tasksCompleted: increment(1),
          })
        );
      }

      try {
        await Promise.all(updates);
      } catch {
        // ignore update errors for now
      }

      setTeams((prev) =>
        prev.map((team) =>
          team.key === userTeam.key
            ? {
                ...team,
                activity: [{ title: TITLE, timeAgo: 'just now' }, ...team.activity],
              }
            : team
        )
      );
    }

    router.back();
    router.setParams({ status: "success" });

    // onPhotoTaken(photo.uri);
  };

  if (!permission?.granted) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText type="title">Camera Access Needed</ThemedText>
        <Pressable onPress={requestPermission} style={[styles.ctaButton, { backgroundColor: accent }]}>
          <ThemedText style={styles.ctaText} lightColor="#FFF" darkColor="#FFF">
            Grant Permission
          </ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="back"
        onCameraReady={() => setCameraReady(true)}
      >
        <View style={[styles.overlay, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }]}>
          <View style={[styles.headerCard, { backgroundColor: surface }]}>
            <ThemedText type="title" style={styles.title}>
              Clemson Orange Quest
            </ThemedText>
            <ThemedText style={styles.subtitle}>Take a photo of someone wearing Clemson orange to earn 200 points!</ThemedText>
          </View>

          <Pressable
            onPress={takePhoto}
            disabled={!isCameraReady}
            style={[styles.captureButton, { backgroundColor: accent }]}
          >
            <MaterialIcons name="photo-camera" size={32} color="#FFF" />
          </Pressable>
        </View>
      </CameraView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    padding: 24,
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  headerCard: {
    borderRadius: 20,
    padding: 16,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    marginTop: 6,
  },
  captureButton: {
    width: 76,
    height: 76,
    borderRadius: 76,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  ctaButton: {
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  ctaText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
