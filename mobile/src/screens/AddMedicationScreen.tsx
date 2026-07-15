import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SIZES, SHADOWS } from '../theme';
import api from '../services/api';

interface MedicationForm {
  name: string;
  use_case: string;
  dosage: string;
  side_effects: string;
  doctor_notes: string;
  total_pills: string;
  duration_days: string;
  pill_color: string;
  pill_shape: string;
}

const PILL_COLORS = ['White', 'Yellow', 'Pink', 'Blue', 'Green', 'Orange', 'Red', 'Purple'];
const PILL_SHAPES = ['Round', 'Oval', 'Capsule', 'Rectangle', 'Triangle'];

export default function AddMedicationScreen({ route, navigation }: any) {
  const { profileId, profileName, prefill } = route.params ?? {};

  const [form, setForm] = useState<MedicationForm>({
    name: prefill?.name ?? '',
    use_case: prefill?.use_case ?? '',
    dosage: prefill?.dosage ?? '',
    side_effects: prefill?.side_effects ?? '',
    doctor_notes: '',
    total_pills: '',
    duration_days: '',
    pill_color: '',
    pill_shape: '',
  });
  const [loading, setLoading] = useState(false);
  const [interactionWarning, setInteractionWarning] = useState<string | null>(null);

  const update = (key: keyof MedicationForm) => (val: string) =>
    setForm((f) => ({ ...f, [key]: val }));

  const checkInteraction = async () => {
    if (!form.name.trim()) return;
    try {
      const res = await api.post(`/scan/interaction/${profileId}`, {
        new_medicine: form.name,
      });
      if (res.data.warning) {
        setInteractionWarning(res.data.message);
      } else {
        setInteractionWarning(null);
      }
    } catch { /* silent */ }
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      Alert.alert('Required', 'Please enter the medication name.');
      return;
    }
    try {
      setLoading(true);
      const payload = {
        name: form.name.trim(),
        use_case: form.use_case.trim() || null,
        dosage: form.dosage.trim() || null,
        side_effects: form.side_effects.trim() || null,
        doctor_notes: form.doctor_notes.trim() || null,
        total_pills: form.total_pills ? parseInt(form.total_pills) : null,
        duration_days: form.duration_days ? parseInt(form.duration_days) : null,
        pill_color: form.pill_color || null,
        pill_shape: form.pill_shape || null,
      };

      const res = await api.post(`/medications/${profileId}`, payload);
      const newMed = res.data;

      // Navigate to schedule setup
      navigation.replace('SetSchedule', {
        medicationId: newMed.id,
        medicationName: newMed.name,
        profileId,
        profileName,
      });
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.detail ?? 'Failed to save medication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Add Medication</Text>
            <Text style={styles.subtitle}>For {profileName}</Text>
          </View>

          {/* Interaction Warning */}
          {interactionWarning && (
            <View style={styles.warningCard}>
              <Text style={styles.warningIcon}>⚠️</Text>
              <Text style={styles.warningText}>{interactionWarning}</Text>
            </View>
          )}

          {/* Basic Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Medication Info</Text>

            <Text style={styles.label}>Medication Name *</Text>
            <TextInput
              style={styles.input}
              value={form.name}
              onChangeText={update('name')}
              placeholder="e.g. Metformin"
              placeholderTextColor={COLORS.textLight}
              onBlur={checkInteraction}
            />

            <Text style={styles.label}>Purpose / Use Case</Text>
            <TextInput
              style={styles.input}
              value={form.use_case}
              onChangeText={update('use_case')}
              placeholder="e.g. Blood sugar control"
              placeholderTextColor={COLORS.textLight}
            />

            <Text style={styles.label}>Dosage Instructions</Text>
            <TextInput
              style={styles.input}
              value={form.dosage}
              onChangeText={update('dosage')}
              placeholder="e.g. 500mg twice daily"
              placeholderTextColor={COLORS.textLight}
            />

            <Text style={styles.label}>Side Effects</Text>
            <TextInput
              style={[styles.input, styles.multiline]}
              value={form.side_effects}
              onChangeText={update('side_effects')}
              placeholder="Known side effects..."
              placeholderTextColor={COLORS.textLight}
              multiline
              numberOfLines={3}
            />

            <Text style={styles.label}>Doctor's Notes</Text>
            <TextInput
              style={[styles.input, styles.multiline]}
              value={form.doctor_notes}
              onChangeText={update('doctor_notes')}
              placeholder="Any special instructions from doctor..."
              placeholderTextColor={COLORS.textLight}
              multiline
              numberOfLines={2}
            />
          </View>

          {/* Inventory */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📦 Inventory</Text>
            <View style={styles.row}>
              <View style={styles.halfField}>
                <Text style={styles.label}>Total Pills</Text>
                <TextInput
                  style={styles.input}
                  value={form.total_pills}
                  onChangeText={update('total_pills')}
                  placeholder="e.g. 60"
                  placeholderTextColor={COLORS.textLight}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.halfField}>
                <Text style={styles.label}>Treatment Days</Text>
                <TextInput
                  style={styles.input}
                  value={form.duration_days}
                  onChangeText={update('duration_days')}
                  placeholder="e.g. 30"
                  placeholderTextColor={COLORS.textLight}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>

          {/* Pill Appearance */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💊 Pill Appearance</Text>
            <Text style={styles.label}>Color</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
              {PILL_COLORS.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.chip, form.pill_color === c && styles.chipSelected]}
                  onPress={() => update('pill_color')(form.pill_color === c ? '' : c)}
                >
                  <Text style={[styles.chipText, form.pill_color === c && styles.chipTextSelected]}>
                    {c}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={[styles.label, { marginTop: SIZES.medium }]}>Shape</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
              {PILL_SHAPES.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.chip, form.pill_shape === s && styles.chipSelected]}
                  onPress={() => update('pill_shape')(form.pill_shape === s ? '' : s)}
                >
                  <Text style={[styles.chipText, form.pill_shape === s && styles.chipTextSelected]}>
                    {s}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Save */}
          <TouchableOpacity
            style={[styles.saveButton, loading && { opacity: 0.7 }]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Save & Set Schedule →</Text>
            )}
          </TouchableOpacity>

          <View style={{ height: 32 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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

  warningCard: {
    backgroundColor: '#FFF8E6',
    borderRadius: SIZES.base,
    padding: SIZES.medium,
    marginBottom: SIZES.large,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#FFCC00',
  },
  warningIcon: { fontSize: 20, marginRight: SIZES.base },
  warningText: { flex: 1, fontSize: SIZES.small, color: '#7D5A00' },

  section: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius,
    padding: SIZES.large,
    marginBottom: SIZES.large,
    ...SHADOWS.light,
  },
  sectionTitle: {
    fontSize: SIZES.font,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: SIZES.medium,
  },
  label: {
    fontSize: SIZES.small,
    fontWeight: '700',
    color: COLORS.textLight,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#E8ECF4',
    borderRadius: SIZES.base,
    padding: SIZES.medium,
    marginBottom: SIZES.medium,
    fontSize: SIZES.font,
    color: COLORS.text,
    backgroundColor: '#FAFBFF',
  },
  multiline: { height: 80, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: SIZES.base },
  halfField: { flex: 1 },

  chipRow: { marginBottom: SIZES.base },
  chip: {
    paddingHorizontal: SIZES.medium,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    marginRight: 8,
    backgroundColor: '#FAFBFF',
  },
  chipSelected: { borderColor: COLORS.primary, backgroundColor: '#EFF3FF' },
  chipText: { fontSize: SIZES.small, color: COLORS.textLight, fontWeight: '600' },
  chipTextSelected: { color: COLORS.primary },

  saveButton: {
    backgroundColor: COLORS.primary,
    padding: SIZES.medium + 2,
    borderRadius: SIZES.radius,
    alignItems: 'center',
  },
  saveButtonText: { color: '#fff', fontSize: SIZES.font, fontWeight: '700' },
});
