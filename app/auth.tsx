import * as AppleAuthentication from 'expo-apple-authentication';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../supabase';

WebBrowser.maybeCompleteAuthSession();

const GENDERS = ['Man', 'Woman', 'Trans', 'Nonbinary'];

export default function AuthScreen() {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [appleAvailable, setAppleAvailable] = useState(false);

  useEffect(() => {
    AppleAuthentication.isAvailableAsync().then(setAppleAvailable);
  }, []);

  const handleEmailAuth = async () => {
    setLoading(true);
    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) Alert.alert('Error', error.message);
    } else {
      if (!firstName.trim()) {
        Alert.alert('Error', 'Please enter your first name');
        setLoading(false);
        return;
      }
      if (!age || isNaN(Number(age)) || Number(age) < 18 || Number(age) > 100) {
        Alert.alert('Error', 'Please enter a valid age (18+)');
        setLoading(false);
        return;
      }
      if (!gender) {
        Alert.alert('Error', 'Please select your gender');
        setLoading(false);
        return;
      }
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            age: Number(age),
            gender: gender.toLowerCase(),
          }
        }
      });
      if (error) Alert.alert('Error', error.message);
      else Alert.alert('Success', 'Check your email to confirm your account!');
    }
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
  try {
    const redirectUrl = 'reachorsettle://auth/callback';
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { 
        redirectTo: redirectUrl,
        skipBrowserRedirect: true 
      }
    });
    if (error) throw error;
    if (!data?.url) throw new Error('Missing OAuth URL from Supabase.');
    
    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
    
    if (result.type === 'success') {
      // Supabase can return tokens in URL hash, convert it to query format for URLSearchParams.
      const normalizedUrl = result.url.includes('#')
        ? result.url.replace('#', '?')
        : result.url;
      const url = new URL(normalizedUrl);
      const access_token = url.searchParams.get('access_token') ?? '';
      const refresh_token = url.searchParams.get('refresh_token') ?? '';
      if (access_token) {
        await supabase.auth.setSession({ access_token, refresh_token });
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    Alert.alert('Error', message);
  }
};

  const handleAppleSignIn = async () => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken ?? ''
      });
      if (error) Alert.alert('Error', error.message);
    } catch (error) {
      if (error instanceof Error && error.message !== 'ERR_REQUEST_CANCELED') {
        Alert.alert('Error', error.message);
      }
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>ReachOrSettle</Text>
        <Text style={styles.subtitle}>{isLogin ? 'Welcome back!' : 'Create an account'}</Text>

        {/* Google Button */}
        <TouchableOpacity style={styles.googleButton} onPress={handleGoogleSignIn}>
  <View style={styles.googleButtonInner}>
    <View style={styles.googleIconCircle}>
      <Image
        source={{ uri: 'https://www.gstatic.com/images/branding/product/1x/googleg_32dp.png' }}
        style={styles.googleIconImage}
        resizeMode="contain"
      />
    </View>
    <Text style={styles.googleButtonText}>Continue with Google</Text>
  </View>
</TouchableOpacity>

        {/* Apple Button */}
        {appleAvailable && (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
            cornerRadius={12}
            style={styles.appleButton}
            onPress={handleAppleSignIn}
          />
        )}

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Sign Up Fields */}
        {!isLogin && (
          <>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>First Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your first name"
                value={firstName}
                onChangeText={setFirstName}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Age (must be 18+)</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your age"
                value={age}
                onChangeText={setAge}
                keyboardType="number-pad"
                maxLength={3}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Gender</Text>
              <View style={styles.genderRow}>
                {GENDERS.map(g => (
                  <TouchableOpacity
                    key={g}
                    style={[styles.genderButton, gender === g.toLowerCase() && styles.genderButtonActive]}
                    onPress={() => setGender(g.toLowerCase())}>
                    <Text style={[styles.genderText, gender === g.toLowerCase() && styles.genderTextActive]}>
                      {g}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </>
        )}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your password (min 6 characters)"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleEmailAuth}
          disabled={loading}>
          <Text style={styles.buttonText}>
            {loading ? 'Please wait...' : isLogin ? 'Log In' : 'Sign Up'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
          <Text style={styles.switchText}>
            {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Log In'}
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 24, paddingTop: 60 },
  backButton: { alignSelf: 'flex-start', marginBottom: 16 },
  backText: { fontSize: 16, color: '#FF4B6E', fontWeight: 'bold' },
  title: { fontSize: 32, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#999', marginBottom: 24 },
  googleButton: { width: '100%', height: 52, paddingHorizontal: 16, borderRadius: 12, borderWidth: 2, borderColor: '#ddd', alignItems: 'center', justifyContent: 'center', marginBottom: 12, backgroundColor: '#fff' },
  googleButtonInner: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  googleIconCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  googleIconImage: { width: 20, height: 20 },
  googleButtonText: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  appleButton: { width: '100%', height: 52, marginBottom: 12 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', width: '100%', marginVertical: 16 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#eee' },
  dividerText: { marginHorizontal: 12, color: '#999', fontSize: 14 },
  inputGroup: { width: '100%', marginBottom: 16 },
  label: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 6 },
  input: { width: '100%', borderWidth: 1, borderColor: '#ddd', borderRadius: 12, padding: 16, fontSize: 16 },
  genderRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  genderButton: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 2, borderColor: '#ddd' },
  genderButtonActive: { borderColor: '#FF4B6E', backgroundColor: '#fff0f3' },
  genderText: { fontSize: 14, color: '#999', fontWeight: 'bold' },
  genderTextActive: { color: '#FF4B6E' },
  button: { backgroundColor: '#FF4B6E', padding: 18, borderRadius: 12, width: '100%', alignItems: 'center', marginBottom: 16, marginTop: 8 },
  buttonDisabled: { backgroundColor: '#ffaabb' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  switchText: { color: '#FF4B6E', fontSize: 14 },
});