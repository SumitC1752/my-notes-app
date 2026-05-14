import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Vibration,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { generateRoomId, generateUserId } from '../../utils/crypto';
import { saveSession } from '../../utils/session';

const BG = '#0D0D0D';
const ACCENT = '#00E5FF';

export default function UnlockScreen() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [error, setError] = useState(false);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const shake = () => {
    Vibration.vibrate(200);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const handleUnlock = async () => {
    if (code.trim().length < 6) {
      setError(true);
      shake();
      setTimeout(() => setError(false), 2000);
      return;
    }
    const roomId = generateRoomId(code.trim());
    const userId = generateUserId();
    await saveSession({
      roomId,
      userId,
      secretCode: code.trim(),
      connectedAt: Date.now(),
    });
    router.replace('/secret/chat');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={BG} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.container}>
          <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
            <Ionicons name="close" size={26} color="#555" />
          </TouchableOpacity>

          <View style={styles.center}>
            <View style={styles.iconRing}>
              <Ionicons name="lock-closed" size={36} color={ACCENT} />
            </View>

            <Text style={styles.heading}>Enter Secret Code</Text>
            <Text style={styles.sub}>Known only to you and your contact</Text>

            <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
              <TextInput
                style={[styles.input, error && styles.inputError]}
                placeholder="••••••••"
                placeholderTextColor="#444"
                value={code}
                onChangeText={setCode}
                secureTextEntry
                autoFocus
                maxLength={32}
                onSubmitEditing={handleUnlock}
              />
            </Animated.View>

            {error && (
              <Text style={styles.errorText}>Code must be at least 6 characters</Text>
            )}

            <TouchableOpacity style={styles.unlockBtn} onPress={handleUnlock} activeOpacity={0.85}>
              <Text style={styles.unlockBtnText}>Unlock</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  container: { flex: 1, backgroundColor: BG },
  closeBtn: { position: 'absolute', top: 16, right: 16, zIndex: 10, padding: 8 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  iconRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  heading: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },
  sub: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  input: {
    width: 260,
    backgroundColor: '#1A1A1A',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#2A2A2A',
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 20,
    color: '#fff',
    textAlign: 'center',
    letterSpacing: 6,
    marginTop: 8,
  },
  inputError: { borderColor: '#FF1744' },
  errorText: { color: '#FF1744', fontSize: 13 },
  unlockBtn: {
    backgroundColor: ACCENT,
    width: 260,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  unlockBtnText: { color: '#000', fontSize: 16, fontWeight: '700' },
});
