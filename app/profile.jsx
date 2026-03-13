import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../supabase';

export default function ProfileScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [firstName, setFirstName] = useState('');
  const [couplePhotos, setCouplePhotos] = useState([]);
  const [singlePhotos, setSinglePhotos] = useState([]);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/auth');
      return;
    }

    setFirstName(user.user_metadata?.first_name || 'there');

    // Load user's couple photos with vote stats
    const { data: couples } = await supabase
      .from('couples')
      .select('*')
      .eq('uploaded_by', user.id)
      .order('created_at', { ascending: false });

    // Load user's single photos with vote stats
    const { data: singles } = await supabase
      .from('singles')
      .select('*')
      .eq('uploaded_by', user.id)
      .order('created_at', { ascending: false });

    // Load votes for each couple photo
    const couplesWithStats = await Promise.all(
      (couples || []).map(async (photo) => {
        const { data: votes } = await supabase
          .from('votes_couples')
          .select('settler_side')
          .eq('couple_id', photo.id);

        const total = votes?.length || 0;
        const leftVotes = votes?.filter(v => v.settler_side === 'left').length || 0;
        const rightVotes = votes?.filter(v => v.settler_side === 'right').length || 0;
        const leftPercent = total > 0 ? Math.round((leftVotes / total) * 100) : 0;
        const rightPercent = total > 0 ? Math.round((rightVotes / total) * 100) : 0;

        return { ...photo, total, leftPercent, rightPercent };
      })
    );

    // Load votes for each single photo
    const singlesWithStats = await Promise.all(
      (singles || []).map(async (photo) => {
        const { data: votesAsLeft } = await supabase
          .from('votes_singles')
          .select('hotter_side')
          .eq('left_single_id', photo.id);

        const { data: votesAsRight } = await supabase
          .from('votes_singles')
          .select('hotter_side')
          .eq('right_single_id', photo.id);

        const timesShown = (votesAsLeft?.length || 0) + (votesAsRight?.length || 0);
        const timesWon =
          (votesAsLeft?.filter(v => v.hotter_side === 'left').length || 0) +
          (votesAsRight?.filter(v => v.hotter_side === 'right').length || 0);
        const hotterPercent = timesShown > 0 ? Math.round((timesWon / timesShown) * 100) : 0;

        return { ...photo, timesShown, timesWon, hotterPercent };
      })
    );

    setCouplePhotos(couplesWithStats);
    setSinglePhotos(singlesWithStats);
    setLoading(false);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FF4B6E" />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'My Profile',
          headerBackVisible: false,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.replace('/')}>
              <Text style={styles.headerBackText}>← Back</Text>
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView contentContainerStyle={styles.container}>

      {/* Header */}
      <Text style={styles.title}>👋 Hey, {firstName}!</Text>
      <Text style={styles.subtitle}>Here's how your photos are performing</Text>

      {/* Couples Section */}
      <Text style={styles.sectionTitle}>💑 Couples Photos</Text>
      {couplePhotos.length === 0 ? (
        <Text style={styles.emptyText}>No couples photos uploaded yet</Text>
      ) : (
        couplePhotos.map(photo => (
          <View key={photo.id} style={styles.photoCard}>
            <Image source={{ uri: photo.image_url }} style={styles.photoImage} resizeMode="cover" />

            <View style={styles.statsContainer}>
              <Text style={styles.statsTitle}>📊 {photo.total} total votes</Text>

              {photo.total === 0 ? (
                <Text style={styles.noVotes}>No votes yet</Text>
              ) : (
                <>
                  <View style={styles.statRow}>
                    <View style={styles.statBox}>
                      <Text style={styles.statPercent}>{photo.leftPercent}%</Text>
                      <Text style={styles.statLabel}>Left settled</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statBox}>
                      <Text style={styles.statPercent}>{photo.rightPercent}%</Text>
                      <Text style={styles.statLabel}>Right settled</Text>
                    </View>
                  </View>
                  <View style={styles.barContainer}>
                    <View style={[styles.barLeft, { flex: photo.leftPercent || 1 }]} />
                    <View style={[styles.barRight, { flex: photo.rightPercent || 1 }]} />
                  </View>
                </>
              )}
            </View>

            <Text style={styles.uploadDate}>
              Uploaded {new Date(photo.created_at).toLocaleDateString()}
            </Text>
            <Text style={[styles.statusBadge,
              photo.status === 'approved' ? styles.approved :
              photo.status === 'rejected' ? styles.rejected : styles.pending]}>
              {photo.status === 'approved' ? '✅ Live' :
               photo.status === 'rejected' ? '❌ Rejected' : '⏳ Pending review'}
            </Text>
          </View>
        ))
      )}

      {/* Singles Section */}
      <Text style={styles.sectionTitle}>🔥 Singles Photos</Text>
      {singlePhotos.length === 0 ? (
        <Text style={styles.emptyText}>No singles photos uploaded yet</Text>
      ) : (
        singlePhotos.map(photo => (
          <View key={photo.id} style={styles.photoCard}>
            <Image source={{ uri: photo.image_url }} style={styles.photoImage} resizeMode="cover" />

            <View style={styles.statsContainer}>
              <Text style={styles.statsTitle}>📊 Shown {photo.timesShown} times</Text>

              {photo.timesShown === 0 ? (
                <Text style={styles.noVotes}>No votes yet</Text>
              ) : (
                <>
                  <View style={styles.statRow}>
                    <View style={styles.statBox}>
                      <Text style={styles.statPercent}>{photo.hotterPercent}%</Text>
                      <Text style={styles.statLabel}>Voted hotter</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statBox}>
                      <Text style={styles.statPercent}>{photo.timesWon}</Text>
                      <Text style={styles.statLabel}>Times won</Text>
                    </View>
                  </View>
                  <View style={styles.barContainer}>
                    <View style={[styles.barLeft, { flex: photo.hotterPercent || 1 }]} />
                    <View style={[styles.barRight, { flex: 100 - photo.hotterPercent || 1 }]} />
                  </View>
                </>
              )}
            </View>

            <Text style={styles.uploadDate}>
              Uploaded {new Date(photo.created_at).toLocaleDateString()}
            </Text>
            <Text style={[styles.statusBadge,
              photo.status === 'approved' ? styles.approved :
              photo.status === 'rejected' ? styles.rejected : styles.pending]}>
              {photo.status === 'approved' ? '✅ Live' :
               photo.status === 'rejected' ? '❌ Rejected' : '⏳ Pending review'}
            </Text>
          </View>
        ))
      )}

      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#fff', padding: 24, paddingTop: 60 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  headerBackText: { fontSize: 16, color: '#FF4B6E', fontWeight: 'bold' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#999', marginBottom: 32 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16, marginTop: 8 },
  photoCard: { marginBottom: 24, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#eee' },
  photoImage: { width: '100%', height: 250 },
  statsContainer: { padding: 16, backgroundColor: '#f9f9f9' },
  statsTitle: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 12, textAlign: 'center' },
  noVotes: { fontSize: 13, color: '#999', textAlign: 'center' },
  statRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  statBox: { flex: 1, alignItems: 'center' },
  statPercent: { fontSize: 28, fontWeight: 'bold', color: '#FF4B6E' },
  statLabel: { fontSize: 12, color: '#666', marginTop: 2 },
  statDivider: { width: 1, height: 50, backgroundColor: '#eee' },
  barContainer: { flexDirection: 'row', height: 8, borderRadius: 4, overflow: 'hidden' },
  barLeft: { backgroundColor: '#FF4B6E' },
  barRight: { backgroundColor: '#eee' },
  uploadDate: { padding: 12, fontSize: 12, color: '#999' },
  statusBadge: { paddingHorizontal: 12, paddingBottom: 12, fontSize: 12, fontWeight: 'bold' },
  approved: { color: '#34A853' },
  rejected: { color: '#EA4335' },
  pending: { color: '#FBBC05' },
  emptyText: { fontSize: 14, color: '#999', marginBottom: 16 },
});