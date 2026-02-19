import { Stack, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '../components/AuthProvider';
import '../global.css';
import { useFonts } from 'expo-font';
import { useEffect } from 'react';

function AuthRouteWrapper() {
  const { session, profile, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!session && !inAuthGroup) {
      // Redirect to sign-in if not signed in and not in auth group
      router.replace('/(auth)/sign-in');
    } else if (session && inAuthGroup) {
      // Redirect to home if signed in and in auth group
      router.replace('/');
    }
  }, [session, loading, segments]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(customer)" />
      <Stack.Screen name="(laundry)" />
    </Stack>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({
    // Add custom fonts here if needed
  });

  return (
    <AuthProvider>
      <AuthRouteWrapper />
    </AuthProvider>
  );
}
