import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
  ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { COLORS, SIZES, SHADOWS } from '../theme';
import api from '../services/api';

export default function ScannerScreen({ route, navigation }: any) {
  const { profileId, profileName } = route.params ?? {};
  const [selectedImage, setSelectedImage] = useState<any>(null);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);

  const handleImagePicker = (type: 'camera' | 'gallery') => {
    const options = { mediaType: 'photo' as const };
    const callback = (response: any) => {
      if (response.didCancel || response.errorMessage) return;
      if (response.assets?.length > 0) setSelectedImage(response.assets[0]);
    };
    if (type === 'camera') launchCamera(options, callback);
    else launchImageLibrary(options, callback);
  };

  const handleAnalyze = async () => {
    if (!selectedImage) {
      Alert.alert('Select Image', 'Please take a photo or pick from gallery first.');
      return;
    }
    try {
      setScanning(true);
      const formData = new FormData();
      formData.append('file', {
        uri: selectedImage.uri,
        type: selectedImage.type || 'image/jpeg',
        name: selectedImage.fileName || 'scan.jpg',
      } as any);

      const res = await api.post('/scan/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setScanResult(res.data);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.detail ?? 'Failed to analyze image.');
    } finally {
      setScanning(false);
    }
  };

  const handleAddMedication = () => {
    // Navigate to AddMedication with prefilled data from scan
    navigation.navigate('AddMedication', {
      profileId,
      profileName,
      prefill: scanResult,
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>📷 Scan Medication</Text>
          <Text style={styles.subtitle}>For {profileName}</Text>
        </View>

        {/* Camera Options */}
        <View style={styles.card}>
          <Text style={styles.label}>Take a photo of the medication box or label</Text>

          {selectedImage && (
            <View style={styles.selectedBadge}>
              <Text style={styles.selectedText}>✅ Image selected: {selectedImage.fileName ?? 'photo'}</Text>
            </View>
          )}

          <View style={styles.photoRow}>
            <TouchableOpacity
              style={[styles.photoBtn, { marginRight: 8 }]}
              onPress={() => handleImagePicker('camera')}
              disabled={scanning}
            >
              <Text style={styles.photoBtnIcon}>📷</Text>
              <Text style={styles.photoBtnText}>Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.photoBtn}
              onPress={() => handleImagePicker('gallery')}
              disabled={scanning}
            >
              <Text style={styles.photoBtnIcon}>🖼️</Text>
              <Text style={styles.photoBtnText}>Gallery</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.analyzeBtn, (!selectedImage || scanning) && styles.analyzeBtnDisabled]}
            onPress={handleAnalyze}
            disabled={!selectedImage || scanning}
          >
            {scanning
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.analyzeBtnText}>🔍 Analyze with AI</Text>
            }
          </TouchableOpacity>
        </View>

        {/* Also allow manual */}
        <TouchableOpacity
          style={styles.manualBtn}
          onPress={() => navigation.navigate('AddMedication', { profileId, profileName })}
        >
          <Text style={styles.manualBtnText}>✏️ Add manually instead</Text>
        </TouchableOpacity>

        {/* Scan Result */}
        {scanResult && (
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>{scanResult.name}</Text>

            <ResultRow label="Purpose" value={scanResult.use_case} />
            <ResultRow label="Dosage" value={scanResult.dosage} />
            <ResultRow label="Side Effects" value={scanResult.side_effects} />

            <TouchableOpacity style={styles.saveBtn} onPress={handleAddMedication}>
              <Text style={styles.saveBtnText}>Use This → Add to Schedule</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.rescanBtn}
              onPress={() => { setScanResult(null); setSelectedImage(null); }}
            >
              <Text style={styles.rescanBtnText}>🔄 Scan Another</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function ResultRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <View style={styles.resultRow}>
      <Text style={styles.resultLabel}>{label}</Text>
      <Text style={styles.resultValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: SIZES.large },
  header: { marginBottom: SIZES.large },
  back: { marginBottom: SIZES.base },
  backText: { color: COLORS.primary, fontSize: SIZES.font, fontWeight: '600' },
  title: { fontSize: 26, fontWeight: '800', color: COLORS.text },
  subtitle: { fontSize: SIZES.font, color: COLORS.textLight, marginTop: 4 },

  card: {
    backgroundColor: COLORS.surface, borderRadius: SIZES.radius,
    padding: SIZES.large, marginBottom: SIZES.medium, ...SHADOWS.medium,
  },
  label: { fontSize: SIZES.font, color: COLORS.text, fontWeight: '600', marginBottom: SIZES.medium },
  selectedBadge: {
    backgroundColor: '#E8F8EE', borderRadius: SIZES.base, padding: SIZES.base,
    marginBottom: SIZES.medium, borderWidth: 1, borderColor: '#20BF55',
  },
  selectedText: { fontSize: SIZES.small, color: '#20BF55', fontWeight: '600' },
  photoRow: { flexDirection: 'row', marginBottom: SIZES.medium },
  photoBtn: {
    flex: 1, backgroundColor: '#EFF3FF', borderRadius: SIZES.radius, padding: SIZES.large,
    alignItems: 'center', borderWidth: 1.5, borderColor: COLORS.primary,
  },
  photoBtnIcon: { fontSize: 28, marginBottom: 4 },
  photoBtnText: { color: COLORS.primary, fontWeight: '700', fontSize: SIZES.small },
  analyzeBtn: {
    backgroundColor: COLORS.primary, padding: SIZES.medium + 2,
    borderRadius: SIZES.radius, alignItems: 'center',
  },
  analyzeBtnDisabled: { backgroundColor: '#B0B8D1' },
  analyzeBtnText: { color: '#fff', fontWeight: '700', fontSize: SIZES.font },

  manualBtn: { alignItems: 'center', paddingVertical: SIZES.medium },
  manualBtnText: { color: COLORS.primary, fontWeight: '600', fontSize: SIZES.font },

  resultCard: {
    backgroundColor: COLORS.surface, borderRadius: SIZES.radius,
    padding: SIZES.large, ...SHADOWS.medium, borderWidth: 2, borderColor: COLORS.primary,
  },
  resultTitle: {
    fontSize: 22, fontWeight: '800', color: COLORS.text, textAlign: 'center',
    marginBottom: SIZES.large,
  },
  resultRow: { marginBottom: SIZES.medium },
  resultLabel: { fontSize: SIZES.small, fontWeight: '700', color: COLORS.textLight, textTransform: 'uppercase' },
  resultValue: { fontSize: SIZES.font, color: COLORS.text, marginTop: 4 },
  saveBtn: {
    backgroundColor: COLORS.primary, padding: SIZES.medium + 2,
    borderRadius: SIZES.radius, alignItems: 'center', marginTop: SIZES.large,
  },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: SIZES.font },
  rescanBtn: { alignItems: 'center', marginTop: SIZES.medium, padding: SIZES.base },
  rescanBtnText: { color: COLORS.textLight, fontWeight: '600' },
});
