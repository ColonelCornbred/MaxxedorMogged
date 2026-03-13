import * as ImagePicker from 'expo-image-picker';
import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../supabase';

type UploadMode = 'couples' | 'singles' | null;

export default function UploadScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<UploadMode>(null);
  const [image, setImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);

  const pickImage = async (source: 'camera' | 'library') => {
    let result;

    if (source === 'camera') {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission needed', 'Please allow camera access to take photos.');
        return;
      }
      result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });
    } else {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission needed', 'Please allow photo library access.');
        return;
      }
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });
    }

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handleUpload = async () => {
    if (!image) {
      Alert.alert('No photo', 'Please select a photo first.');
      return;
    }
    if (!mode) {
      Alert.alert('No mode', 'Please select Couples or Singles mode first.');
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      Alert.alert('Not logged in', 'Please log in before uploading.');
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    console.log('Upload user:', user?.id);
    console.log('Uploaded_by will be:', user?.id);

    setUploading(true);

    try {
      const bucket = mode === 'couples' ? 'couples' : 'singles';
      const fileExt = image.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;

      // Read file as arrayBuffer
      const response = await fetch(image);
      const arrayBuffer = await response.arrayBuffer();

      // Upload to Supabase storage
      const { error: storageError } = await supabase.storage
        .from(bucket)
        .upload(fileName, arrayBuffer, {
          contentType: `image/${fileExt}`,
          upsert: true
        });

      if (storageError) throw storageError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      // Save to database
      const { error: dbError } = await supabase
        .from(bucket)
        .insert({ image_url: publicUrl, uploaded_by: user?.id, status: 'pending' });

      if (dbError) throw dbError;

      Alert.alert('Success!', 'Your photo has been uploaded!', [
        { text: 'Upload another', onPress: () => { setImage(null); setMode(null); } },
        { text: 'Go home', onPress: () => router.push('/') }
      ]);

    } catch (error) {
  console.log('Full error:', JSON.stringify(error));
  Alert.alert('Upload failed', JSON.stringify(error));
}

    setUploading(false);
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Upload Photo',
          headerBackVisible: false,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.replace('/')}>
              <Text style={styles.headerBackText}>← Back</Text>
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView contentContainerStyle={styles.container}>

      <Text style={styles.title}>Upload a Photo</Text>

      {/* Mode Selector */}
      <Text style={styles.sectionLabel}>Select Mode</Text>
      <View style={styles.modeRow}>
        <TouchableOpacity
          style={[styles.modeButton, mode === 'couples' && styles.modeButtonActive]}
          onPress={() => setMode('couples')}>
          <Text style={[styles.modeText, mode === 'couples' && styles.modeTextActive]}>
            💑 Couples
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeButton, mode === 'singles' && styles.modeButtonActive]}
          onPress={() => setMode('singles')}>
          <Text style={[styles.modeText, mode === 'singles' && styles.modeTextActive]}>
            🔥 Singles
          </Text>
        </TouchableOpacity>
      </View>

      {/* Photo Selector */}
      <Text style={styles.sectionLabel}>Select Photo</Text>
      <View style={styles.photoRow}>
        <TouchableOpacity style={styles.photoButton} onPress={() => pickImage('camera')}>
          <Text style={styles.photoButtonText}>📷 Camera</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.photoButton} onPress={() => pickImage('library')}>
          <Text style={styles.photoButtonText}>🖼️ Camera Roll</Text>
        </TouchableOpacity>
      </View>

      {/* Preview */}
      {image && (
        <View style={styles.previewContainer}>
          <Text style={styles.sectionLabel}>Preview</Text>
          <Image source={{ uri: image }} style={styles.preview} resizeMode="cover" />
          <TouchableOpacity style={styles.removeButton} onPress={() => setImage(null)}>
            <Text style={styles.removeText}>Remove Photo</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Upload Button */}
      <TouchableOpacity
        style={[styles.uploadButton, uploading && styles.uploadButtonDisabled]}
        onPress={handleUpload}
        disabled={uploading}>
        {uploading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.uploadButtonText}>Upload Photo</Text>
        )}
      </TouchableOpacity>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#fff', padding: 24, paddingTop: 60 },
  headerBackText: { fontSize: 16, color: '#FF4B6E', fontWeight: 'bold' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 24, textAlign: 'center' },
  sectionLabel: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 12 },
  modeRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  modeButton: { flex: 1, padding: 16, borderRadius: 12, borderWidth: 2, borderColor: '#ddd', alignItems: 'center' },
  modeButtonActive: { borderColor: '#FF4B6E', backgroundColor: '#fff0f3' },
  modeText: { fontSize: 16, color: '#999', fontWeight: 'bold' },
  modeTextActive: { color: '#FF4B6E' },
  photoRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  photoButton: { flex: 1, padding: 16, borderRadius: 12, backgroundColor: '#f5f5f5', alignItems: 'center' },
  photoButtonText: { fontSize: 15, fontWeight: 'bold', color: '#333' },
  previewContainer: { marginBottom: 24 },
  preview: { width: '100%', height: 300, borderRadius: 16, marginBottom: 12 },
  removeButton: { alignItems: 'center' },
  removeText: { color: '#FF4B6E', fontSize: 14 },
  uploadButton: { backgroundColor: '#FF4B6E', padding: 18, borderRadius: 12, alignItems: 'center', marginBottom: 40 },
  uploadButtonDisabled: { backgroundColor: '#ffaabb' },
  uploadButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});