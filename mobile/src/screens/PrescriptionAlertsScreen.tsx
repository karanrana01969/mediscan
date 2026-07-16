import React, {useEffect, useState} from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {COLORS, SIZES, SHADOWS} from '../theme';
import {prescriptionService, PrescriptionAlert} from '../services/prescriptionService';

export default function PrescriptionAlertsScreen({route, navigation}: any) {
  const {profileId, profileName} = route.params ?? {};
  const [alerts, setAlerts] = useState<PrescriptionAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const res = await prescriptionService.getAlerts(profileId);
      setAlerts(res.alerts);
    } catch {
      console.warn('Failed to load alerts');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleAdd = (alert: PrescriptionAlert) => {
    navigation.navigate('AddMedication', {
      profileId,
      profileName,
      prefill: {
        name: alert.medicine_name,
        dosage: alert.dosage,
        doctor_notes: alert.doctor_name ? `Prescribed by ${alert.doctor_name}` : undefined,
      },
      prescriptionPrefill: {
        suggested_times: alert.suggested_times,
        suggested_days: alert.suggested_days,
        suggested_label: alert.suggested_label,
        prescription_name: alert.prescription_name,
      },
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {setRefreshing(true); load();}} />}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>🔔 Unscheduled Medicines</Text>
          <Text style={styles.subtitle}>From active prescriptions not yet added to schedule</Text>
        </View>

        {loading ? (
          <ActivityIndicator color={COLORS.primary} style={{marginTop: 40}} />
        ) : alerts.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>✅</Text>
            <Text style={styles.emptyTitle}>All clear!</Text>
            <Text style={styles.emptyText}>All medicines from your active prescriptions are scheduled.</Text>
          </View>
        ) : (
          <>
            <Text style={styles.countText}>{alerts.length} medicine{alerts.length !== 1 ? 's' : ''} need attention</Text>
            {alerts.map((alert, i) => (
              <View key={i} style={styles.alertCard}>
                <View style={styles.alertTop}>
                  <View style={{flex: 1}}>
                    <Text style={styles.medName}>{alert.medicine_name}</Text>
                    {alert.dosage && <Text style={styles.medDetail}>💊 {alert.dosage}</Text>}
                    {alert.frequency && <Text style={styles.medDetail}>⏰ {alert.frequency}</Text>}
                  </View>
                  <View style={styles.rxBadge}>
                    <Text style={styles.rxBadgeText}>📋</Text>
                  </View>
                </View>

                <View style={styles.rxInfo}>
                  <Text style={styles.rxInfoText}>From: {alert.prescription_name}</Text>
                  {alert.doctor_name && <Text style={styles.rxInfoText}>By: {alert.doctor_name}</Text>}
                </View>

                {alert.suggested_times && (
                  <View style={styles.suggestedRow}>
                    <Text style={styles.suggestedLabel}>Suggested schedule:</Text>
                    <Text style={styles.suggestedValue}>
                      {alert.suggested_label} • {alert.suggested_times.join(', ')} • {alert.suggested_days}
                    </Text>
                  </View>
                )}

                <TouchableOpacity style={styles.addBtn} onPress={() => handleAdd(alert)}>
                  <Text style={styles.addBtnText}>+ Add to Schedule</Text>
                </TouchableOpacity>
              </View>
            ))}
          </>
        )}

        <View style={{height: 32}} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: COLORS.background},
  scroll: {padding: SIZES.large},
  header: {marginBottom: SIZES.large},
  back: {marginBottom: SIZES.base},
  backText: {color: COLORS.primary, fontSize: SIZES.font, fontWeight: '600'},
  title: {fontSize: 26, fontWeight: '800', color: COLORS.text},
  subtitle: {fontSize: SIZES.font, color: COLORS.textLight, marginTop: 4, lineHeight: 22},

  countText: {fontSize: SIZES.font, color: COLORS.textLight, marginBottom: SIZES.medium, fontWeight: '600'},

  alertCard: {
    backgroundColor: COLORS.surface, borderRadius: SIZES.radius, padding: SIZES.large,
    marginBottom: SIZES.medium, ...SHADOWS.medium,
    borderLeftWidth: 4, borderLeftColor: '#FFCC00',
  },
  alertTop: {flexDirection: 'row', alignItems: 'flex-start', marginBottom: SIZES.base},
  medName: {fontSize: 17, fontWeight: '800', color: COLORS.text},
  medDetail: {fontSize: SIZES.small, color: COLORS.textLight, marginTop: 4},
  rxBadge: {width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFF8E6', alignItems: 'center', justifyContent: 'center', marginLeft: 8},
  rxBadgeText: {fontSize: 18},
  rxInfo: {backgroundColor: '#F8F9FA', borderRadius: 8, padding: 8, marginBottom: SIZES.base},
  rxInfoText: {fontSize: SIZES.small, color: COLORS.textLight},
  suggestedRow: {marginBottom: SIZES.medium},
  suggestedLabel: {fontSize: SIZES.small, color: COLORS.textLight, fontWeight: '700', marginBottom: 2},
  suggestedValue: {fontSize: SIZES.small, color: COLORS.primary, fontWeight: '600'},
  addBtn: {
    backgroundColor: COLORS.primary, borderRadius: 10, padding: 10, alignItems: 'center',
  },
  addBtnText: {color: '#fff', fontWeight: '700', fontSize: SIZES.font},

  empty: {alignItems: 'center', paddingTop: 60},
  emptyIcon: {fontSize: 56, marginBottom: SIZES.medium},
  emptyTitle: {fontSize: 22, fontWeight: '700', color: COLORS.text, marginBottom: SIZES.base},
  emptyText: {fontSize: SIZES.font, color: COLORS.textLight, textAlign: 'center'},
});
