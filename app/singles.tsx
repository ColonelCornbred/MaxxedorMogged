import { Stack, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../supabase';
import { theme } from '../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GENDER_FILTERS = [
  { label: 'All', value: null },
  { label: 'Women', value: 'women' },
  { label: 'Men', value: 'men' },
  { label: 'Trans', value: 'trans' },
  { label: 'Nonbinary', value: 'nonbinary' },
];

type SinglePhoto = {
  id: string;
  image_url: string;
};

type SinglePair = {
  left: SinglePhoto;
  right: SinglePhoto;
};

type BurnCardProps = {
  side: 'left' | 'right';
  imageUrl: string;
  onVote: () => void;
  isBurning: boolean;
  isWinner: boolean;
};

function BurnCard({ side, imageUrl, onVote, isBurning, isWinner }: BurnCardProps) {
  const pushAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const winGlowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isBurning && !isWinner) {
      pushAnim.stopAnimation();
      scaleAnim.stopAnimation();
      opacityAnim.stopAnimation();
      winGlowAnim.stopAnimation();
      pushAnim.setValue(0);
      scaleAnim.setValue(1);
      opacityAnim.setValue(1);
      winGlowAnim.setValue(0);
    }
  }, [imageUrl, isBurning, isWinner, pushAnim, scaleAnim, opacityAnim, winGlowAnim]);

  useEffect(() => {
    if (isBurning) {
      const exitDirection = side === 'left' ? -SCREEN_WIDTH * 1.15 : SCREEN_WIDTH * 1.15;
      Animated.parallel([
        Animated.timing(pushAnim, {
          toValue: exitDirection,
          duration: 650,
          useNativeDriver: false,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.92,
          duration: 650,
          useNativeDriver: false,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 650,
          useNativeDriver: false,
        }),
      ]).start();
    }

    if (isWinner) {
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pushAnim, {
            toValue: side === 'left' ? 26 : -26,
            duration: 180,
            useNativeDriver: false,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1.05,
            duration: 180,
            useNativeDriver: false,
          }),
          Animated.timing(winGlowAnim, {
            toValue: 1,
            duration: 180,
            useNativeDriver: false,
          }),
        ]),
        Animated.parallel([
          Animated.timing(pushAnim, {
            toValue: 0,
            duration: 260,
            useNativeDriver: false,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 260,
            useNativeDriver: false,
          }),
          Animated.timing(winGlowAnim, {
            toValue: 0,
            duration: 420,
            useNativeDriver: false,
          }),
        ]),
      ]).start();
    }
  }, [isBurning, isWinner, side, pushAnim, scaleAnim, opacityAnim, winGlowAnim]);

  const losingBorderColor = opacityAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(0,0,0,0)', theme.surface],
  });

  const winBorder = winGlowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [theme.surface, theme.gold],
  });

  const cardTilt = pushAnim.interpolate({
    inputRange: [-SCREEN_WIDTH * 1.15, -26, 0, 26, SCREEN_WIDTH * 1.15],
    outputRange: ['-18deg', '-4deg', '0deg', '4deg', '18deg'],
  });

  return (
    <Animated.View
      style={[
        styles.card,
        {
          borderColor: isWinner ? winBorder : losingBorderColor,
          opacity: opacityAnim,
          transform: [{ translateX: pushAnim }, { rotate: cardTilt }, { scale: scaleAnim }],
        },
      ]}>
      <TouchableOpacity onPress={onVote} activeOpacity={0.9}>
        <Image source={{ uri: imageUrl }} style={styles.cardImage} resizeMode="cover" />
        <View style={styles.hotterButton}>
          <Text style={styles.hotterText}>🔥 Hotter</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function SinglesScreen() {
  const router = useRouter();
  const [pairs, setPairs] = useState<SinglePair[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedGender, setSelectedGender] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [burningCard, setBurningCard] = useState<'left' | 'right' | null>(null);
  const [winningCard, setWinningCard] = useState<'left' | 'right' | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    loadSingles();
  }, [selectedGender]);

  const loadSingles = async () => {
    setLoading(true);
    setIndex(0);
    setBurningCard(null);
    setWinningCard(null);

    let query = supabase
      .from('singles')
      .select('*')
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    if (selectedGender) {
      query = query.eq('gender', selectedGender);
    }

    const { data, error } = await query;

    if (error) {
      console.log('Error loading singles:', error);
      setLoading(false);
      return;
    }

    const pairedUp: SinglePair[] = [];
    for (let i = 0; i + 1 < data.length; i += 2) {
      pairedUp.push({ left: data[i], right: data[i + 1] });
    }
    setPairs(pairedUp);
    setLoading(false);
  };

  const handleVote = async (side: 'left' | 'right') => {
    if (pairs.length === 0 || isAnimating) return;
    setIsAnimating(true);

    const current = pairs[index];
    const losingCard = side === 'left' ? 'right' : 'left';

    setBurningCard(losingCard);
    setWinningCard(side);

    await supabase.from('votes_singles').insert({
      left_single_id: current.left.id,
      right_single_id: current.right.id,
      hotter_side: side,
    });

    // Wait for animation to finish
    setTimeout(() => {
      setBurningCard(null);
      setWinningCard(null);
      setIsAnimating(false);

      if (index + 1 >= pairs.length) {
        router.push('/');
      } else {
        setIndex(index + 1);
      }
    }, 1600);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.gold} />
      </View>
    );
  }

  const current = pairs[index];

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Singles Mode',
          headerBackVisible: false,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.replace('/')}>
              <Text style={styles.headerBackText}>← Back</Text>
            </TouchableOpacity>
          ),
        }}
      />
      <View style={styles.container}>
        <Text style={styles.question}>Who's hotter?</Text>

        {/* Gender Filter Dropdown */}
