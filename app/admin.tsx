import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../supabase';

const ADMIN_USER_ID = 'e9d53c78-e2f8-4018-ab46-df211e3f381a';

export default function AdminScreen() {
  const router = useRouter();
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<any>(null);
  const [processing, setProcessing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.id === ADMIN_USER_ID) {
      setIsAdmin(true);
      fetchPendingPhotos();
    } else {
      setLoading(false);
    }
  };

  const fetchPendingPhotos = async () => {
    setLoading(true);
    try {
      const { data: singlesData } = await supabase
        .from('singles')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      const { data: couplesData } = await supabase
        .from('couples')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      const singles = (singlesData || []).map(p => ({ ...p, bucket: 'singles' }));
      const couples = (couplesData || []).map(p => ({ ...p, bucket: 'couples' }));
      const all = [...singles, ...couples].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setPhotos(all);
    } catch (error) {
      console.error('Error fetching photos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleModerate = async (status: 'approved' | 'pending' | 'rejected') => {
  if (!selectedPhoto) return;
  setProcessing(true);

  try {
    const { error } = await supabase
      .from(selectedPhoto.bucket)
      .update({ status })
      .eq('id', selectedPhoto.id);

    if (error) {
      alert('Error: ' + error.message);
      return;
    }

    // Success - remove from list and close modal
    setPhotos(photos.filter(p => p.id !== selectedPhoto.id));
    setSelectedPhoto(null);
    
    const statusLabel = status === 'approved' ? 'Approved' : status === 'rejected' ? 'Rejected' : 'Marked pending';
    alert(statusLabel + '! ✓');

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    alert('Error: ' + message);
  } finally {
    setProcessing(false);
  }
};

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FF4B6E" />
      </View>
    );
  }

  if (!isAdmin) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Access denied.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Admin Panel</Text>
      <Text style={styles.subtitle}>
        {photos.length} photo{photos.length !== 1 ? 's' : ''} pending review
      </Text>

      {photos.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No photos pending review 🎉</Text>
        </View>
      ) : (
        <FlatList
          data={photos}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.photoItem}
              onPress={() => setSelectedPhoto(item)}>
              <Image source={{ uri: item.image_url }} style={styles.thumbnail} />
              <View style={styles.photoInfo}>
                <Text style={styles.photoBucket}>
                  {item.bucket === 'couples' ? '💑 Couples' : '🔥 Singles'}
                </Text>
                <Text style={styles.photoDate}>
                  {new Date(item.created_at).toLocaleString()}
                </Text>
                <Text style={styles.tapHint}>Tap to review</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Photo Review Modal */}
      <Modal
        visible={!!selectedPhoto}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedPhoto(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedPhoto && (
              <>
                <Text style={styles.modalBucket}>
                  {selectedPhoto.bucket === 'couples' ? '💑 Couples' : '🔥 Singles'}
                </Text>
                <Image
                  source={{ uri: selectedPhoto.image_url }}
                  style={styles.enlargedImage}
                  resizeMode="cover"
                />
                <Text style={styles.modalDate}>
                  {new Date(selectedPhoto.created_at).toLocaleString()}
                </Text>

                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.approveButton]}
                    onPress={() => handleModerate('approved')}
                    disabled={processing}>
                    <Text style={styles.buttonText}>✅ Approve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.rejectButton]}
                    onPress={() => handleModerate('rejected')}
                    disabled={processing}>
                    <Text style={styles.buttonText}>❌ Reject</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setSelectedPhoto(null)}>
                  <Text style={styles.closeText}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 24, paddingTop: 60 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  backButton: { marginBottom: 16 },
  backText: { fontSize: 16, color: '#FF4B6E', fontWeight: 'bold' },
  title: { fontSize: 32, fontWeight: 'bold', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#999', marginBottom: 24 },
  photoItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
  thumbnail: { width: 80, height: 80, borderRadius: 8, marginRight: 16 },
  photoInfo: { flex: 1 },
  photoBucket: { fontSize: 14, fontWeight: 'bold', color: '#FF4B6E', marginBottom: 4 },
  photoDate: { fontSize: 12, color: '#999', marginBottom: 4 },
  tapHint: { fontSize: 12, color: '#ccc' },
  emptyText: { fontSize: 16, color: '#999' },
  errorText: { fontSize: 18, color: '#999' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 16, padding: 20, width: '100%', alignItems: 'center' },
  modalBucket: { fontSize: 16, fontWeight: 'bold', color: '#FF4B6E', marginBottom: 12 },
  enlargedImage: { width: '100%', height: 300, borderRadius: 12, marginBottom: 12 },
  modalDate: { fontSize: 12, color: '#999', marginBottom: 20 },
  buttonRow: { flexDirection: 'row', gap: 12, width: '100%', marginBottom: 12 },
  actionButton: { flex: 1, padding: 16, borderRadius: 12, alignItems: 'center' },
  approveButton: { backgroundColor: '#34A853' },
  rejectButton: { backgroundColor: '#EA4335' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  closeButton: { padding: 12 },
  closeText: { fontSize: 14, color: '#999' },
});