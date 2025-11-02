import { useEffect, useRef } from 'react';
import { Stack, router, useSegments, usePathname } from 'expo-router';
import {updateLastActive} from "../firebase/firebaseService";
import {AuthProvider, useAuth} from "../context/AuthContext";
import { DataProvider } from '../context/DataContext';
import { ThemeProvider } from '../context/ThemeContext';

function NavigationHandler() {
  const segments = useSegments();
  const pathname = usePathname();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inTabsGroup = segments[0] === '(tabs)';

    if (!user && inTabsGroup) {
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      router.replace('/(tabs)/home');
    } else if (user && pathname === '/') {
      router.replace('/(tabs)/home');
    } else if (!user && pathname === '/') {
      router.replace('/(auth)/login');
    }
  }, [user, loading, segments, pathname]);

  useEffect(() => {
    if (user) {
      updateLastActive(user.uid);

      const interval = setInterval(() => {
        updateLastActive(user.uid);
      }, 5 * 60 * 1000);

      return () => clearInterval(interval);
    }
  }, [user]);

  return null;
}

function AppContent() {
  const { user } = useAuth();
  
  return (
    <ThemeProvider userId={user?.uid}>
      <NavigationHandler />
      <DataProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
        </Stack>
      </DataProvider>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}