<View style={styles.dropdownContainer}>
  <TouchableOpacity
    style={styles.dropdown}
    onPress={() => setDropdownOpen(!dropdownOpen)}>
    <Text style={styles.dropdownText}>
      {selectedGender ? selectedGender.charAt(0).toUpperCase() + selectedGender.slice(1) : 'All'}
    </Text>
    <Text style={styles.dropdownArrow}>{dropdownOpen ? '▲' : '▼'}</Text>
  </TouchableOpacity>

  {dropdownOpen && (
    <View style={styles.dropdownMenu}>
      {GENDER_FILTERS.map(filter => (
        <TouchableOpacity
          key={filter.label}
          style={[styles.dropdownItem, selectedGender === filter.value && styles.dropdownItemActive]}
          onPress={() => {
            setSelectedGender(filter.value);
            setDropdownOpen(false);
          }}>
          <Text style={[styles.dropdownItemText, selectedGender === filter.value && styles.dropdownItemTextActive]}>
            {filter.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  )}
</View>

        {pairs.length === 0 ? (
          <View style={styles.centered}>
            <Text style={styles.emptyText}>
              No {selectedGender || ''} photos available yet!
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.sub}>Tap the hotter person</Text>
            <View style={styles.cardsRow}>
              <BurnCard
                side="left"
                key={current.left.id}
                imageUrl={current.left.image_url}
                onVote={() => handleVote('left')}
                isBurning={burningCard === 'left'}
                isWinner={winningCard === 'left'}
              />
              <BurnCard
                side="right"
                key={current.right.id}
                imageUrl={current.right.image_url}
                onVote={() => handleVote('right')}
                isBurning={burningCard === 'right'}
                isWinner={winningCard === 'right'}
              />
            </View>
            <Text style={styles.progress}>{index + 1} of {pairs.length}</Text>
          </>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', backgroundColor: theme.background, padding: 16, paddingTop: 24 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.background },
  headerBackText: { fontSize: 16, color: theme.gold, fontWeight: 'bold' },
  question: { fontSize: 28, fontWeight: 'bold', marginBottom: 16, color: theme.white },
  dropdownContainer: { width: '100%', marginBottom: 16, zIndex: 20 },
  dropdown: {
    width: '100%',
    minHeight: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.surfaceLight,
    backgroundColor: theme.surface,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownText: { fontSize: 14, color: theme.white, fontWeight: '600' },
  dropdownArrow: { fontSize: 12, color: theme.gold, fontWeight: 'bold' },
  dropdownMenu: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.surfaceLight,
    backgroundColor: theme.surface,
    overflow: 'hidden',
  },
  dropdownItem: { paddingHorizontal: 12, paddingVertical: 10 },
  dropdownItemActive: { backgroundColor: theme.background },
  dropdownItemText: { fontSize: 14, color: theme.textSecondary },
  dropdownItemTextActive: { color: theme.gold, fontWeight: '600' },
  sub: { fontSize: 14, color: theme.textSecondary, marginBottom: 16 },
  cardsRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', gap: 12 },
  card: { flex: 1, borderRadius: 16, overflow: 'hidden', backgroundColor: theme.surface, borderWidth: 2, borderColor: theme.surface },
  cardImage: { width: '100%', height: 380 },
  hotterButton: { backgroundColor: theme.purple, padding: 12, alignItems: 'center' },
  hotterText: { color: theme.white, fontWeight: 'bold', fontSize: 16 },
  progress: { fontSize: 12, color: theme.textMuted, marginTop: 16 },
  emptyText: { fontSize: 18, color: theme.textSecondary, textAlign: 'center' },
});