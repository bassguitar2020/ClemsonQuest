import "@/lib/firebase";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { type ReactNode, useEffect } from "react";
import "react-native-reanimated";

import { SafeAreaProvider } from "react-native-safe-area-context";

import { UserProvider, useUser } from "@/contexts/user-context";
import { useColorScheme } from "@/hooks/use-color-scheme";

export const unstable_settings = {
  anchor: "index",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <SafeAreaProvider>
      <UserProvider>
        <ThemeProvider
          value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
        >
          <Navigation />
          <StatusBar style="auto" />
        </ThemeProvider>
      </UserProvider>
    </SafeAreaProvider>
  );
}

function Navigation() {
  return (
    <AuthGuard>
      <Stack initialRouteName="index">
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="admin-home" options={{ headerShown: false }} />
        <Stack.Screen name="admin-reviews" options={{ headerShown: false }} />
        <Stack.Screen name="admin-quests" options={{ headerShown: false }} />
        <Stack.Screen name="admin-account" options={{ headerShown: false }} />
        <Stack.Screen
          name="modal"
          options={{ presentation: "modal", title: "Modal" }}
        />
        <Stack.Screen name="scan/[id]" options={{ title: "Scan" }} />
      </Stack>
    </AuthGuard>
  );
}

function AuthGuard({ children }: { children: ReactNode }) {
  const segments = useSegments();
  const router = useRouter();
  const { firstName, lastName, email, isProfileHydrated, isAdmin } = useUser();

  useEffect(() => {
    if (!isProfileHydrated) return;
    const isLoggedIn = Boolean(firstName || lastName || email);
    const rootSegment = segments[0];
    const inTabsGroup = rootSegment === "(tabs)";
    const onAuthScreen = !rootSegment || rootSegment === undefined;

    if (!isLoggedIn && !onAuthScreen) {
      router.replace("/");
    } else if (isLoggedIn && onAuthScreen) {
      router.replace(isAdmin ? "/admin-home" : "/home");
    }
  }, [
    email,
    firstName,
    isAdmin,
    isProfileHydrated,
    lastName,
    router,
    segments,
  ]);

  return children;
}
