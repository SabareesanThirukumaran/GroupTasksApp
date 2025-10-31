import { useEffect } from 'react';
import { Stack, router, useSegments, usePathname } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/config';
import {updateLastActive} from "../firebase/firebaseService";
import {AuthProvider, useAuth} from "../context/AuthContext";
import { DataProvider } from '../context/DataContext';

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

export default function RootLayout() {
  return (
    <AuthProvider>
      <NavigationHandler />
      <DataProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
        </Stack>
      </DataProvider>
    </AuthProvider>
  );
}