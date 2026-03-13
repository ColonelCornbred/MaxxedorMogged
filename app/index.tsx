import type { Session } from '@supabase/supabase-js';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../supabase';
import { theme } from '../theme';

export default function HomeScreen() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [firstName, setFirstName] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        setFirstName(session.user.user_metadata?.first_name || '');
      }
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        setFirstName(session.user.user_metadata?.first_name || '');
      }
    });
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setFirstName('');
  };

  return (
    <View style={styles.container}>

      {/* Background starbursts */}
      <LinearGradient
        colors={['rgba(123, 47, 190, 0.4)', 'transparent']}
        style={styles.starburstTopLeft}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <LinearGradient
        colors={['rgba(245, 166, 35, 0.35)', 'transparent']}
        style={styles.starburstTopRight}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
      <LinearGradient
        colors={['rgba(245, 166, 35, 0.25)', 'transparent']}
        style={styles.starburstMiddleLeft}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
      />
      <LinearGradient
        colors={['rgba(123, 47, 190, 0.3)', 'transparent']}
        style={styles.starburstMiddleRight}
        start={{ x: 1, y: 0.5 }}
        end={{ x: 0, y: 0.5 }}
      />
      <LinearGradient
        colors={['rgba(123, 47, 190, 0.35)', 'transparent']}
        style={styles.starburstBottomLeft}
        start={{ x: 0, y: 1 }}
        end={{ x: 1, y: 0 }}
      />
      <LinearGradient
        colors={['rgba(245, 166, 35, 0.3)', 'transparent']}
        style={styles.starburstBottomRight}
        start={{ x: 1, y: 1 }}
        end={{ x: 0, y: 0 }}
      />

      {/* Title */}
      <View style={styles.titleContainer}>
        <Text style={styles.titleReach}>Reach</Text>
        <Text style={styles.titleOr}> or </Text>
        <Text style={styles.titleSettle}>Settle</Text>
      </View>

      {/* Mode Buttons */}
      <View style={styles.modesContainer}>
        <TouchableOpacity
          style={styles.couplesButton}
          onPress={() => router.push('/couples')}>
          <Text style={styles.buttonEmoji}>💑</Text>
          <Text style={styles.buttonText}>Couples Mode</Text>
          <Text style={styles.buttonSub}>Who settled in this relationship?</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.singlesButton}
          onPress={() => router.push('/singles')}>
          <Text style={styles.buttonEmoji}>🔥</Text>
          <Text style={styles.buttonText}>Singles Mode</Text>
          <Text style={styles.buttonSub}>Who's the hotter one?</Text>
        </TouchableOpacity>

        {session && (
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={() => router.push('/upload')}>
            <Text style={styles.uploadText}>📷 Upload Photo</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Account Section */}
      <View style={styles.accountSection}>
        {session ? (
          <View style={styles.loggedInRow}>
            <TouchableOpacity onPress={() => router.push('/profile')}>
              <Text style={styles.welcomeText}>👋 Hey, {firstName || 'there'}!</Text>
              <Text style={styles.welcomeSub}>Tap to view your stats</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Text style={styles.logoutText}>Log Out</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.signInButton}
            onPress={() => router.push('/auth')}>
            <Text style={styles.signInText}>Sign In / Create Account</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Admin Button */}
      {session?.user?.id === 'e9d53c78-e2f8-4018-ab46-df211e3f381a' && (
        <TouchableOpacity
          style={styles.adminLink}
          onPress={() => router.push('/admin')}>
          <Text style={styles.adminText}>⚙️</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'space-between', backgroundColor: theme.background, padding: 24, paddingTop: 60, paddingBottom: 40 },

  // Starbursts
  starburstTopLeft: { position: 'absolute', top: -80, left: -80, width: 280, height: 280, borderRadius: 140 },
  starburstTopRight: { position: 'absolute', top: -60, right: -80, width: 240, height: 240, borderRadius: 120 },
  starburstMiddleLeft: { position: 'absolute', top: '35%', left: -100, width: 220, height: 220, borderRadius: 110 },
  starburstMiddleRight: { position: 'absolute', top: '45%', right: -100, width: 200, height: 200, borderRadius: 100 },
  starburstBottomLeft: { position: 'absolute', bottom: -60, left: -60, width: 220, height: 220, borderRadius: 110 },
  starburstBottomRight: { position: 'absolute', bottom: -80, right: -80, width: 260, height: 260, borderRadius: 130 },

  // Title
  titleContainer: { flexDirection: 'row', alignItems: 'center' },
  titleReach: { fontSize: 36, fontWeight: 'bold', color: theme.purple },
  titleOr: { fontSize: 28, fontWeight: '300', color: theme.textSecondary },
  titleSettle: { fontSize: 36, fontWeight: 'bold', color: theme.gold },

  // Mode buttons
  modesContainer: { width: '100%', alignItems: 'center', gap: 16 },
  couplesButton: { backgroundColor: theme.surface, padding: 20, borderRadius: 16, width: '100%', alignItems: 'center', borderLeftWidth: 4, borderLeftColor: theme.purple },
  singlesButton: { backgroundColor: theme.surface, padding: 20, borderRadius: 16, width: '100%', alignItems: 'center', borderLeftWidth: 4, borderLeftColor: theme.gold },
  buttonEmoji: { fontSize: 32, marginBottom: 4 },
  buttonText: { color: theme.white, fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  buttonSub: { color: theme.textSecondary, fontSize: 12 },
  uploadButton: { backgroundColor: 'transparent', borderWidth: 1, borderColor: theme.surfaceLight, padding: 14, borderRadius: 12, width: '100%', alignItems: 'center' },
  uploadText: { color: theme.textSecondary, fontSize: 15, fontWeight: 'bold' },

  // Account section
  accountSection: { width: '100%', borderTopWidth: 1, borderTopColor: theme.surfaceLight, paddingTop: 16 },
  loggedInRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' },
  welcomeText: { fontSize: 18, color: theme.gold, fontWeight: 'bold', textShadowColor: theme.gold, textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 10 },
  welcomeSub: { fontSize: 11, color: theme.textMuted, marginTop: 2 },
  logoutButton: { backgroundColor: theme.surface, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  logoutText: { fontSize: 13, color: theme.textSecondary, fontWeight: 'bold' },
  signInButton: { width: '100%', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: theme.gold, alignItems: 'center' },
  signInText: { color: theme.gold, fontSize: 15, fontWeight: 'bold' },

  // Admin
  adminLink: { position: 'absolute', bottom: 33, left: '60%', transform: [{ translateX: -12 }] },
  adminText: { fontSize: 24, color: theme.surfaceLight },
});