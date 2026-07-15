import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SIZES, SHADOWS } from '../theme';
import api from '../services/api';
import { storageService } from '../services/storageService';

interface TodayDose {
  schedule_id: number;
  medication_id: number;
  medication_name: string;
  dosage: string | null;
  pill_color: string | null;
  time_of_day: string;
  label: string | null;
  status: 'taken' | 'missed' | 'upcoming' | null;
  log_id: number | null;
  scheduled_at: string | null;
}

const STATUS_CONFIG = {
  taken: { bg: '#E8F8EE', border: '#20BF55', text: '#20BF55', icon: '✅', label: 'Taken' },
  missed: { bg: '#FFF0F0', border: '#EF233C', text: '#EF233C', icon: '❌', label: 'Missed' },
  upcoming: { bg: '#EFF3FF', border: '#4361EE', text: '#4361EE', icon: '⏰', label: 'Upcoming' },
};

const TIME_GROUPS = ['Morning', 'Afternoon', 'Evening', 'Night'];

function groupByLabel(doses: TodayDose[]) {
  const groups: Record<string, TodayDose[]> = {};
  doses.forEach((d) => {
    const key = d.label ?? 'Other';
    if (!groups[key]) groups[key] = [];
    groups[key].push(d);
  });
  return groups;
}

