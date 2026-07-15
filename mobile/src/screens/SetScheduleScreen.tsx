import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Alert, ActivityIndicator, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SIZES, SHADOWS } from '../theme';
import api from '../services/api';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = [0, 15, 30, 45];

const PRESETS = [
  { label: '1× Daily', slots: [{ time: '08:00', label: 'Morning' }] },
  { label: '2× Daily', slots: [{ time: '08:00', label: 'Morning' }, { time: '20:00', label: 'Evening' }] },
  {
    label: '3× Daily', slots: [
      { time: '08:00', label: 'Morning' },
      { time: '14:00', label: 'Afternoon' },
      { time: '20:00', label: 'Evening' },
    ],
  },
];

interface TimeSlot {
  id: string;
  time: string;   // "HH:MM"
  label: string;
  notifyBefore: number;
}

const LABELS = ['Morning', 'Afternoon', 'Evening', 'Night'];

export default function SetScheduleScreen({ route, navigation }: any) {
  const { medicationId, medicationName, profileId, profileName } = route.params ?? {};

  const [slots, setSlots] = useState<TimeSlot[]>([
    { id: '1', time: '08:00', label: 'Morning', notifyBefore: 15 },
  ]);
  const [everyday, setEveryday] = useState(true);
  const [selectedDays, setSelectedDays] = useState<string[]>([...DAYS]);
  const [loading, setLoading] = useState(false);

  const applyPreset = (preset: typeof PRESETS[0]) => {
    setSlots(
      preset.slots.map((s, i) => ({
        id: String(i + 1),
        time: s.time,
        label: s.label,
        notifyBefore: 15,
      }))
    );
  };

  const addSlot = () => {
    const id = String(Date.now());
    setSlots((prev) => [...prev, { id, time: '12:00', label: 'Afternoon', notifyBefore: 15 }]);
  };

  const removeSlot = (id: string) => {
    if (slots.length === 1) {
      Alert.alert('Required', 'At least one time slot is required.');
      return;
    }
    setSlots((prev) => prev.filter((s) => s.id !== id));
  };

  const updateSlot = (id: string, field: keyof TimeSlot, value: any) => {
    setSlots((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  };

  const incrementTime = (id: string, direction: 1 | -1) => {
    setSlots((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const [h, m] = s.time.split(':').map(Number);
        let total = h * 60 + m + direction * 30;
        total = ((total % 1440) + 1440) % 1440;
        const nh = Math.floor(total / 60);
        const nm = total % 60;
        return { ...s, time: `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}` };
      })
    );
  };

  const toggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSave = async () => {
    if (slots.length === 0) {
      Alert.alert('Required', 'Add at least one time slot.');
      return;
    }
    if (!everyday && selectedDays.length === 0) {
      Alert.alert('Required', 'Select at least one day.');
      return;
    }
    const daysStr = everyday ? 'Everyday' : selectedDays.join(',');

    try {
      setLoading(true);
      for (const slot of slots) {
        await api.post(`/medications/${medicationId}/schedule`, {
          time_of_day: slot.time,
          days_of_week: daysStr,
          label: slot.label,
          notification_minutes_before: slot.notifyBefore,
        });
      }
      Alert.alert('✅ Done!', 'Medication schedule set successfully.', [
        {
          text: 'OK', onPress: () =>
            navigation.navigate('MainTabs', { profileId, profileName }),
        },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.detail ?? 'Failed to save schedule.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Set Schedule</Text>
          <Text style={styles.subtitle}>{medicationName}</Text>
        </View>

        {/* Presets */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Presets</Text>
          <View style={styles.presetRow}>
            {PRESETS.map((p) => (
              <TouchableOpacity
                key={p.label}
                style={styles.presetChip}
                onPress={() => applyPreset(p)}
              >
                <Text style={styles.presetChipText}>{p.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Time Slots */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⏰ Time Slots</Text>
          {slots.map((slot) => (
            <View key={slot.id} style={styles.slotCard}>
              {/* Time picker */}
              <View style={styles.timeRow}>
                <TouchableOpacity style={styles.timeBump} onPress={() => incrementTime(slot.id, -1)}>
                  <Text style={styles.timeBumpText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.timeDisplay}>{formatTime(slot.time)}</Text>
                <TouchableOpacity style={styles.timeBump} onPress={() => incrementTime(slot.id, 1)}>
                  <Text style={styles.timeBumpText}>+</Text>
                </TouchableOpacity>
              </View>

              {/* Label chips */}
              <View style={styles.labelRow}>
                {LABELS.map((lbl) => (
                  <TouchableOpacity
                    key={lbl}
                    style={[styles.labelChip, slot.label === lbl && styles.labelChipSelected]}
                    onPress={() => updateSlot(slot.id, 'label', lbl)}
                  >
                    <Text style={[styles.labelChipText, slot.label === lbl && styles.labelChipTextSelected]}>
                      {lbl}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Notify before */}
              <View style={styles.notifyRow}>
                <Text style={styles.notifyLabel}>🔔 Remind</Text>
                {[5, 10, 15, 30].map((min) => (
                  <TouchableOpacity
                    key={min}
                    style={[styles.notifyChip, slot.notifyBefore === min && styles.notifyChipSelected]}
                    onPress={() => updateSlot(slot.id, 'notifyBefore', min)}
                  >
                    <Text style={[styles.notifyChipText, slot.notifyBefore === min && styles.notifyChipTextSel]}>
                      {min}m
                    </Text>
                  </TouchableOpacity>
                ))}
                <Text style={styles.notifyLabel}>before</Text>
              </View>

              <TouchableOpacity style={styles.removeSlot} onPress={() => removeSlot(slot.id)}>
                <Text style={styles.removeSlotText}>Remove slot</Text>
              </TouchableOpacity>
            </View>
          ))}

          <TouchableOpacity style={styles.addSlotButton} onPress={addSlot}>
            <Text style={styles.addSlotText}>+ Add Another Time</Text>
          </TouchableOpacity>
        </View>

        {/* Days */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📅 Days</Text>
          <View style={styles.everydayRow}>
            <Text style={styles.everydayText}>Every day</Text>
            <Switch
              value={everyday}
              onValueChange={setEveryday}
              trackColor={{ true: COLORS.primary }}
            />
          </View>
          {!everyday && (
            <View style={styles.daysRow}>
              {DAYS.map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[styles.dayChip, selectedDays.includes(d) && styles.dayChipSelected]}
                  onPress={() => toggleDay(d)}
                >
                  <Text style={[styles.dayChipText, selectedDays.includes(d) && styles.dayChipTextSelected]}>
                    {d}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>📋 Summary</Text>
          <Text style={styles.summaryText}>
            {slots.length} dose{slots.length > 1 ? 's' : ''} per day at:{' '}
            {slots.map((s) => formatTime(s.time)).join(', ')}
          </Text>
          <Text style={styles.summaryText}>
            Days: {everyday ? 'Every day' : selectedDays.join(', ')}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, loading && { opacity: 0.7 }]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>✓ Save Schedule</Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function formatTime(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${period}`;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: SIZES.large },
  header: { marginBottom: SIZES.large },
  back: { marginBottom: SIZES.base },
  backText: { color: COLORS.primary, fontSize: SIZES.font, fontWeight: '600' },
  title: { fontSize: 26, fontWeight: '800', color: COLORS.text },
  subtitle: { fontSize: SIZES.font, color: COLORS.textLight, marginTop: 4 },

  section: {
    backgroundColor: COLORS.surface, borderRadius: SIZES.radius,
    padding: SIZES.large, marginBottom: SIZES.large, ...SHADOWS.light,
  },
  sectionTitle: { fontSize: SIZES.font, fontWeight: '800', color: COLORS.text, marginBottom: SIZES.medium },

  presetRow: { flexDirection: 'row', gap: SIZES.base },
  presetChip: {
    flex: 1, padding: SIZES.medium, borderRadius: SIZES.radius,
    backgroundColor: '#EFF3FF', alignItems: 'center',
    borderWidth: 1.5, borderColor: COLORS.primary,
  },
  presetChipText: { color: COLORS.primary, fontWeight: '700', fontSize: SIZES.small },

  slotCard: {
    backgroundColor: '#FAFBFF', borderRadius: SIZES.base,
    padding: SIZES.medium, marginBottom: SIZES.medium,
    borderWidth: 1, borderColor: '#E8ECF4',
  },
  timeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: SIZES.medium },
  timeBump: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  timeBumpText: { color: '#fff', fontSize: 22, fontWeight: '700' },
  timeDisplay: { fontSize: 28, fontWeight: '800', color: COLORS.text, marginHorizontal: SIZES.large },

  labelRow: { flexDirection: 'row', gap: 6, marginBottom: SIZES.base, flexWrap: 'wrap' },
  labelChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16,
    borderWidth: 1, borderColor: '#E0E0E0', backgroundColor: '#F8F9FA',
  },
  labelChipSelected: { borderColor: COLORS.primary, backgroundColor: '#EFF3FF' },
  labelChipText: { fontSize: SIZES.small, color: COLORS.textLight, fontWeight: '600' },
  labelChipTextSelected: { color: COLORS.primary },

  notifyRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: SIZES.base },
  notifyLabel: { fontSize: SIZES.small, color: COLORS.textLight },
  notifyChip: {
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12,
    borderWidth: 1, borderColor: '#E0E0E0', backgroundColor: '#F8F9FA',
  },
  notifyChipSelected: { borderColor: COLORS.primary, backgroundColor: '#EFF3FF' },
  notifyChipText: { fontSize: SIZES.small, color: COLORS.textLight, fontWeight: '600' },
  notifyChipTextSel: { color: COLORS.primary },

  removeSlot: { alignItems: 'flex-end' },
  removeSlotText: { color: COLORS.error, fontSize: SIZES.small, fontWeight: '600' },

  addSlotButton: {
    borderWidth: 1.5, borderColor: COLORS.primary, borderStyle: 'dashed',
    padding: SIZES.medium, borderRadius: SIZES.base, alignItems: 'center',
  },
  addSlotText: { color: COLORS.primary, fontWeight: '700' },

  everydayRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  everydayText: { fontSize: SIZES.font, fontWeight: '600', color: COLORS.text },
  daysRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: SIZES.medium },
  dayChip: {
    width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#E0E0E0', backgroundColor: '#F8F9FA',
  },
  dayChipSelected: { borderColor: COLORS.primary, backgroundColor: COLORS.primary },
  dayChipText: { fontSize: SIZES.small, fontWeight: '700', color: COLORS.textLight },
  dayChipTextSelected: { color: '#fff' },

  summaryCard: {
    backgroundColor: '#EFF3FF', borderRadius: SIZES.base, padding: SIZES.medium,
    marginBottom: SIZES.large, borderWidth: 1, borderColor: '#C7D2FE',
  },
  summaryTitle: { fontWeight: '700', color: COLORS.primary, marginBottom: 4 },
  summaryText: { fontSize: SIZES.small, color: COLORS.text, marginTop: 2 },

  saveButton: {
    backgroundColor: COLORS.primary, padding: SIZES.medium + 2,
    borderRadius: SIZES.radius, alignItems: 'center',
  },
  saveButtonText: { color: '#fff', fontSize: SIZES.font, fontWeight: '700' },
});
