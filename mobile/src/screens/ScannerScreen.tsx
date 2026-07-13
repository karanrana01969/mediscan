import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, TextInput, ScrollView, Alert } from 'react-native';
import { COLORS, SIZES, SHADOWS } from '../theme';
import api from '../services/api';

export default function ScannerScreen({ route, navigation }: any) {
  const { profileId, profileName } = route.params || { profileId: 1, profileName: 'Test Profile' };
  const [ocrText, setOcrText] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);

  const handleAnalyze = async () => {
    if (!ocrText.trim()) return;
    try {
      setScanning(true);
      const res = await api.post('/scan/', { ocr_text: ocrText });
      setScanResult(res.data);
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.detail || "Failed to analyze medication.");
    } finally {
      setScanning(false);
    }
  };

  const saveMedication = async () => {
    if (!scanResult) return;
    try {
      setScanning(true);
      await api.post(`/medications/${profileId}`, {
        name: scanResult.name,
        use_case: scanResult.use_case,
        dosage: scanResult.dosage,
        side_effects: scanResult.side_effects,
        total_pills: 30
      });
      Alert.alert("Success", "Medication saved!");
      navigation.navigate('Schedule', { profileId, profileName });
    } catch (err: any) {
      Alert.alert("Error", "Failed to save medication.");
    } finally {
      setScanning(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Scanner</Text>
        <Text style={styles.subtitle}>Scanning for {profileName}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Simulate OCR Text</Text>
        <TextInput 
          style={styles.input}
          value={ocrText}
          onChangeText={setOcrText}
          placeholder="e.g. Aspirin 500mg"
          placeholderTextColor={COLORS.textLight}
        />
        <TouchableOpacity style={styles.button} onPress={handleAnalyze} disabled={scanning}>
          {scanning ? <ActivityIndicator color={COLORS.surface} /> : <Text style={styles.buttonText}>Analyze Medication</Text>}
        </TouchableOpacity>
      </View>

      {scanResult && (
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>{scanResult.name}</Text>
          <Text style={styles.resultLabel}>Use Case:</Text>
          <Text style={styles.resultText}>{scanResult.use_case}</Text>
          
          <Text style={styles.resultLabel}>Dosage:</Text>
          <Text style={styles.resultText}>{scanResult.dosage}</Text>
          
          <Text style={styles.resultLabel}>Side Effects:</Text>
          <Text style={styles.resultText}>{scanResult.side_effects}</Text>
          
          <Text style={styles.resultLabel}>Warnings:</Text>
          <Text style={styles.resultText}>{scanResult.warnings}</Text>

          <TouchableOpacity style={styles.saveButton} onPress={saveMedication} disabled={scanning}>
            <Text style={styles.buttonText}>Save Medication</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: COLORS.background, padding: SIZES.large, paddingTop: 60 },
  header: { marginBottom: SIZES.large },
  title: { fontSize: SIZES.extraLarge, fontWeight: 'bold', color: COLORS.primary },
  subtitle: { fontSize: SIZES.font, color: COLORS.textLight, marginTop: 4 },
  card: { backgroundColor: COLORS.surface, padding: SIZES.large, borderRadius: SIZES.radius, marginBottom: SIZES.large, ...SHADOWS.medium },
  label: { fontSize: SIZES.small, fontWeight: '600', color: COLORS.text, marginBottom: SIZES.base, textTransform: 'uppercase' },
  input: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: SIZES.base, padding: SIZES.medium, marginBottom: SIZES.large, fontSize: SIZES.font, color: COLORS.text },
  button: { backgroundColor: COLORS.primary, padding: SIZES.medium, borderRadius: SIZES.radius, alignItems: 'center' },
  buttonText: { color: COLORS.surface, fontSize: SIZES.font, fontWeight: 'bold' },
  resultCard: { backgroundColor: COLORS.secondary, padding: SIZES.large, borderRadius: SIZES.radius, ...SHADOWS.medium },
  resultTitle: { fontSize: SIZES.large, fontWeight: 'bold', color: COLORS.text, marginBottom: SIZES.medium, textAlign: 'center' },
  resultLabel: { fontSize: SIZES.small, fontWeight: 'bold', color: COLORS.text, marginTop: SIZES.base },
  resultText: { fontSize: SIZES.font, color: COLORS.textLight, marginBottom: SIZES.base },
  saveButton: { backgroundColor: COLORS.success, padding: SIZES.medium, borderRadius: SIZES.radius, alignItems: 'center', marginTop: SIZES.large },
});
