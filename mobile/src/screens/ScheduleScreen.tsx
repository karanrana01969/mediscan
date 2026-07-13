import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, RefreshControl, Alert } from 'react-native';
import { COLORS, SIZES, SHADOWS } from '../theme';
import api from '../services/api';

export default function ScheduleScreen({ route }: any) {
  const { profileId, profileName } = route.params || { profileId: 1, profileName: 'Test Profile' };
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMedications = async () => {
    try {
      const res = await api.get(`/medications/${profileId}`);
      setMedications(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedications();
  }, [profileId]);

  const markTaken = async (scheduleId: number) => {
    try {
      await api.post(`/medications/log/${scheduleId}?status=taken`);
      Alert.alert("Success", "Medication marked as taken!");
      fetchMedications();
    } catch (err) {
      Alert.alert("Error", "Could not log medication.");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Schedule</Text>
        <Text style={styles.subtitle}>Medications for {profileName}</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} />
      ) : (
        <ScrollView 
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchMedications} />}
        >
          {medications.length === 0 ? (
            <Text style={styles.emptyText}>No medications found.</Text>
          ) : (
            medications.map((m: any) => (
              <View key={m.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.medName}>{m.name}</Text>
                  <Text style={styles.pillCount}>{m.remaining_pills} pills left</Text>
                </View>
                <Text style={styles.medDetails}>{m.use_case} • {m.dosage}</Text>
                
                {m.schedules && m.schedules.length > 0 ? (
                  m.schedules.map((s: any) => (
                    <View key={s.id} style={styles.scheduleRow}>
                      <Text style={styles.scheduleText}>{s.days_of_week} at {s.time_of_day}</Text>
                      <TouchableOpacity style={styles.takenButton} onPress={() => markTaken(s.id)}>
                        <Text style={styles.takenButtonText}>Take</Text>
                      </TouchableOpacity>
                    </View>
                  ))
                ) : (
                  <TouchableOpacity style={styles.addScheduleButton} onPress={() => {/* TODO */}}>
                    <Text style={styles.addScheduleText}>+ Add Schedule</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: SIZES.large, paddingTop: 60 },
  header: { marginBottom: SIZES.large },
  title: { fontSize: SIZES.extraLarge, fontWeight: 'bold', color: COLORS.primary },
  subtitle: { fontSize: SIZES.font, color: COLORS.textLight, marginTop: 4 },
  list: { paddingBottom: SIZES.large },
  emptyText: { textAlign: 'center', color: COLORS.textLight, marginTop: SIZES.extraLarge },
  card: { backgroundColor: COLORS.surface, padding: SIZES.large, borderRadius: SIZES.radius, marginBottom: SIZES.large, ...SHADOWS.medium },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  medName: { fontSize: SIZES.large, fontWeight: 'bold', color: COLORS.text },
  pillCount: { fontSize: SIZES.small, color: COLORS.primary, fontWeight: '600' },
  medDetails: { fontSize: SIZES.font, color: COLORS.textLight, marginTop: 4, marginBottom: SIZES.medium },
  scheduleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.secondary, padding: SIZES.medium, borderRadius: SIZES.base, marginTop: SIZES.base },
  scheduleText: { fontSize: SIZES.font, color: COLORS.text, fontWeight: '500' },
  takenButton: { backgroundColor: COLORS.success, paddingHorizontal: SIZES.medium, paddingVertical: 8, borderRadius: SIZES.radius },
  takenButtonText: { color: COLORS.surface, fontWeight: 'bold', fontSize: SIZES.small },
  addScheduleButton: { marginTop: SIZES.base, padding: SIZES.medium, alignItems: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: COLORS.primary, borderRadius: SIZES.base },
  addScheduleText: { color: COLORS.primary, fontWeight: 'bold' }
});
