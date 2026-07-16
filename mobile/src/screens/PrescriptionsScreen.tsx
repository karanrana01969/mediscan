import React, {useEffect, useState, useCallback} from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Alert, RefreshControl, ActivityIndicator,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {COLORS, SIZES, SHADOWS} from '../theme';
import {prescriptionService, Prescription} from '../services/prescriptionService';

export default function PrescriptionsScreen({route, navigation}: any) {
  const {profileId, profileName} = route.params ?? {};
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [alertCount, setAlertCount] = useState(0);

  const load = useCallback(async () => {
    try {
      const [rxList, alerts] = await Promise.all([
        prescriptionService.getAll(profileId),
        prescriptionService.getAlerts(profileId),
      ]);
      setPrescriptions(rxList);
      setAlertCount(alerts.count);
    } catch (e) {
      console.warn('Failed to load prescriptions', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [profileId]);

  useEffect(() => {
    load();
    const unsubscribe = navigation.addListener('focus', load);
    return unsubscribe;
  }, [load, navigation]);

  const handleToggle = async (rx: Prescription) => {
    try {
      const updated = await prescriptionService.toggle(rx.id);
      setPrescriptions(prev =>
        prev.map(p => (p.id === rx.id ? {...p, is_active: updated.is_active} : p)),
      );
    } catch {
      Alert.alert('Error', 'Failed to update prescription status.');
    }
  };

  const handleDelete = (rx: Prescription) => {
    Alert.alert(
      'Delete Prescription',
      `Delete "${rx.name}"? Medications linked to it will be kept but unlinked.`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await prescriptionService.delete(rx.id);
              setPrescriptions(prev => prev.filter(p => p.id !== rx.id));
            } catch {
              Alert.alert('Error', 'Failed to delete prescription.');
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {setRefreshing(true); load();}} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>📋 Prescriptions</Text>
          <Text style={styles.subtitle}>For {profileName}</Text>
        </View>

        {/* Alert banner */}
        {alertCount > 0 && (
          <TouchableOpacity
            style={styles.alertBanner}
            onPress={() => navigation.navigate('PrescriptionAlerts', {profileId, profileName})}
          >
            <Text style={styles.alertIcon}>🔔</Text>
            <View style={{flex: 1}}>
              <Text style={styles.alertTitle}>{alertCount} medicine{alertCount > 1 ? 's' : ''} not yet scheduled</Text>
              <Text style={styles.alertSub}>Tap to view and add to schedule →</Text>
            </View>
            <Text style={styles.alertChevron}>›</Text>
          </TouchableOpacity>
        )}

        {/* Add button */}
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('AddPrescription', {profileId, profileName})}
        >
          <Text style={styles.addBtnText}>+ Add Prescription</Text>
        </TouchableOpacity>

        {/* List */}
        {loading ? (
          <ActivityIndicator color={COLORS.primary} style={{marginTop: 40}} />
        ) : prescriptions.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📄</Text>
            <Text style={styles.emptyTitle}>No prescriptions yet</Text>
            <Text style={styles.emptyText}>Upload a doctor's prescription to auto-fill medication details and schedules.</Text>
          </View>
        ) : (
          prescriptions.map(rx => <PrescriptionCard key={rx.id} rx={rx} onToggle={handleToggle} onDelete={handleDelete} onPress={() => navigation.navigate('PrescriptionDetail', {prescriptionId: rx.id, profileId, profileName})} />)
        )}

        <View style={{height: 32}} />
      </ScrollView>
    </SafeAreaView>
  );
}

function PrescriptionCard({rx, onToggle, onDelete, onPress}: {rx: Prescription; onToggle: any; onDelete: any; onPress: any}) {
  const parsed = rx.ai_extracted_json ? (() => { try { return JSON.parse(rx.ai_extracted_json!); } catch { return null; } })() : null;
  const medCount = parsed?.medicines?.length ?? rx.medication_count;

  return (
    <TouchableOpacity style={[styles.card, !rx.is_active && styles.cardInactive]} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.cardHeader}>
        <View style={{flex: 1}}>
          <Text style={[styles.rxName, !rx.is_active && styles.textFaded]}>{rx.name}</Text>
          {rx.doctor_name && <Text style={styles.rxDoctor}>👨‍⚕️ {rx.doctor_name}</Text>}
          {rx.prescription_date && <Text style={styles.rxDate}>📅 {rx.prescription_date}</Text>}
        </View>
        <View style={[styles.badge, rx.is_active ? styles.badgeActive : styles.badgeInactive]}>
          <Text style={[styles.badgeText, rx.is_active ? styles.badgeTextActive : styles.badgeTextInactive]}>
            {rx.is_active ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>

      <Text style={styles.rxMeds}>💊 {medCount} medicine{medCount !== 1 ? 's' : ''} in prescription</Text>
      {rx.medication_count > 0 && (
        <Text style={styles.rxLinked}>🔗 {rx.medication_count} added to schedule</Text>
      )}

      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => onToggle(rx)}>
          <Text style={styles.actionBtnText}>{rx.is_active ? '⏸ Deactivate' : '▶ Activate'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={() => onDelete(rx)}>
          <Text style={[styles.actionBtnText, styles.deleteBtnText]}>🗑 Delete</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
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

  alertBanner: {
    backgroundColor: '#FFF8E6', borderRadius: SIZES.radius, padding: SIZES.medium,
    marginBottom: SIZES.medium, flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#FFCC00', ...SHADOWS.light,
  },
  alertIcon: {fontSize: 22, marginRight: SIZES.base},
  alertTitle: {fontSize: SIZES.font, fontWeight: '700', color: '#7D5A00'},
  alertSub: {fontSize: SIZES.small, color: '#A07800', marginTop: 2},
  alertChevron: {fontSize: 22, color: '#FFCC00', fontWeight: '700'},

  addBtn: {
    backgroundColor: COLORS.primary, borderRadius: SIZES.radius, padding: SIZES.medium,
    alignItems: 'center', marginBottom: SIZES.large, ...SHADOWS.medium,
  },
  addBtnText: {color: '#fff', fontWeight: '700', fontSize: SIZES.font},

  empty: {alignItems: 'center', paddingTop: 48},
  emptyIcon: {fontSize: 56, marginBottom: SIZES.medium},
  emptyTitle: {fontSize: 20, fontWeight: '700', color: COLORS.text, marginBottom: SIZES.base},
  emptyText: {fontSize: SIZES.font, color: COLORS.textLight, textAlign: 'center', lineHeight: 22},

  card: {
    backgroundColor: COLORS.surface, borderRadius: SIZES.radius, padding: SIZES.large,
    marginBottom: SIZES.medium, ...SHADOWS.medium, borderWidth: 1, borderColor: '#F0F0F0',
  },
  cardInactive: {opacity: 0.6},
  cardHeader: {flexDirection: 'row', alignItems: 'flex-start', marginBottom: SIZES.base},
  rxName: {fontSize: 17, fontWeight: '800', color: COLORS.text},
  textFaded: {color: COLORS.textLight},
  rxDoctor: {fontSize: SIZES.small, color: COLORS.textLight, marginTop: 4},
  rxDate: {fontSize: SIZES.small, color: COLORS.textLight, marginTop: 2},
  badge: {borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4, marginLeft: 8},
  badgeActive: {backgroundColor: '#E8F8EE'},
  badgeInactive: {backgroundColor: '#F5F5F5'},
  badgeText: {fontSize: 11, fontWeight: '700'},
  badgeTextActive: {color: COLORS.success},
  badgeTextInactive: {color: COLORS.textLight},
  rxMeds: {fontSize: SIZES.small, color: COLORS.textLight, marginBottom: 4},
  rxLinked: {fontSize: SIZES.small, color: COLORS.primary, marginBottom: SIZES.medium},
  cardActions: {flexDirection: 'row', gap: SIZES.base, marginTop: SIZES.base},
  actionBtn: {
    flex: 1, borderRadius: 10, borderWidth: 1.5, borderColor: COLORS.primary,
    padding: 8, alignItems: 'center',
  },
  actionBtnText: {fontSize: SIZES.small, color: COLORS.primary, fontWeight: '700'},
  deleteBtn: {borderColor: COLORS.error},
  deleteBtnText: {color: COLORS.error},
});
