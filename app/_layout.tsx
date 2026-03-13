import type { Session } from '@supabase/supabase-js';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { supabase } from '../supabase';

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setReady(true);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

  useEffect(() => {
    if (!ready) return;
    const inAuthScreen = segments[0] === 'auth';
    if (!session && !inAuthScreen) return;
    if (session && inAuthScreen) router.replace('/');
  }, [session, ready, segments]);

  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="auth" options={{ headerShown: false }} />
      <Stack.Screen name="couples" options={{ title: 'Couples Mode', headerBackTitle: 'Back' }} />
      <Stack.Screen name="singles" options={{ title: 'Singles Mode' }} />
      <Stack.Screen name="upload" options={{ title: 'Upload Photo' }} />
      <Stack.Screen name="admin" options={{ title: 'Admin Panel' }} />
      <Stack.Screen name="profile" options={{ title: 'My Profile', headerBackTitle: 'Back' }} />
    </Stack>
  );
}