import { Stack, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../supabase';
import { theme } from '../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function CouplesScreen() {
  const router = useRouter();
  const [couples, setCouples] = useState([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadCouples();
  }, []);

  const loadCouples = async () => {
    const { data, error } = await supabase
      .from('couples')
      .select('*')
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    if (error) {
      console.log('Error loading couples:', error);
    } else {
      setCouples(data);
    }
    setLoading(false);
  };

  const handleVote = async (side) => {
    if (couples.length === 0 || isAnimating) return;
    setIsAnimating(true);

    await supabase.from('votes_couples').insert({
      couple_id: couples[index].id,
      settler_side: side,
    });

    // Slide direction based on vote
    const slideDirection = side === 'left' ? -SCREEN_WIDTH : SCREEN_WIDTH;

    Animated.timing(slideAnim, {
      toValue: slideDirection,
      duration: 400,
      useNativeDriver: false,
    }).start(() => {
      slideAnim.setValue(0);
      setIsAnimating(false);
      if (index + 1 >= couples.length) {
        router.push('/');
      } else {
        setIndex(index + 1);
      }
    });
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.gold} />
      </View>
    );
  }

  if (couples.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>No couples uploaded yet!</Text>
      </View>
    );
  }

  const current = couples[index];

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Couples Mode',
          headerBackVisible: false,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.replace('/')}>
              <Text style={styles.headerBackText}>← Back</Text>
            </TouchableOpacity>
          ),
        }}
      />
      <View style={styles.container}>
        <Text style={styles.question}>Who settled?</Text>
        <Text style={styles.sub}>Tap the side of the person who settled</Text>

        <Animated.View style={[styles.cardContainer, { transform: [{ translateX: slideAnim }] }]}>
          <Image
            source={{ uri: current.image_url }}
            style={styles.photo}
            resizeMode="cover"
          />
        </Animated.View>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.voteButton, styles.leftButton]}
            onPress={() => handleVote('left')}
            disabled={isAnimating}>
            <Text style={styles.voteButtonLabel}>← They settled</Text>
            <Text style={styles.voteButtonSub}>Left person</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.voteButton, styles.rightButton]}
            onPress={() => handleVote('right')}
            disabled={isAnimating}>
            <Text style={styles.voteButtonLabel}>They settled →</Text>
            <Text style={styles.voteButtonSub}>Right person</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.progress}>{index + 1} of {couples.length}</Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.background, padding: 16 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.background },
  headerBackText: { fontSize: 16, color: theme.gold, fontWeight: 'bold' },
  question: { fontSize: 28, fontWeight: 'bold', marginBottom: 8, color: theme.white },
  sub: { fontSize: 14, color: theme.textSecondary, marginBottom: 20 },
  cardContainer: { width: '100%', borderRadius: 16, overflow: 'hidden', marginBottom: 24 },
  photo: { width: '100%', height: 400, borderRadius: 16 },
  buttonRow: { flexDirection: 'row', width: '100%', gap: 12, marginBottom: 12 },
  voteButton: { flex: 1, padding: 16, borderRadius: 12, alignItems: 'center' },
  leftButton: { backgroundColor: theme.purple },
  rightButton: { backgroundColor: theme.gold },
  voteButtonLabel: { color: theme.white, fontSize: 16, fontWeight: 'bold' },
  voteButtonSub: { color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 2 },
  progress: { fontSize: 12, color: theme.textMuted },
  emptyText: { fontSize: 18, color: theme.textSecondary },
});