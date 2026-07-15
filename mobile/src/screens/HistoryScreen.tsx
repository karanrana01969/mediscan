import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SIZES, SHADOWS } from '../theme';
import api from '../services/api';
import { storageService } from '../services/storageService';

interface AdherenceStats {
  total_doses: number;
  taken: number;
  missed: number;
  skipped: number;
  adherence_rate: number;
}

interface Log {
  id: number;
  status: 'taken' | 'missed' | 'skipped';
  logged_at: string;
  schedule_id: number;
}

export default function HistoryScreen({ route }: any) {
  const [profileId, setProfileId] = useState<number | null>(route.params?.profileId ?? null);
  const [profileName, setProfileName] = useState<string>(route.params?.profileName ?? '');
  const [stats7, setStats7] = useState<AdherenceStats | null>(null);
  const [stats30, setStats30] = useState<AdherenceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState<7 | 30>(7);

  useEffect(() => { loadProfile(); }, []);

  const loadProfile = async () => {
    let pid = profileId;
    if (!pid) {
      pid = await storageService.getProfileId();
      const pname = (await storageService.getProfileName()) ?? '';
      setProfileId(pid);
      setProfileName(pname);
    }
    if (pid) fetchStats(pid);
  };

  const fetchStats = useCallback(async (pid?: number) => {
    const id = pid ?? profileId;
    if (!id) return;
    try {
      const [r7, r30] = await Promise.all([
        api.get(`/history/${id}/adherence?days=7`),
        api.get(`/history/${id}/adherence?days=30`),
      ]);
      setStats7(r7.data);
      setStats30(r30.data);
    } catch (err) {
      console.error('History fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [profileId]);

  const stats = period === 7 ? stats7 : stats30;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const adherencePct = stats ? Math.round(stats.adherence_rate * 100) : 0;
  const adherenceColor =
    adherencePct >= 80 ? '#20BF55' : adherencePct >= 50 ? '#F9C74F' : '#EF233C';

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchStats(); }} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>History</Text>
          <Text style={styles.subtitle}>{profileName}</Text>
        </View>

        {/* Period Toggle */}
        <View style={styles.periodToggle}>
          <TouchableOpacity
            style={[styles.periodChip, period === 7 && styles.periodChipActive]}
            onPress={() => setPeriod(7)}
          >
            <Text style={[styles.periodText, period === 7 && styles.periodTextActive]}>Last 7 Days</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.periodChip, period === 30 && styles.periodChipActive]}
            onPress={() => setPeriod(30)}
          >
            <Text style={[styles.periodText, period === 30 && styles.periodTextActive]}>Last 30 Days</Text>
          </TouchableOpacity>
        </View>

        {/* Big Adherence Score */}
        <View style={styles.scoreCard}>
          <Text style={styles.scoreLabel}>Adherence Rate</Text>
          <View style={[styles.scoreCircle, { borderColor: adherenceColor }]}>
            <Text style={[styles.scoreNumber, { color: adherenceColor }]}>{adherencePct}%</Text>
          </View>
          <Text style={styles.scoreSubtitle}>
            {adherencePct >= 80 ? '🌟 Excellent! Keep it up!' :
              adherencePct >= 50 ? '👍 Good, but can improve' :
                '⚠️ Needs attention'}
          </Text>
        </View>

        {/* Breakdown Stats */}
        {stats && (
          <View style={styles.statsRow}>
            <StatBox icon="✅" label="Taken" value={stats.taken} color="#20BF55" />
            <StatBox icon="❌" label="Missed" value={stats.missed} color="#EF233C" />
            <StatBox icon="⏭️" label="Skipped" value={stats.skipped} color="#F9C74F" />
            <StatBox icon="💊" label="Total" value={stats.total_doses} color={COLORS.primary} />
          </View>
        )}

        {/* Adherence Bar */}
        {stats && stats.total_doses > 0 && (
          <View style={styles.barSection}>
            <Text style={styles.barTitle}>Dose Breakdown</Text>
            <View style={styles.barContainer}>
              {stats.taken > 0 && (
                <View style={[styles.barSegment, {
                  flex: stats.taken, backgroundColor: '#20BF55',
                }]} />
              )}
              {stats.missed > 0 && (
                <View style={[styles.barSegment, {
                  flex: stats.missed, backgroundColor: '#EF233C',
                }]} />
              )}
              {stats.skipped > 0 && (
                <View style={[styles.barSegment, {
                  flex: stats.skipped, backgroundColor: '#F9C74F',
                }]} />
              )}
            </View>
            <View style={styles.barLegend}>
              <LegendItem color="#20BF55" label="Taken" />
              <LegendItem color="#EF233C" label="Missed" />
              <LegendItem color="#F9C74F" label="Skipped" />
            </View>
          </View>
        )}

        {stats?.total_doses === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📊</Text>
            <Text style={styles.emptyTitle}>No data yet</Text>
            <Text style={styles.emptySubtitle}>
              Start marking your medications as taken to see adherence history here.
            </Text>
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function StatBox({ icon, label, value, color }: { icon: string; label: string; value: number; color: string }) {
  return (
    <View style={statStyles.box}>
      <Text style={statStyles.icon}>{icon}</Text>
      <Text style={[statStyles.value, { color }]}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color, marginRight: 4 }} />
      <Text style={{ fontSize: 11, color: COLORS.textLight }}>{label}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  box: {
    flex: 1, backgroundColor: COLORS.surface, borderRadius: SIZES.base,
    padding: SIZES.medium, alignItems: 'center', ...SHADOWS.light,
  },
  icon: { fontSize: 20, marginBottom: 4 },
  value: { fontSize: 22, fontWeight: '800' },
  label: { fontSize: 10, color: COLORS.textLight, marginTop: 2, fontWeight: '600' },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: SIZES.large, paddingTop: SIZES.large, paddingBottom: SIZES.base },
  title: { fontSize: 26, fontWeight: '800', color: COLORS.text },
  subtitle: { fontSize: SIZES.small, color: COLORS.textLight, marginTop: 2 },

  periodToggle: {
    flexDirection: 'row', marginHorizontal: SIZES.large, marginBottom: SIZES.large,
    backgroundColor: COLORS.surface, borderRadius: SIZES.radius, padding: 4, ...SHADOWS.light,
  },
  periodChip: { flex: 1, padding: SIZES.base, borderRadius: SIZES.base - 2, alignItems: 'center' },
  periodChipActive: { backgroundColor: COLORS.primary },
  periodText: { fontSize: SIZES.small, fontWeight: '600', color: COLORS.textLight },
  periodTextActive: { color: '#fff' },

  scoreCard: {
    marginHorizontal: SIZES.large, backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius, padding: SIZES.large, alignItems: 'center',
    marginBottom: SIZES.large, ...SHADOWS.medium,
  },
  scoreLabel: { fontSize: SIZES.small, fontWeight: '700', color: COLORS.textLight, textTransform: 'uppercase', marginBottom: SIZES.medium },
  scoreCircle: {
    width: 120, height: 120, borderRadius: 60, borderWidth: 8,
    alignItems: 'center', justifyContent: 'center', marginBottom: SIZES.medium,
  },
  scoreNumber: { fontSize: 32, fontWeight: '800' },
  scoreSubtitle: { fontSize: SIZES.font, color: COLORS.textLight, textAlign: 'center' },

  statsRow: { flexDirection: 'row', gap: SIZES.base, marginHorizontal: SIZES.large, marginBottom: SIZES.large },

  barSection: {
    marginHorizontal: SIZES.large, backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius, padding: SIZES.large, ...SHADOWS.light,
  },
  barTitle: { fontSize: SIZES.font, fontWeight: '700', color: COLORS.text, marginBottom: SIZES.medium },
  barContainer: { flexDirection: 'row', height: 16, borderRadius: 8, overflow: 'hidden', marginBottom: SIZES.base },
  barSegment: { height: '100%' },
  barLegend: { flexDirection: 'row', gap: SIZES.medium },

  emptyState: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: SIZES.large },
  emptyEmoji: { fontSize: 56, marginBottom: SIZES.medium },
  emptyTitle: { fontSize: SIZES.large, fontWeight: '700', color: COLORS.text },
  emptySubtitle: { fontSize: SIZES.font, color: COLORS.textLight, marginTop: 8, textAlign: 'center' },
});
