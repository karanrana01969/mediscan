import React, {useState} from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, Alert, ActivityIndicator, Platform, KeyboardAvoidingView,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import DocumentPicker, {types} from 'react-native-document-picker';
import {COLORS, SIZES, SHADOWS} from '../theme';
import {prescriptionService, PrescriptionScanResult, ExtractedMedicine} from '../services/prescriptionService';

type Step = 'upload' | 'review' | 'name';

export default function AddPrescriptionScreen({route, navigation}: any) {
  const {profileId, profileName} = route.params ?? {};
  const [step, setStep] = useState<Step>('upload');
  const [scanning, setScanning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{uri: string; type: string; name: string} | null>(null);
  const [scanResult, setScanResult] = useState<PrescriptionScanResult | null>(null);
  const [rxName, setRxName] = useState('');

  const pickFile = async (source: 'camera' | 'gallery' | 'pdf') => {
    try {
      if (source === 'pdf') {
        const result = await DocumentPicker.pickSingle({type: [types.pdf]});
        setSelectedFile({uri: result.uri, type: result.type || 'application/pdf', name: result.name || 'prescription.pdf'});
      } else {
        const opts = {mediaType: 'photo' as const, quality: 0.85 as const};
        const cb = (response: any) => {
          if (response.didCancel || response.errorMessage) return;
          const asset = response.assets?.[0];
          if (asset) setSelectedFile({uri: asset.uri, type: asset.type || 'image/jpeg', name: asset.fileName || 'prescription.jpg'});
        };
        if (source === 'camera') launchCamera(opts, cb);
        else launchImageLibrary(opts, cb);
      }
    } catch (e: any) {
      if (!DocumentPicker.isCancel(e)) Alert.alert('Error', 'Could not open file picker.');
    }
  };

  const handleScan = async () => {
    if (!selectedFile) {
      Alert.alert('No file', 'Please select a prescription image or PDF.');
      return;
    }
    try {
      setScanning(true);
      const result = await prescriptionService.scan(selectedFile);
      setScanResult(result);
      // Auto-suggest a name
      if (result.doctor_name) {
        const dateStr = result.prescription_date ?? new Date().toISOString().slice(0, 7);
        setRxName(`${result.doctor_name} - ${dateStr}`);
      }
      setStep('review');
    } catch (err: any) {
      Alert.alert('Scan Failed', err.response?.data?.detail ?? 'Could not analyze prescription. Please try again.');
    } finally {
      setScanning(false);
    }
  };

  const handleSave = async () => {
    if (!rxName.trim()) {
      Alert.alert('Name required', 'Please give this prescription a name.');
      return;
    }
    try {
      setSaving(true);
      await prescriptionService.save(
        profileId,
        {
          name: rxName.trim(),
          doctor_name: scanResult?.doctor_name,
          prescription_date: scanResult?.prescription_date,
          ai_extracted_json: scanResult ? JSON.stringify(scanResult) : undefined,
        },
        selectedFile ?? undefined,
      );
      Alert.alert(
        '✅ Prescription Saved!',
        `"${rxName}" has been saved. You can now link medications to it when adding them.`,
        [{text: 'Done', onPress: () => navigation.goBack()}],
      );
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.detail ?? 'Failed to save prescription.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{flex: 1}} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => step === 'upload' ? navigation.goBack() : setStep(step === 'name' ? 'review' : 'upload')} style={styles.back}>
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Add Prescription</Text>
            <Text style={styles.subtitle}>For {profileName}</Text>
          </View>

          {/* Step indicators */}
          <View style={styles.steps}>
            {(['upload', 'review', 'name'] as Step[]).map((s, i) => (
              <React.Fragment key={s}>
                <View style={[styles.stepDot, step === s && styles.stepDotActive, ['review', 'name'].includes(step) && s === 'upload' && styles.stepDotDone]}>
                  <Text style={styles.stepNum}>{i + 1}</Text>
                </View>
                {i < 2 && <View style={[styles.stepLine, (step === 'review' && i === 0) || step === 'name' ? styles.stepLineDone : null]} />}
              </React.Fragment>
            ))}
          </View>
          <View style={styles.stepLabels}>
            <Text style={styles.stepLabel}>Upload</Text>
            <Text style={[styles.stepLabel, {marginLeft: 32}]}>Review</Text>
            <Text style={[styles.stepLabel, {marginLeft: 32}]}>Name & Save</Text>
          </View>

          {/* ── Step 1: Upload ── */}
          {step === 'upload' && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>📄 Upload Prescription</Text>
              <Text style={styles.cardSubtitle}>Take a photo, pick from gallery, or attach a PDF</Text>

              {selectedFile && (
                <View style={styles.fileBadge}>
                  <Text style={styles.fileBadgeText}>✅ {selectedFile.name}</Text>
                </View>
              )}

              <View style={styles.uploadGrid}>
                <UploadOption icon="📷" label="Camera" onPress={() => pickFile('camera')} />
                <UploadOption icon="🖼️" label="Gallery" onPress={() => pickFile('gallery')} />
                <UploadOption icon="📎" label="PDF File" onPress={() => pickFile('pdf')} />
              </View>

              <TouchableOpacity
                style={[styles.primaryBtn, (!selectedFile || scanning) && styles.primaryBtnDisabled]}
                onPress={handleScan}
                disabled={!selectedFile || scanning}
              >
                {scanning
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.primaryBtnText}>🔍 Analyze with AI →</Text>
                }
              </TouchableOpacity>
            </View>
          )}

          {/* ── Step 2: Review ── */}
          {step === 'review' && scanResult && (
            <View>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>✅ AI Extraction Result</Text>
                {scanResult.doctor_name && <Text style={styles.infoRow}>👨‍⚕️ Doctor: {scanResult.doctor_name}</Text>}
                {scanResult.prescription_date && <Text style={styles.infoRow}>📅 Date: {scanResult.prescription_date}</Text>}
                <Text style={styles.infoRow}>💊 {scanResult.medicines.length} medicine{scanResult.medicines.length !== 1 ? 's' : ''} found</Text>
              </View>

              {scanResult.medicines.map((med, i) => <MedicineCard key={i} med={med} index={i} />)}

              <TouchableOpacity style={styles.primaryBtn} onPress={() => setStep('name')}>
                <Text style={styles.primaryBtnText}>Looks Good → Name It</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryBtn} onPress={() => setStep('upload')}>
                <Text style={styles.secondaryBtnText}>↩ Re-upload</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── Step 3: Name & Save ── */}
          {step === 'name' && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>📝 Name this Prescription</Text>
              <Text style={styles.cardSubtitle}>Give it a memorable name so you can find it later</Text>
              <TextInput
                style={styles.nameInput}
                value={rxName}
                onChangeText={setRxName}
                placeholder='e.g. "Dr. Sharma - July 2026"'
                placeholderTextColor={COLORS.textLight}
              />
              <TouchableOpacity
                style={[styles.primaryBtn, saving && styles.primaryBtnDisabled]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>💾 Save Prescription</Text>}
              </TouchableOpacity>
            </View>
          )}

          <View style={{height: 32}} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function UploadOption({icon, label, onPress}: {icon: string; label: string; onPress: () => void}) {
  return (
    <TouchableOpacity style={styles.uploadOption} onPress={onPress}>
      <Text style={styles.uploadOptionIcon}>{icon}</Text>
      <Text style={styles.uploadOptionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function MedicineCard({med, index}: {med: ExtractedMedicine; index: number}) {
  return (
    <View style={styles.medCard}>
      <Text style={styles.medName}>{index + 1}. {med.name}</Text>
      {med.dosage && <Text style={styles.medInfo}>💊 {med.dosage}</Text>}
      {med.frequency && <Text style={styles.medInfo}>⏰ {med.frequency}</Text>}
      {med.duration_days && <Text style={styles.medInfo}>📅 {med.duration_days} days</Text>}
      {med.suggested_label && (
        <View style={styles.suggestedTag}>
          <Text style={styles.suggestedTagText}>Suggested: {med.suggested_label} • {med.suggested_times?.join(', ')} • {med.suggested_days}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: COLORS.background},
  scroll: {padding: SIZES.large},
  header: {marginBottom: SIZES.large},
  back: {marginBottom: SIZES.base},
  backText: {color: COLORS.primary, fontSize: SIZES.font, fontWeight: '600'},
  title: {fontSize: 26, fontWeight: '800', color: COLORS.text},
  subtitle: {fontSize: SIZES.font, color: COLORS.textLight, marginTop: 4},

  steps: {flexDirection: 'row', alignItems: 'center', marginBottom: 4},
  stepDot: {width: 28, height: 28, borderRadius: 14, backgroundColor: '#E8ECF4', alignItems: 'center', justifyContent: 'center'},
  stepDotActive: {backgroundColor: COLORS.primary},
  stepDotDone: {backgroundColor: COLORS.success},
  stepNum: {color: '#fff', fontWeight: '700', fontSize: 12},
  stepLine: {flex: 1, height: 2, backgroundColor: '#E8ECF4', marginHorizontal: 4},
  stepLineDone: {backgroundColor: COLORS.success},
  stepLabels: {flexDirection: 'row', marginBottom: SIZES.large},
  stepLabel: {fontSize: 10, color: COLORS.textLight, fontWeight: '600'},

  card: {backgroundColor: COLORS.surface, borderRadius: SIZES.radius, padding: SIZES.large, marginBottom: SIZES.medium, ...SHADOWS.medium},
  cardTitle: {fontSize: 18, fontWeight: '800', color: COLORS.text, marginBottom: 6},
  cardSubtitle: {fontSize: SIZES.small, color: COLORS.textLight, marginBottom: SIZES.medium},

  fileBadge: {backgroundColor: '#E8F8EE', borderRadius: 8, padding: 10, marginBottom: SIZES.medium, borderWidth: 1, borderColor: COLORS.success},
  fileBadgeText: {color: COLORS.success, fontWeight: '600', fontSize: SIZES.small},

  uploadGrid: {flexDirection: 'row', gap: SIZES.base, marginBottom: SIZES.medium},
  uploadOption: {flex: 1, backgroundColor: '#EFF3FF', borderRadius: SIZES.radius, padding: SIZES.medium, alignItems: 'center', borderWidth: 1.5, borderColor: COLORS.primary},
  uploadOptionIcon: {fontSize: 26, marginBottom: 4},
  uploadOptionLabel: {color: COLORS.primary, fontWeight: '700', fontSize: SIZES.small},

  primaryBtn: {backgroundColor: COLORS.primary, borderRadius: SIZES.radius, padding: SIZES.medium + 2, alignItems: 'center', marginTop: SIZES.base},
  primaryBtnDisabled: {backgroundColor: '#B0B8D1'},
  primaryBtnText: {color: '#fff', fontWeight: '700', fontSize: SIZES.font},
  secondaryBtn: {alignItems: 'center', padding: SIZES.medium, marginTop: 4},
  secondaryBtnText: {color: COLORS.primary, fontWeight: '600', fontSize: SIZES.font},

  infoRow: {fontSize: SIZES.font, color: COLORS.text, marginBottom: 6},

  medCard: {backgroundColor: COLORS.surface, borderRadius: SIZES.radius, padding: SIZES.medium, marginBottom: SIZES.base, ...SHADOWS.light, borderLeftWidth: 4, borderLeftColor: COLORS.primary},
  medName: {fontSize: SIZES.font, fontWeight: '800', color: COLORS.text, marginBottom: 6},
  medInfo: {fontSize: SIZES.small, color: COLORS.textLight, marginBottom: 4},
  suggestedTag: {backgroundColor: '#EFF3FF', borderRadius: 8, padding: 6, marginTop: 4},
  suggestedTagText: {fontSize: 11, color: COLORS.primary, fontWeight: '600'},

  nameInput: {borderWidth: 1.5, borderColor: '#E8ECF4', borderRadius: SIZES.base, padding: SIZES.medium, marginBottom: SIZES.medium, fontSize: SIZES.font, color: COLORS.text, backgroundColor: '#FAFBFF'},
});
