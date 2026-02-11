import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { apiService, handleApiError } from '../src/services/api.service';
import { validatePassword, calculatePasswordStrength, getPasswordStrengthText } from '../src/utils/validation';

const screenWidth = Dimensions.get('window').width;

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleResetPassword = async () => {
    const token = params.token as string;
    if (!token) { 
      Alert.alert('Ошибка', 'Токен сброса пароля не найден'); 
      return; 
    }

    const passwordError = validatePassword(password);
    if (passwordError) { 
      Alert.alert('Ошибка', passwordError); 
      return; 
    }

    if (password !== confirmPassword) { 
      Alert.alert('Ошибка', 'Пароли не совпадают'); 
      return; 
    }

    setLoading(true);
    try {
      await apiService.resetPassword(token, password);
      Alert.alert(
        'Успешно! 🎉', 
        'Пароль успешно изменён. Теперь вы можете войти с новым паролем.', 
        [{ text: 'OK', onPress: () => router.replace('/login') }]
      );
    } catch (error) {
      Alert.alert('Ошибка', handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  const renderPasswordStrength = () => {
    if (!password) return null;

    const strength = calculatePasswordStrength(password);
    const { text, color } = getPasswordStrengthText(strength);

    // Вычисляем ширину полоски в пикселях
    const fillWidth = (screenWidth - 40) * (strength / 100); 
    // 40 = padding контейнера

    return (
      <View style={styles.passwordStrengthContainer}>
        <View style={styles.passwordStrengthBar}>
          <View
            style={[
              styles.passwordStrengthFill,
              { width: fillWidth, backgroundColor: color },
            ]}
          />
        </View>
        <Text style={[styles.passwordStrengthText, { color }]}>{text}</Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Новый пароль</Text>
          <Text style={styles.subtitle}>
            Придумайте надёжный пароль для вашего аккаунта
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Новый пароль</Text>
            <View style={styles.passwordContainer}>
              <TextInput 
                style={[styles.input, styles.passwordInput]} 
                placeholder="Минимум 8 символов" 
                value={password} 
                onChangeText={setPassword} 
                secureTextEntry={!showPassword} 
                autoCapitalize="none" 
              />
              <TouchableOpacity 
                style={styles.showPasswordButton} 
                onPress={() => setShowPassword(!showPassword)}
              >
                <Text style={styles.showPasswordText}>
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </Text>
              </TouchableOpacity>
            </View>
            {renderPasswordStrength()}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Подтвердите пароль</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Повторите пароль" 
              value={confirmPassword} 
              onChangeText={setConfirmPassword} 
              secureTextEntry={!showPassword} 
              autoCapitalize="none" 
            />
          </View>

          <TouchableOpacity 
            style={[styles.button, loading && styles.buttonDisabled]} 
            onPress={handleResetPassword} 
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Сбросить пароль</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.replace('/login')}
          >
            <Text style={styles.backButtonText}>← Вернуться к входу</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { flex: 1, padding: 20, justifyContent: 'center' },
  header: { marginBottom: 40 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#666' },
  form: { 
    backgroundColor: '#fff', 
    borderRadius: 12, 
    padding: 20, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 4, 
    elevation: 3 
  },
  inputContainer: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 },
  input: { 
    borderWidth: 1, 
    borderColor: '#ddd', 
    borderRadius: 8, 
    padding: 12, 
    fontSize: 16, 
    backgroundColor: '#fff' 
  },
  passwordContainer: { position: 'relative' },
  passwordInput: { paddingRight: 50 },
  showPasswordButton: { position: 'absolute', right: 12, top: 12 },
  showPasswordText: { fontSize: 20 },
  passwordStrengthContainer: { marginTop: 8 },
  passwordStrengthBar: { height: 4, backgroundColor: '#eee', borderRadius: 2, overflow: 'hidden' },
  passwordStrengthFill: { height: '100%', borderRadius: 2 },
  passwordStrengthText: { fontSize: 12, marginTop: 4, fontWeight: '600' },
  button: { backgroundColor: '#4CAF50', borderRadius: 8, padding: 16, alignItems: 'center', marginTop: 10 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  backButton: { marginTop: 20, alignItems: 'center' },
  backButtonText: { color: '#666', fontSize: 14 },
});
