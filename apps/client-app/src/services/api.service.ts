import axios, { AxiosInstance, AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';

/**
 * Конфигурация API
 * 
 * В продакшене замените на реальный URL вашего бэкенда
 */
const API_URL = __DEV__ 
  ? 'http://localhost:3000/api'  // Для эмулятора Android используйте 10.0.2.2:3000
  : 'https://your-production-api.com/api';

/**
 * Ключи для хранения токенов в SecureStore
 */
const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

/**
 * Класс для работы с API
 * 
 * Функции:
 * - Автоматическое добавление токенов к запросам
 * - Автоматическое обновление access токена при истечении
 * - Безопасное хранение токенов в SecureStore
 */
class ApiService {
  private axiosInstance: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value?: any) => void;
    reject: (reason?: any) => void;
  }> = [];

  constructor() {
    // Создание экземпляра axios с базовыми настройками
    this.axiosInstance = axios.create({
      baseURL: API_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Настройка перехватчиков
    this.setupInterceptors();
  }

  /**
   * Настройка перехватчиков для автоматической работы с токенами
   */
  private setupInterceptors() {
    // Перехватчик запросов - добавляем access token
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        const token = await this.getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Перехватчик ответов - обработка ошибок авторизации
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest: any = error.config;

        // Если получили 401 и это не повторный запрос
        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            // Если уже обновляем токен, ждём завершения
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            })
              .then((token) => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                return this.axiosInstance(originalRequest);
              })
              .catch((err) => {
                return Promise.reject(err);
              });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const refreshToken = await this.getRefreshToken();
            
            if (!refreshToken) {
              throw new Error('No refresh token');
            }

            // Обновляем токены
            const response = await this.refreshTokens(refreshToken);
            const { accessToken, refreshToken: newRefreshToken } = response.data;

            await this.saveTokens(accessToken, newRefreshToken);

            // Повторяем все отложенные запросы
            this.failedQueue.forEach((prom) => {
              prom.resolve(accessToken);
            });
            this.failedQueue = [];

            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return this.axiosInstance(originalRequest);
          } catch (err) {
            this.failedQueue.forEach((prom) => {
              prom.reject(err);
            });
            this.failedQueue = [];

            // Очищаем токены при неудаче
            await this.clearTokens();
            return Promise.reject(err);
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * Сохранение токенов в SecureStore
   */
  async saveTokens(accessToken: string, refreshToken: string): Promise<void> {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
  }

  /**
   * Получение access токена
   */
  async getAccessToken(): Promise<string | null> {
    return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  }

  /**
   * Получение refresh токена
   */
  async getRefreshToken(): Promise<string | null> {
    return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  }

  /**
   * Очистка токенов (при выходе или ошибке)
   */
  async clearTokens(): Promise<void> {
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  }

  /**
   * Проверка наличия токена
   */
  async isAuthenticated(): Promise<boolean> {
    const token = await this.getAccessToken();
    return !!token;
  }

  // ==================== AUTH ENDPOINTS ====================

  /**
   * Регистрация
   */
  async register(data: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }) {
    return this.axiosInstance.post('/auth/register', data);
  }

  /**
   * Вход
   */
  async login(email: string, password: string) {
    const response = await this.axiosInstance.post('/auth/login', {
      email,
      password,
    });

    const { accessToken, refreshToken } = response.data;
    await this.saveTokens(accessToken, refreshToken);

    return response;
  }

  /**
   * Выход
   */
  async logout() {
    try {
      await this.axiosInstance.post('/auth/logout');
    } finally {
      await this.clearTokens();
    }
  }

  /**
   * Обновление токенов
   */
  async refreshTokens(refreshToken: string) {
    return this.axiosInstance.post('/auth/refresh', {
      refreshToken,
    });
  }

  /**
   * Подтверждение email
   */
  async confirmEmail(token: string) {
    return this.axiosInstance.post('/auth/confirm-email', { token });
  }

  /**
   * Запрос восстановления пароля
   */
  async forgotPassword(email: string) {
    return this.axiosInstance.post('/auth/forgot-password', { email });
  }

  /**
   * Сброс пароля
   */
  async resetPassword(token: string, password: string) {
    return this.axiosInstance.post('/auth/reset-password', {
      token,
      password,
    });
  }

  /**
   * Повторная отправка письма с подтверждением
   */
  async resendConfirmation(email: string) {
    return this.axiosInstance.post('/auth/resend-confirmation', { email });
  }

  /**
   * Получение профиля текущего пользователя
   */
  async getProfile() {
    return this.axiosInstance.get('/auth/me');
  }

  // ==================== GENERIC METHODS ====================

  /**
   * GET запрос
   */
  async get<T = any>(url: string, config?: any): Promise<T> {
    const response = await this.axiosInstance.get(url, config);
    return response.data;
  }

  /**
   * POST запрос
   */
  async post<T = any>(url: string, data?: any, config?: any): Promise<T> {
    const response = await this.axiosInstance.post(url, data, config);
    return response.data;
  }

  /**
   * PUT запрос
   */
  async put<T = any>(url: string, data?: any, config?: any): Promise<T> {
    const response = await this.axiosInstance.put(url, data, config);
    return response.data;
  }

  /**
   * DELETE запрос
   */
  async delete<T = any>(url: string, config?: any): Promise<T> {
    const response = await this.axiosInstance.delete(url, config);
    return response.data;
  }
}

// Экспортируем единственный экземпляр
export const apiService = new ApiService();

/**
 * Утилита для обработки ошибок API
 */
export const handleApiError = (error: any): string => {
  if (error.response) {
    // Сервер вернул ошибку
    const message = error.response.data?.message;
    
    if (Array.isArray(message)) {
      return message.join(', ');
    }
    
    return message || 'Произошла ошибка на сервере';
  } else if (error.request) {
    // Запрос был отправлен, но ответа не получено
    return 'Не удалось связаться с сервером. Проверьте подключение к интернету.';
  } else {
    // Ошибка при настройке запроса
    return error.message || 'Произошла неизвестная ошибка';
  }
};
