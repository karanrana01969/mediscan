import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView, DeviceEventEmitter,
} from 'react-native';
import { COLORS, SIZES, SHADOWS } from '../theme';
import api from '../services/api';
import { storageService } from '../services/storageService';
import { notificationService } from '../services/notificationService';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }
    try {
      setLoading(true);
      setError('');

      const response = await api.post('/auth/login', { email, password });
      const token = response.data.access_token;

      // Save JWT to persistent storage
      await storageService.saveToken(token);

      // Register FCM token with backend
      await notificationService.init();

      // Trigger navigation re-render in AppNavigator
      DeviceEventEmitter.emit('authStateChanged');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.logo}>💊</Text>
          <Text style={styles.title}>Mediscan</Text>
          <Text style={styles.subtitle}>Your AI medication assistant</Text>
        </View>

        <View style={styles.card}>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email"
            autoCapitalize="none"
            keyboardType="email-address"
            placeholderTextColor={COLORS.textLight}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Enter password"
            secureTextEntry
            placeholderTextColor={COLORS.textLight}
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.surface} />
            ) : (
              <Text style={styles.buttonText}>Log In</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('Signup')}
          >
            <Text style={styles.secondaryButtonText}>
              Don't have an account? <Text style={styles.signupLink}>Sign Up</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: SIZES.large },
  header: { marginBottom: SIZES.extraLarge, alignItems: 'center' },
  logo: { fontSize: 56, marginBottom: SIZES.base },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  subtitle: { fontSize: SIZES.font, color: COLORS.textLight },
  card: {
    backgroundColor: COLORS.surface,
    padding: SIZES.large,
    borderRadius: SIZES.radius,
    ...SHADOWS.medium,
  },
  label: {
    fontSize: SIZES.small,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SIZES.base,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#E8ECF4',
    borderRadius: SIZES.base,
    padding: SIZES.medium,
    marginBottom: SIZES.large,
    fontSize: SIZES.font,
    color: COLORS.text,
    backgroundColor: '#FAFBFF',
  },
  button: {
    backgroundColor: COLORS.primary,
    padding: SIZES.medium + 2,
    borderRadius: SIZES.radius,
    alignItems: 'center',
    marginTop: SIZES.base,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: COLORS.surface, fontSize: SIZES.font, fontWeight: '700' },
  secondaryButton: { marginTop: SIZES.large, alignItems: 'center' },
  secondaryButtonText: { color: COLORS.textLight, fontSize: SIZES.font },
  signupLink: { color: COLORS.primary, fontWeight: '700' },
  errorText: {
    color: COLORS.error,
    marginBottom: SIZES.medium,
    textAlign: 'center',
    fontSize: SIZES.small,
    backgroundColor: '#FFF0F0',
    padding: SIZES.base,
    borderRadius: 8,
  },
});
