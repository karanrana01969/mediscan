import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SIZES, SHADOWS } from '../theme';
import api from '../services/api';
import { storageService } from '../services/storageService';

interface Medication {
  id: number;
  name: string;
  use_case: string | null;
  dosage: string | null;
  remaining_pills: number | null;
  days_remaining: number | null;
  low_stock_threshold: number;
  pill_color: string | null;
  schedules: { id: number; time_of_day: string; label: string | null }[];
}

export default function MedicationsListScreen({ route, navigation }: any) {
  const [profileId, setProfileId] = useState<number | null>(route.params?.profileId ?? null);
  const [profileName, setProfileName] = useState<string>(route.params?.profileName ?? '');
  const [meds, setMeds] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { loadProfile(); }, []);

  const loadProfile = async () => {
    let pid = profileId;
    let pname = profileName;
    if (!pid) {
      pid = await storageService.getProfileId();
      pname = (await storageService.getProfileName()) ?? '';
      setProfileId(pid);
      setProfileName(pname);
    }
    if (pid) fetchMeds(pid);
  };

  const fetchMeds = useCallback(async (pid?: number) => {
    const id = pid ?? profileId;
    if (!id) return;
    try {
      const res = await api.get(`/medications/${id}`);
      setMeds(res.data);
    } catch (err) {
      console.error('Meds fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [profileId]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Medications</Text>
          <Text style={styles.subtitle}>{profileName} · {meds.length} active</Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('Scanner', { profileId, profileName })}
        >
          <Text style={styles.addBtnText}>＋ Add</Text>
        </TouchableOpacity>
      </View>

      {meds.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>💊</Text>
          <Text style={styles.emptyTitle}>No medications yet</Text>
          <Text style={styles.emptySubtitle}>Scan a medication box or add one manually</Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => navigation.navigate('Scanner', { profileId, profileName })}
          >
            <Text style={styles.emptyButtonText}>📷 Scan Medication</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.emptyButton, styles.emptyButtonSecondary]}
            onPress={() => navigation.navigate('AddMedication', { profileId, profileName })}
          >
            <Text style={[styles.emptyButtonText, { color: COLORS.primary }]}>✏️ Add Manually</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={meds}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchMeds(); }} />
          }
          ListHeaderComponent={
            // Low stock warnings
            meds.some(m => m.days_remaining != null && m.days_remaining <= m.low_stock_threshold)
              ? (
                <View style={styles.warningBanner}>
                  <Text style={styles.warningText}>
                    ⚠️ {meds.filter(m => m.days_remaining != null && m.days_remaining <= m.low_stock_threshold).length} medication(s) running low
                  </Text>
                </View>
              ) : null
          }
          renderItem={({ item: med }) => {
            const isLow = med.days_remaining != null && med.days_remaining <= med.low_stock_threshold;
            const nextDose = med.schedules.sort((a, b) => a.time_of_day.localeCompare(b.time_of_day))[0];
            return (
              <TouchableOpacity
                style={[styles.card, isLow && styles.cardLow]}
                onPress={() => navigation.navigate('MedicationDetail', {
                  medicationId: med.id, profileId, profileName,
                })}
              >
                <View style={styles.cardLeft}>
                  <View style={[styles.pillDot, { backgroundColor: med.pill_color ? colorMap(med.pill_color) : COLORS.primary }]} />
                  <View style={styles.cardInfo}>
                    <Text style={styles.medName}>{med.name}</Text>
                    {med.use_case && <Text style={styles.useCase}>{med.use_case}</Text>}
                    {nextDose && (
                      <Text style={styles.nextDose}>
                        ⏰ Next: {formatTime(nextDose.time_of_day)}
                        {nextDose.label ? ` · ${nextDose.label}` : ''}
                      </Text>
                    )}
                  </View>
                </View>
                <View style={styles.cardRight}>
                  {isLow
                    ? <Text style={styles.lowBadge}>⚠️ Low</Text>
                    : <Text style={styles.pillsLeft}>{med.remaining_pills ?? '—'} pills</Text>
                  }
                  {med.days_remaining != null && (
                    <Text style={[styles.daysLeft, isLow && { color: '#EF233C' }]}>
                      {med.days_remaining}d left
                    </Text>
                  )}
                  <Text style={styles.chevron}>›</Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

function colorMap(name: string): string {
  const map: Record<string, string> = {
    White: '#E0E0E0', Yellow: '#F9C74F', Pink: '#F472B6', Blue: '#4361EE',
    Green: '#20BF55', Orange: '#F77F00', Red: '#EF233C', Purple: '#7209B7',
  };
  return map[name] ?? COLORS.primary;
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
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SIZES.large, paddingVertical: SIZES.large,
  },
  title: { fontSize: 26, fontWeight: '800', color: COLORS.text },
  subtitle: { fontSize: SIZES.small, color: COLORS.textLight, marginTop: 2 },
  addBtn: {
    backgroundColor: COLORS.primary, paddingHorizontal: SIZES.medium,
    paddingVertical: 10, borderRadius: 20,
  },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: SIZES.font },
  list: { paddingHorizontal: SIZES.large, paddingBottom: 32 },
  warningBanner: {
    backgroundColor: '#FFF8E6', borderRadius: SIZES.base, padding: SIZES.medium,
    marginBottom: SIZES.medium, borderWidth: 1, borderColor: '#FFCC00',
  },
  warningText: { color: '#7D5A00', fontWeight: '600', fontSize: SIZES.font },

  card: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.surface, borderRadius: SIZES.radius,
    padding: SIZES.medium, marginBottom: SIZES.medium, ...SHADOWS.light,
  },
  cardLow: { borderWidth: 1.5, borderColor: '#EF233C' },
  cardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  pillDot: { width: 14, height: 14, borderRadius: 7, marginRight: SIZES.base },
  cardInfo: { flex: 1 },
  medName: { fontSize: SIZES.font, fontWeight: '700', color: COLORS.text },
  useCase: { fontSize: SIZES.small, color: COLORS.textLight, marginTop: 2 },
  nextDose: { fontSize: SIZES.small, color: COLORS.primary, marginTop: 4, fontWeight: '600' },
  cardRight: { alignItems: 'flex-end' },
  pillsLeft: { fontSize: SIZES.small, fontWeight: '700', color: COLORS.text },
  lowBadge: { fontSize: SIZES.small, fontWeight: '700', color: '#EF233C' },
  daysLeft: { fontSize: 10, color: COLORS.textLight, marginTop: 2 },
  chevron: { fontSize: 20, color: COLORS.textLight, marginTop: 4 },

  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SIZES.large },
  emptyEmoji: { fontSize: 56, marginBottom: SIZES.medium },
  emptyTitle: { fontSize: SIZES.large, fontWeight: '700', color: COLORS.text },
  emptySubtitle: { fontSize: SIZES.font, color: COLORS.textLight, marginTop: 8, textAlign: 'center' },
  emptyButton: {
    backgroundColor: COLORS.primary, padding: SIZES.medium, borderRadius: SIZES.radius,
    marginTop: SIZES.large, paddingHorizontal: SIZES.extraLarge,
  },
  emptyButtonSecondary: { backgroundColor: '#EFF3FF', marginTop: SIZES.base },
  emptyButtonText: { color: '#fff', fontWeight: '700', fontSize: SIZES.font },
});
