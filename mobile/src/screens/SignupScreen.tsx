import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform, DeviceEventEmitter,
} from 'react-native';
import { COLORS, SIZES, SHADOWS } from '../theme';
import api from '../services/api';
import { storageService } from '../services/storageService';
import { notificationService } from '../services/notificationService';

export default function SignupScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignup = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Email and password are required.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    try {
      setLoading(true);
      setError('');
      const res = await api.post('/auth/signup', { email, password });
      const token = res.data.access_token;

      // Persist JWT
      await storageService.saveToken(token);

      // Register FCM token
      await notificationService.init();

      // Trigger navigation re-render in AppNavigator
      DeviceEventEmitter.emit('authStateChanged');
    } catch (err: any) {
      setError(err.response?.data?.detail ?? 'Signup failed. Try again.');
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
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join Mediscan today</Text>
        </View>

        <View style={styles.card}>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor={COLORS.textLight}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Create a password (min 6 chars)"
            secureTextEntry
            placeholderTextColor={COLORS.textLight}
          />

          <Text style={styles.label}>Confirm Password</Text>
          <TextInput
            style={styles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Re-enter your password"
            secureTextEntry
            placeholderTextColor={COLORS.textLight}
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSignup}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.surface} />
            ) : (
              <Text style={styles.buttonText}>Create Account</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.secondaryButtonText}>
              Already have an account? <Text style={styles.loginLink}>Log In</Text>
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
  title: { fontSize: 34, fontWeight: '800', color: COLORS.primary, marginBottom: 4, letterSpacing: -0.5 },
  subtitle: { fontSize: SIZES.font, color: COLORS.textLight },
  card: {
    backgroundColor: COLORS.surface, padding: SIZES.large,
    borderRadius: SIZES.radius, ...SHADOWS.medium,
  },
  label: {
    fontSize: SIZES.small, fontWeight: '700', color: COLORS.text,
    marginBottom: SIZES.base, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1.5, borderColor: '#E8ECF4', borderRadius: SIZES.base,
    padding: SIZES.medium, marginBottom: SIZES.large, fontSize: SIZES.font,
    color: COLORS.text, backgroundColor: '#FAFBFF',
  },
  button: {
    backgroundColor: COLORS.primary, padding: SIZES.medium + 2,
    borderRadius: SIZES.radius, alignItems: 'center', marginTop: SIZES.base,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: COLORS.surface, fontSize: SIZES.font, fontWeight: '700' },
  secondaryButton: { marginTop: SIZES.large, alignItems: 'center' },
  secondaryButtonText: { color: COLORS.textLight, fontSize: SIZES.font },
  loginLink: { color: COLORS.primary, fontWeight: '700' },
  errorText: {
    color: COLORS.error, marginBottom: SIZES.medium, textAlign: 'center',
    fontSize: SIZES.small, backgroundColor: '#FFF0F0', padding: SIZES.base, borderRadius: 8,
  },
});
