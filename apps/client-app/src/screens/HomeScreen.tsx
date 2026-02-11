import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { apiService, handleApiError } from '../services/api.service';

/**
 * Главный экран приложения
 * 
 * Отображается после успешной авторизации
 * Показывает информацию о пользователе и кнопку выхода
 */
export default function HomeScreen({ navigation }: any) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserProfile();
  }, []);

  /**
   * Загрузка профиля пользователя
   */
  const loadUserProfile = async () => {
    try {
      const response = await apiService.getProfile();
      setUser(response.data);
    } catch (error) {
      Alert.alert('Ошибка', handleApiError(error));
      // Если не удалось загрузить профиль, возвращаем на экран входа
      navigation.replace('Login');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Обработка выхода
   */
  const handleLogout = async () => {
    Alert.alert(
      'Выход',
      'Вы уверены, что хотите выйти?',
      [
        {
          text: 'Отмена',
          style: 'cancel',
        },
        {
          text: 'Выйти',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.logout();
              navigation.replace('Login');
            } catch (error) {
              Alert.alert('Ошибка', handleApiError(error));
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.welcomeText}>Добро пожаловать! 👋</Text>
          <Text style={styles.title}>Discount Platform</Text>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.email?.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.email}>{user?.email}</Text>
          <Text style={styles.userId}>ID: {user?.userId}</Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>✅ Авторизация работает!</Text>
          <Text style={styles.infoText}>
            Вы успешно вошли в систему. Ваша сессия защищена JWT токенами.
          </Text>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>• Access Token:</Text>
            <Text style={styles.infoValue}>Действителен 15 минут</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>• Refresh Token:</Text>
            <Text style={styles.infoValue}>Действителен 7 дней</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>• Хранение:</Text>
            <Text style={styles.infoValue}>SecureStore (зашифровано)</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Text style={styles.logoutButtonText}>Выйти</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginTop: 60,
    marginBottom: 30,
  },
  welcomeText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  email: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  userId: {
    fontSize: 12,
    color: '#999',
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  infoItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  logoutButton: {
    backgroundColor: '#ff4444',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
