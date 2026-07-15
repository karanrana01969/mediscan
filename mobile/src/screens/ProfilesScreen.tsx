import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator,
  FlatList, Modal, TextInput, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DeviceEventEmitter } from 'react-native';
import { COLORS, SIZES, SHADOWS } from '../theme';
import api from '../services/api';
import { storageService } from '../services/storageService';
import { notificationService } from '../services/notificationService';

const AVATAR_COLORS = ['#4361EE', '#7209B7', '#F77F00', '#20BF55', '#EF233C', '#4CC9F0'];

interface Profile {
  id: number;
  name: string;
  age: number | null;
  health_info: string | null;
  avatar_color: string;
}

export default function ProfilesScreen({ navigation }: any) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAge, setNewAge] = useState('');
  const [newHealth, setNewHealth] = useState('');
  const [newAllergies, setNewAllergies] = useState('');
  const [newEmergencyName, setNewEmergencyName] = useState('');
  const [newEmergencyPhone, setNewEmergencyPhone] = useState('');
  const [selectedColor, setSelectedColor] = useState(AVATAR_COLORS[0]);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchProfiles(); }, []);

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      const res = await api.get('/profiles/');
      setProfiles(res.data);
    } catch (err: any) {
      console.error('Fetch Profiles Error:', err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProfile = async (profile: Profile) => {
    await storageService.saveProfile(profile.id, profile.name);
    // navigation.navigate('MainTabs', { profileId: profile.id, profileName: profile.name });
    // Instead of navigating, trigger AppNavigator to checkAuth and switch to MainTabs automatically
    DeviceEventEmitter.emit('authStateChanged');
  };

  const handleCreateProfile = async () => {
    if (!newName.trim()) { Alert.alert('Required', 'Name is required'); return; }
    try {
      setSaving(true);
      await api.post('/profiles/', {
        name: newName.trim(),
        age: parseInt(newAge) || null,
        health_info: newHealth.trim() || null,
        allergies: newAllergies.trim() || null,
        emergency_contact_name: newEmergencyName.trim() || null,
        emergency_contact_phone: newEmergencyPhone.trim() || null,
        avatar_color: selectedColor,
      });
      setModalVisible(false);
      clearForm();
      fetchProfiles();
    } catch (err: any) {
      console.error('Create Profile Error:', err.response?.data || err.message);
      Alert.alert('Error', err.response?.data?.detail ?? 'Failed to create profile');
    } finally {
      setSaving(false);
    }
  };

  const clearForm = () => {
    setNewName(''); setNewAge(''); setNewHealth('');
    setNewAllergies(''); setNewEmergencyName(''); setNewEmergencyPhone('');
    setSelectedColor(AVATAR_COLORS[0]);
  };

  const handleLogout = async () => {
    Alert.alert('Log Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out', style: 'destructive',
        onPress: async () => {
          await notificationService.unregister();
          await storageService.clearAll();
          DeviceEventEmitter.emit('authStateChanged');
        },
      },
    ]);
  };

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
          <Text style={styles.title}>Profiles</Text>
          <Text style={styles.subtitle}>Who are we caring for?</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={profiles}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        ListFooterComponent={
          profiles.length < 5 ? (
            <TouchableOpacity style={styles.addCard} onPress={() => setModalVisible(true)}>
              <Text style={styles.addCardIcon}>＋</Text>
              <Text style={styles.addCardText}>Add New Profile</Text>
            </TouchableOpacity>
          ) : null
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.profileCard} onPress={() => handleSelectProfile(item)}>
            <View style={[styles.avatar, { backgroundColor: item.avatar_color ?? COLORS.primary }]}>
              <Text style={styles.avatarLetter}>{item.name.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{item.name}</Text>
              <Text style={styles.profileDetails}>
                {item.age ? `Age ${item.age}` : ''}
                {item.age && item.health_info ? ' · ' : ''}
                {item.health_info ?? ''}
              </Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>👤</Text>
            <Text style={styles.emptyTitle}>No profiles yet</Text>
            <Text style={styles.emptySubtitle}>Create a profile for each person you're caring for</Text>
          </View>
        }
      />

      {/* Create Profile Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Profile</Text>

            {/* Avatar Color */}
            <Text style={styles.label}>Avatar Color</Text>
            <View style={styles.colorRow}>
              {AVATAR_COLORS.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.colorDot, { backgroundColor: c }, selectedColor === c && styles.colorDotSelected]}
                  onPress={() => setSelectedColor(c)}
                />
              ))}
            </View>

            <Text style={styles.label}>Full Name *</Text>
            <TextInput style={styles.input} value={newName} onChangeText={setNewName} placeholder="e.g. Grandma Rose" placeholderTextColor={COLORS.textLight} />

            <Text style={styles.label}>Age</Text>
            <TextInput style={styles.input} value={newAge} onChangeText={setNewAge} placeholder="e.g. 72" keyboardType="numeric" placeholderTextColor={COLORS.textLight} />

            <Text style={styles.label}>Health Conditions</Text>
            <TextInput style={styles.input} value={newHealth} onChangeText={setNewHealth} placeholder="e.g. Diabetes, Hypertension" placeholderTextColor={COLORS.textLight} />

            <Text style={styles.label}>Allergies</Text>
            <TextInput style={styles.input} value={newAllergies} onChangeText={setNewAllergies} placeholder="e.g. Penicillin" placeholderTextColor={COLORS.textLight} />

            <Text style={styles.label}>Emergency Contact Name</Text>
            <TextInput style={styles.input} value={newEmergencyName} onChangeText={setNewEmergencyName} placeholder="e.g. John Rana" placeholderTextColor={COLORS.textLight} />

            <Text style={styles.label}>Emergency Contact Phone</Text>
            <TextInput style={styles.input} value={newEmergencyPhone} onChangeText={setNewEmergencyPhone} placeholder="+91 98765 43210" keyboardType="phone-pad" placeholderTextColor={COLORS.textLight} />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => { setModalVisible(false); clearForm(); }}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.createBtn} onPress={handleCreateProfile} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.createBtnText}>Create</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingHorizontal: SIZES.large, paddingTop: SIZES.large, paddingBottom: SIZES.base,
  },
  title: { fontSize: 26, fontWeight: '800', color: COLORS.text },
  subtitle: { fontSize: SIZES.small, color: COLORS.textLight, marginTop: 2 },
  logoutBtn: { padding: SIZES.base },
  logoutText: { color: COLORS.error, fontWeight: '600', fontSize: SIZES.font },
  list: { padding: SIZES.large },

  profileCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius, padding: SIZES.medium, marginBottom: SIZES.medium, ...SHADOWS.light,
  },
  avatar: {
    width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', marginRight: SIZES.medium,
  },
  avatarLetter: { fontSize: 22, fontWeight: '800', color: '#fff' },
  profileInfo: { flex: 1 },
  profileName: { fontSize: SIZES.font, fontWeight: '700', color: COLORS.text },
  profileDetails: { fontSize: SIZES.small, color: COLORS.textLight, marginTop: 2 },
  chevron: { fontSize: 22, color: COLORS.textLight },

  addCard: {
    borderWidth: 2, borderColor: COLORS.primary, borderStyle: 'dashed',
    borderRadius: SIZES.radius, padding: SIZES.large, alignItems: 'center',
    flexDirection: 'row', justifyContent: 'center', gap: SIZES.base,
  },
  addCardIcon: { fontSize: 22, color: COLORS.primary },
  addCardText: { fontSize: SIZES.font, color: COLORS.primary, fontWeight: '700' },

  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyEmoji: { fontSize: 56, marginBottom: SIZES.medium },
  emptyTitle: { fontSize: SIZES.large, fontWeight: '700', color: COLORS.text },
  emptySubtitle: { fontSize: SIZES.font, color: COLORS.textLight, marginTop: 8, textAlign: 'center' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: COLORS.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: SIZES.large, paddingBottom: 40, maxHeight: '90%',
  },
  modalTitle: { fontSize: SIZES.large, fontWeight: '800', color: COLORS.text, marginBottom: SIZES.large, textAlign: 'center' },
  label: { fontSize: SIZES.small, fontWeight: '700', color: COLORS.textLight, textTransform: 'uppercase', marginBottom: 6, marginTop: 8 },
  colorRow: { flexDirection: 'row', gap: SIZES.base, marginBottom: SIZES.base },
  colorDot: { width: 32, height: 32, borderRadius: 16 },
  colorDotSelected: { borderWidth: 3, borderColor: COLORS.text },
  input: {
    borderWidth: 1.5, borderColor: '#E8ECF4', borderRadius: SIZES.base,
    padding: SIZES.medium, marginBottom: 4, fontSize: SIZES.font,
    color: COLORS.text, backgroundColor: '#FAFBFF',
  },
  modalButtons: { flexDirection: 'row', gap: SIZES.base, marginTop: SIZES.large },
  cancelBtn: { flex: 1, padding: SIZES.medium, borderRadius: SIZES.radius, alignItems: 'center', backgroundColor: '#F0F0F0' },
  cancelBtnText: { fontWeight: '700', color: COLORS.text },
  createBtn: { flex: 1, padding: SIZES.medium, borderRadius: SIZES.radius, alignItems: 'center', backgroundColor: COLORS.primary },
  createBtnText: { fontWeight: '700', color: '#fff' },
});
