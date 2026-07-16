import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Modal, TextInput, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SIZES, SHADOWS } from '../theme';
import api from '../services/api';

interface Log {
  id: number;
  status: 'taken' | 'missed' | 'skipped';
  logged_at: string;
  scheduled_at: string | null;
  notes: string | null;
}

interface RestockLog {
  id: number;
  pills_added: number;
  new_total: number;
  restocked_at: string;
  notes: string | null;
}

interface Schedule {
  id: number;
  time_of_day: string;
  days_of_week: string;
  label: string | null;
}

interface Medication {
  id: number;
  name: string;
  use_case: string | null;
  dosage: string | null;
  side_effects: string | null;
  doctor_notes: string | null;
  total_pills: number | null;
  remaining_pills: number | null;
  duration_days: number | null;
  pill_color: string | null;
  pill_shape: string | null;
  low_stock_threshold: number;
  is_active: boolean;
  days_remaining: number | null;
  schedules: Schedule[];
  prescription_name?: string | null;
}

export default function MedicationDetailScreen({ route, navigation }: any) {
  const { medicationId, profileId, profileName } = route.params ?? {};

  const [med, setMed] = useState<Medication | null>(null);
  const [logs, setLogs] = useState<Log[]>([]);
  const [restockLogs, setRestockLogs] = useState<RestockLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [restockModal, setRestockModal] = useState(false);
  const [restockCount, setRestockCount] = useState('');
  const [restockNotes, setRestockNotes] = useState('');
  const [restocking, setRestocking] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'history' | 'restock'>('info');

  const fetchAll = useCallback(async () => {
    try {
      const [medRes, logsRes, restockRes] = await Promise.all([
        api.get(`/medications/detail/${medicationId}`),
        api.get(`/history/${medicationId}/logs?limit=30`),
        api.get(`/history/${medicationId}/restock`),
      ]);
      setMed(medRes.data);
      setLogs(logsRes.data);
      setRestockLogs(restockRes.data);
    } catch (err) {
      Alert.alert('Error', 'Could not load medication details.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [medicationId]);

  useEffect(() => { fetchAll(); }, []);

  const handleRestock = async () => {
    if (!restockCount || parseInt(restockCount) <= 0) {
      Alert.alert('Required', 'Enter a valid pill count.');
      return;
    }
    try {
      setRestocking(true);
      await api.post(`/medications/restock/${medicationId}`, {
        pills_added: parseInt(restockCount),
        notes: restockNotes.trim() || null,
      });
      setRestockModal(false);
      setRestockCount('');
      setRestockNotes('');
      fetchAll();
    } catch {
      Alert.alert('Error', 'Restock failed.');
    } finally {
      setRestocking(false);
    }
  };

  const handleDeactivate = () => {
    Alert.alert(
      'Remove Medication',
      `Are you sure you want to remove ${med?.name}? History will be kept.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await api.delete(`/medications/detail/${medicationId}`);
            navigation.goBack();
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!med) return null;

  const stockPercent = med.total_pills && med.remaining_pills != null
    ? Math.max(0, Math.min(1, med.remaining_pills / med.total_pills))
    : null;

  const isLowStock = med.days_remaining != null && med.days_remaining <= med.low_stock_threshold;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAll(); }} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.medName}>{med.name}</Text>
            {med.pill_color && med.pill_shape && (
              <Text style={styles.pillDesc}>{med.pill_color} · {med.pill_shape}</Text>
            )}
          </View>
          <TouchableOpacity onPress={handleDeactivate}>
            <Text style={styles.deleteIcon}>🗑</Text>
          </TouchableOpacity>
        </View>

        {/* Inventory Card */}
        <View style={[styles.stockCard, isLowStock && styles.stockCardLow]}>
          <View style={styles.stockRow}>
            <View>
              <Text style={styles.stockLabel}>Remaining Pills</Text>
              <Text style={[styles.stockCount, isLowStock && { color: '#EF233C' }]}>
                {med.remaining_pills ?? '—'}
              </Text>
            </View>
            <View style={styles.stockRight}>
              {med.days_remaining != null && (
                <Text style={[styles.daysLeft, isLowStock && { color: '#EF233C' }]}>
                  {isLowStock ? '⚠️ ' : '✅ '}
                  {med.days_remaining} days left
                </Text>
              )}
              <TouchableOpacity style={styles.restockBtn} onPress={() => setRestockModal(true)}>
                <Text style={styles.restockBtnText}>+ Restock</Text>
              </TouchableOpacity>
            </View>
          </View>
          {stockPercent !== null && (
            <View style={styles.stockBar}>
              <View style={[
                styles.stockFill,
                { width: `${stockPercent * 100}%` },
                isLowStock && { backgroundColor: '#EF233C' },
              ]} />
            </View>
          )}
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          {(['info', 'history', 'restock'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Info Tab */}
        {activeTab === 'info' && (
          <View style={styles.section}>
            {med.use_case && <InfoRow icon="🎯" label="Purpose" value={med.use_case} />}
            {med.dosage && <InfoRow icon="💊" label="Dosage" value={med.dosage} />}
            {med.side_effects && <InfoRow icon="⚠️" label="Side Effects" value={med.side_effects} />}
            {med.doctor_notes && <InfoRow icon="👨‍⚕️" label="Doctor Notes" value={med.doctor_notes} />}
            {med.prescription_name && <InfoRow icon="📋" label="Linked Prescription" value={med.prescription_name} />}
            {med.duration_days && <InfoRow icon="📅" label="Treatment Duration" value={`${med.duration_days} days`} />}

            <Text style={styles.subTitle}>📋 Schedule</Text>
            {med.schedules.length === 0 ? (
              <TouchableOpacity
                style={styles.addScheduleBtn}
                onPress={() => navigation.navigate('SetSchedule', {
                  medicationId: med.id, medicationName: med.name, profileId, profileName,
                })}
              >
                <Text style={styles.addScheduleBtnText}>+ Set Schedule</Text>
              </TouchableOpacity>
            ) : (
              med.schedules.map((s) => (
                <View key={s.id} style={styles.scheduleRow}>
                  <Text style={styles.scheduleTime}>{formatTime(s.time_of_day)}</Text>
                  <Text style={styles.scheduleDays}>{s.label ? `${s.label} · ` : ''}{s.days_of_week}</Text>
                </View>
              ))
            )}
          </View>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <View style={styles.section}>
            {logs.length === 0 ? (
              <Text style={styles.emptyText}>No history yet.</Text>
            ) : (
              logs.map((log) => (
                <View key={log.id} style={styles.logRow}>
                  <Text style={styles.logIcon}>
                    {log.status === 'taken' ? '✅' : log.status === 'missed' ? '❌' : '⏭️'}
                  </Text>
                  <View style={styles.logInfo}>
                    <Text style={styles.logStatus}>{log.status.charAt(0).toUpperCase() + log.status.slice(1)}</Text>
                    <Text style={styles.logDate}>{new Date(log.logged_at).toLocaleString()}</Text>
                    {log.notes && <Text style={styles.logNotes}>{log.notes}</Text>}
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* Restock History Tab */}
        {activeTab === 'restock' && (
          <View style={styles.section}>
            <TouchableOpacity style={styles.restockLargeBtn} onPress={() => setRestockModal(true)}>
              <Text style={styles.restockLargeBtnText}>+ Log New Restock</Text>
            </TouchableOpacity>
            {restockLogs.length === 0 ? (
              <Text style={styles.emptyText}>No restock history.</Text>
            ) : (
              restockLogs.map((r) => (
                <View key={r.id} style={styles.restockRow}>
                  <Text style={styles.restockIcon}>📦</Text>
                  <View>
                    <Text style={styles.restockAdded}>+{r.pills_added} pills → Total: {r.new_total}</Text>
                    <Text style={styles.restockDate}>{new Date(r.restocked_at).toLocaleDateString()}</Text>
                    {r.notes && <Text style={styles.logNotes}>{r.notes}</Text>}
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Restock Modal */}
      <Modal visible={restockModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>📦 Restock {med.name}</Text>
            <Text style={styles.label}>Pills Added</Text>
            <TextInput
              style={styles.input}
              value={restockCount}
              onChangeText={setRestockCount}
              placeholder="e.g. 30"
              keyboardType="numeric"
              placeholderTextColor={COLORS.textLight}
            />
            <Text style={styles.label}>Notes (optional)</Text>
            <TextInput
              style={styles.input}
              value={restockNotes}
              onChangeText={setRestockNotes}
              placeholder="e.g. New prescription"
              placeholderTextColor={COLORS.textLight}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setRestockModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleRestock} disabled={restocking}>
                {restocking ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmBtnText}>Save</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoIcon}>{icon}</Text>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
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
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    flexDirection: 'row', alignItems: 'center',
    padding: SIZES.large, paddingTop: SIZES.large,
  },
  back: { marginRight: SIZES.medium },
  backText: { fontSize: 24, color: COLORS.primary },
  headerInfo: { flex: 1 },
  medName: { fontSize: 22, fontWeight: '800', color: COLORS.text },
  pillDesc: { fontSize: SIZES.small, color: COLORS.textLight, marginTop: 2 },
  deleteIcon: { fontSize: 22 },

  stockCard: {
    marginHorizontal: SIZES.large, backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius, padding: SIZES.large, marginBottom: SIZES.large, ...SHADOWS.medium,
  },
  stockCardLow: { borderWidth: 2, borderColor: '#EF233C' },
  stockRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  stockLabel: { fontSize: SIZES.small, color: COLORS.textLight, textTransform: 'uppercase', fontWeight: '600' },
  stockCount: { fontSize: 36, fontWeight: '800', color: COLORS.text },
  stockRight: { alignItems: 'flex-end' },
  daysLeft: { fontSize: SIZES.font, fontWeight: '700', color: '#20BF55', marginBottom: 8 },
  restockBtn: {
    backgroundColor: COLORS.primary, paddingHorizontal: SIZES.medium,
    paddingVertical: 8, borderRadius: 20,
  },
  restockBtnText: { color: '#fff', fontWeight: '700', fontSize: SIZES.small },
  stockBar: { height: 6, backgroundColor: '#EEF0FF', borderRadius: 3, marginTop: 12, overflow: 'hidden' },
  stockFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 3 },

  tabs: {
    flexDirection: 'row', marginHorizontal: SIZES.large, marginBottom: SIZES.large,
    backgroundColor: COLORS.surface, borderRadius: SIZES.radius, padding: 4, ...SHADOWS.light,
  },
  tab: { flex: 1, padding: SIZES.base, borderRadius: SIZES.base - 2, alignItems: 'center' },
  tabActive: { backgroundColor: COLORS.primary },
  tabText: { fontSize: SIZES.small, fontWeight: '600', color: COLORS.textLight },
  tabTextActive: { color: '#fff' },

  section: {
    marginHorizontal: SIZES.large, backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius, padding: SIZES.large, ...SHADOWS.light,
  },
  infoRow: { flexDirection: 'row', marginBottom: SIZES.medium },
  infoIcon: { fontSize: 20, marginRight: SIZES.base, marginTop: 2 },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: SIZES.small, fontWeight: '700', color: COLORS.textLight, textTransform: 'uppercase' },
  infoValue: { fontSize: SIZES.font, color: COLORS.text, marginTop: 2 },

  subTitle: { fontSize: SIZES.font, fontWeight: '700', color: COLORS.text, marginTop: SIZES.medium, marginBottom: SIZES.base },
  scheduleRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#EFF3FF', padding: SIZES.medium, borderRadius: SIZES.base, marginBottom: SIZES.base,
  },
  scheduleTime: { fontSize: SIZES.font, fontWeight: '700', color: COLORS.primary },
  scheduleDays: { fontSize: SIZES.small, color: COLORS.textLight },
  addScheduleBtn: {
    borderWidth: 1.5, borderColor: COLORS.primary, borderStyle: 'dashed',
    padding: SIZES.medium, borderRadius: SIZES.base, alignItems: 'center',
  },
  addScheduleBtnText: { color: COLORS.primary, fontWeight: '700' },

  logRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: SIZES.medium },
  logIcon: { fontSize: 20, marginRight: SIZES.base },
  logInfo: { flex: 1 },
  logStatus: { fontSize: SIZES.font, fontWeight: '600', color: COLORS.text },
  logDate: { fontSize: SIZES.small, color: COLORS.textLight },
  logNotes: { fontSize: SIZES.small, color: COLORS.textLight, fontStyle: 'italic', marginTop: 2 },

  restockLargeBtn: {
    backgroundColor: COLORS.primary, padding: SIZES.medium, borderRadius: SIZES.radius,
    alignItems: 'center', marginBottom: SIZES.large,
  },
  restockLargeBtnText: { color: '#fff', fontWeight: '700' },
  restockRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: SIZES.medium },
  restockIcon: { fontSize: 20, marginRight: SIZES.base },
  restockAdded: { fontSize: SIZES.font, fontWeight: '600', color: COLORS.text },
  restockDate: { fontSize: SIZES.small, color: COLORS.textLight },

  emptyText: { color: COLORS.textLight, textAlign: 'center', paddingVertical: SIZES.large },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: COLORS.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: SIZES.large, paddingBottom: 40,
  },
  modalTitle: { fontSize: SIZES.large, fontWeight: '800', color: COLORS.text, marginBottom: SIZES.large },
  label: {
    fontSize: SIZES.small, fontWeight: '700', color: COLORS.textLight,
    textTransform: 'uppercase', marginBottom: 6,
  },
  input: {
    borderWidth: 1.5, borderColor: '#E8ECF4', borderRadius: SIZES.base,
    padding: SIZES.medium, marginBottom: SIZES.medium, fontSize: SIZES.font,
    color: COLORS.text, backgroundColor: '#FAFBFF',
  },
  modalButtons: { flexDirection: 'row', gap: SIZES.base, marginTop: SIZES.base },
  cancelBtn: {
    flex: 1, padding: SIZES.medium, borderRadius: SIZES.radius,
    alignItems: 'center', backgroundColor: '#F0F0F0',
  },
  cancelBtnText: { fontWeight: '700', color: COLORS.text },
  confirmBtn: {
    flex: 1, padding: SIZES.medium, borderRadius: SIZES.radius,
    alignItems: 'center', backgroundColor: COLORS.primary,
  },
  confirmBtnText: { fontWeight: '700', color: '#fff' },
});
