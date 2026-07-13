import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, RefreshControl, Modal, TextInput, Alert } from 'react-native';
import { COLORS, SIZES, SHADOWS } from '../theme';
import api from '../services/api';

export default function ProfilesScreen({ navigation }: any) {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAge, setNewAge] = useState('');
  const [newHealth, setNewHealth] = useState('');

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      const res = await api.get('/profiles/');
      setProfiles(res.data);
    } catch (err) {
      console.error('Fetch Profiles Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const handleCreateProfile = async () => {
    if (!newName.trim()) {
      Alert.alert("Error", "Name is required");
      return;
    }
    try {
      setLoading(true);
      await api.post('/profiles/', {
        name: newName,
        age: parseInt(newAge) || 0,
        health_info: newHealth,
        allergies: ""
      });
      setModalVisible(false);
      setNewName('');
      setNewAge('');
      setNewHealth('');
      fetchProfiles();
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.detail || "Failed to create profile");
    } finally {
      setLoading(false);
    }
  };

  const selectProfile = (profile: any) => {
    navigation.navigate('Scanner', { profileId: profile.id, profileName: profile.name });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Select Profile</Text>
        <Text style={styles.subtitle}>Who are we caring for today?</Text>
      </View>

      {loading && profiles.length === 0 ? (
        <ActivityIndicator size="large" color={COLORS.primary} />
      ) : (
        <ScrollView 
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchProfiles} />}
        >
          {profiles.map((p: any) => (
            <TouchableOpacity key={p.id} style={styles.card} onPress={() => selectProfile(p)}>
              <Text style={styles.profileName}>{p.name}</Text>
              <Text style={styles.profileDetails}>Age: {p.age} • {p.health_info || 'No health info'}</Text>
            </TouchableOpacity>
          ))}

          {profiles.length < 5 && (
            <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
              <Text style={styles.addButtonText}>+ Add New Profile</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Profile</Text>

            <TextInput
              style={styles.input}
              placeholder="Full Name"
              value={newName}
              onChangeText={setNewName}
              placeholderTextColor={COLORS.textLight}
            />

            <TextInput
              style={styles.input}
              placeholder="Age"
              value={newAge}
              onChangeText={setNewAge}
              keyboardType="numeric"
              placeholderTextColor={COLORS.textLight}
            />

            <TextInput
              style={[styles.input, { height: 80 }]}
              placeholder="Health Info (e.g. Hypertension)"
              value={newHealth}
              onChangeText={setNewHealth}
              multiline
              placeholderTextColor={COLORS.textLight}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#E2E8F0' }]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalButtonTextGrey}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: COLORS.primary }]}
                onPress={handleCreateProfile}
              >
                <Text style={styles.modalButtonText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: SIZES.large, paddingTop: 60 },
  header: { marginBottom: SIZES.extraLarge },
  title: { fontSize: SIZES.extraLarge, fontWeight: 'bold', color: COLORS.primary },
  subtitle: { fontSize: SIZES.font, color: COLORS.textLight, marginTop: 4 },
  list: { paddingBottom: SIZES.large },
  card: { backgroundColor: COLORS.surface, padding: SIZES.large, borderRadius: SIZES.radius, marginBottom: SIZES.medium, ...SHADOWS.light },
  profileName: { fontSize: SIZES.medium, fontWeight: 'bold', color: COLORS.text },
  profileDetails: { fontSize: SIZES.small, color: COLORS.textLight, marginTop: 4 },
  addButton: { borderStyle: 'dashed', borderWidth: 2, borderColor: COLORS.primary, padding: SIZES.large, borderRadius: SIZES.radius, alignItems: 'center', marginTop: SIZES.medium },
  addButtonText: { color: COLORS.primary, fontWeight: 'bold', fontSize: SIZES.font },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: SIZES.large },
  modalContent: { backgroundColor: COLORS.surface, padding: SIZES.large, borderRadius: SIZES.radius, ...SHADOWS.medium },
  modalTitle: { fontSize: SIZES.large, fontWeight: 'bold', color: COLORS.primary, marginBottom: SIZES.large, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: SIZES.base, padding: SIZES.medium, marginBottom: SIZES.medium, fontSize: SIZES.font, color: COLORS.text },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: SIZES.large },
  modalButton: { flex: 0.48, padding: SIZES.medium, borderRadius: SIZES.radius, alignItems: 'center' },
  modalButtonText: { color: COLORS.surface, fontWeight: 'bold' },
  modalButtonTextGrey: { color: COLORS.text, fontWeight: 'bold' }
});