export default function DashboardScreen({ route, navigation }: any) {
  const [profileId, setProfileId] = useState<number | null>(route.params?.profileId ?? null);
  const [profileName, setProfileName] = useState<string>(route.params?.profileName ?? '');
  const [doses, setDoses] = useState<TodayDose[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [adherence, setAdherence] = useState<{ taken: number; total: number } | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    let pid = profileId;
    let pname = profileName;
    if (!pid) {
      pid = await storageService.getProfileId();
      pname = (await storageService.getProfileName()) ?? '';
      setProfileId(pid);
      setProfileName(pname);
    }
    if (pid) fetchToday(pid);
  };

  const fetchToday = useCallback(async (pid?: number) => {
    const id = pid ?? profileId;
    if (!id) return;
    try {
      const [todayRes, adherenceRes] = await Promise.all([
        api.get(`/medications/today/${id}`),
        api.get(`/history/${id}/adherence?days=1`),
      ]);
      setDoses(todayRes.data);
      setAdherence({ taken: adherenceRes.data.taken, total: adherenceRes.data.total_doses });
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [profileId]);

  const handleMarkTaken = async (dose: TodayDose) => {
    if (dose.status === 'taken') return;
    try {
      await api.post(`/medications/log/${dose.schedule_id}`, {
        status: 'taken',
        scheduled_at: dose.scheduled_at,
      });
      fetchToday();
    } catch {
      Alert.alert('Error', 'Could not mark dose as taken.');
    }
  };

  const handleMarkSkipped = async (dose: TodayDose) => {
    try {
      await api.post(`/medications/log/${dose.schedule_id}`, {
        status: 'skipped',
        scheduled_at: dose.scheduled_at,
      });
      fetchToday();
    } catch {
      Alert.alert('Error', 'Could not log dose.');
    }
  };

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const grouped = groupByLabel(doses);
  const takenCount = doses.filter(d => d.status === 'taken').length;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchToday(); }} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good {getTimeGreeting()}, 👋</Text>
            <Text style={styles.profileName}>{profileName}</Text>
            <Text style={styles.dateText}>{today}</Text>
          </View>
          <TouchableOpacity
            style={styles.scanButton}
            onPress={() => navigation.navigate('Scanner', { profileId, profileName })}
          >
            <Text style={styles.scanButtonText}>＋ Add</Text>
          </TouchableOpacity>
        </View>

        {/* Adherence Card */}
        {doses.length > 0 && (
          <View style={styles.adherenceCard}>
            <Text style={styles.adherenceTitle}>Today's Progress</Text>
            <View style={styles.adherenceRow}>
              <Text style={styles.adherenceCount}>
                <Text style={styles.adherenceTaken}>{takenCount}</Text>
                <Text style={styles.adherenceTotal}> / {doses.length}</Text>
              </Text>
              <Text style={styles.adherenceLabel}>doses taken</Text>
            </View>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: doses.length > 0 ? `${(takenCount / doses.length) * 100}%` : '0%' },
                ]}
              />
            </View>
          </View>
        )}

        {/* Dose Groups */}
        {doses.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>💊</Text>
            <Text style={styles.emptyTitle}>No medications scheduled today</Text>
            <Text style={styles.emptySubtitle}>Tap "+ Add" to scan or add a medication</Text>
          </View>
        ) : (
          TIME_GROUPS.concat(['Other']).map((group) => {
            const groupDoses = grouped[group];
            if (!groupDoses || groupDoses.length === 0) return null;
            return (
              <View key={group} style={styles.group}>
                <Text style={styles.groupTitle}>{getGroupEmoji(group)} {group}</Text>
                {groupDoses.map((dose) => {
                  const cfg = STATUS_CONFIG[dose.status ?? 'upcoming'];
                  return (
                    <View key={dose.schedule_id} style={[styles.doseCard, { borderLeftColor: cfg.border }]}>
                      <View style={styles.doseMain}>
                        <View style={[styles.pillDot, { backgroundColor: dose.pill_color ?? COLORS.primary }]} />
                        <View style={styles.doseInfo}>
                          <Text style={styles.medName}>{dose.medication_name}</Text>
                          <Text style={styles.dosage}>{dose.dosage ?? 'As prescribed'}</Text>
                          <Text style={styles.timeText}>🕐 {formatTime(dose.time_of_day)}</Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
                          <Text style={styles.statusIcon}>{cfg.icon}</Text>
                          <Text style={[styles.statusLabel, { color: cfg.text }]}>{cfg.label}</Text>
                        </View>
                      </View>

                      {dose.status !== 'taken' && (
                        <View style={styles.actionRow}>
                          <TouchableOpacity
                            style={styles.takeButton}
                            onPress={() => handleMarkTaken(dose)}
                          >
                            <Text style={styles.takeButtonText}>✓ Mark Taken</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.skipButton}
                            onPress={() => handleMarkSkipped(dose)}
                          >
                            <Text style={styles.skipButtonText}>Skip</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            );
          })
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function getTimeGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Morning';
  if (h < 17) return 'Afternoon';
  if (h < 21) return 'Evening';
  return 'Night';
}

function getGroupEmoji(group: string) {
  const map: Record<string, string> = {
    Morning: '🌅', Afternoon: '☀️', Evening: '🌆', Night: '🌙', Other: '💊',
  };
  return map[group] ?? '💊';
}

function formatTime(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${period}`;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: SIZES.large,
    paddingTop: SIZES.large,
    paddingBottom: SIZES.medium,
  },
  greeting: { fontSize: SIZES.font, color: COLORS.textLight },
  profileName: { fontSize: 22, fontWeight: '800', color: COLORS.text, marginTop: 2 },
  dateText: { fontSize: SIZES.small, color: COLORS.textLight, marginTop: 2 },
  scanButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SIZES.medium,
    paddingVertical: 10,
    borderRadius: 20,
  },
  scanButtonText: { color: '#fff', fontWeight: '700', fontSize: SIZES.font },

  adherenceCard: {
    marginHorizontal: SIZES.large,
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius,
    padding: SIZES.large,
    marginBottom: SIZES.large,
    ...SHADOWS.medium,
  },
  adherenceTitle: { fontSize: SIZES.small, color: COLORS.textLight, fontWeight: '600', textTransform: 'uppercase' },
  adherenceRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 4 },
  adherenceCount: { marginRight: 6 },
  adherenceTaken: { fontSize: 32, fontWeight: '800', color: COLORS.primary },
  adherenceTotal: { fontSize: 20, color: COLORS.textLight },
  adherenceLabel: { fontSize: SIZES.font, color: COLORS.textLight },
  progressBar: { height: 6, backgroundColor: '#EEF0FF', borderRadius: 3, marginTop: 10, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 3 },

  group: { marginBottom: SIZES.medium },
  groupTitle: { fontSize: SIZES.font, fontWeight: '700', color: COLORS.text, paddingHorizontal: SIZES.large, marginBottom: SIZES.base },

  doseCard: {
    marginHorizontal: SIZES.large,
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius,
    padding: SIZES.medium,
    marginBottom: SIZES.base,
    borderLeftWidth: 4,
    ...SHADOWS.light,
  },
  doseMain: { flexDirection: 'row', alignItems: 'center' },
  pillDot: { width: 12, height: 12, borderRadius: 6, marginRight: SIZES.base },
  doseInfo: { flex: 1 },
  medName: { fontSize: SIZES.font, fontWeight: '700', color: COLORS.text },
  dosage: { fontSize: SIZES.small, color: COLORS.textLight, marginTop: 2 },
  timeText: { fontSize: SIZES.small, color: COLORS.textLight, marginTop: 2 },
  statusBadge: { alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  statusIcon: { fontSize: 16 },
  statusLabel: { fontSize: 10, fontWeight: '600', marginTop: 2 },

  actionRow: { flexDirection: 'row', marginTop: SIZES.base, gap: SIZES.base },
  takeButton: {
    flex: 1, backgroundColor: COLORS.primary, padding: 10,
    borderRadius: 12, alignItems: 'center',
  },
  takeButtonText: { color: '#fff', fontWeight: '700', fontSize: SIZES.small },
  skipButton: {
    paddingHorizontal: SIZES.medium, padding: 10,
    borderRadius: 12, alignItems: 'center',
    borderWidth: 1, borderColor: '#E0E0E0',
  },
  skipButtonText: { color: COLORS.textLight, fontWeight: '600', fontSize: SIZES.small },

  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyEmoji: { fontSize: 56, marginBottom: SIZES.medium },
  emptyTitle: { fontSize: SIZES.large, fontWeight: '700', color: COLORS.text, textAlign: 'center' },
  emptySubtitle: { fontSize: SIZES.font, color: COLORS.textLight, marginTop: 8, textAlign: 'center' },
});
