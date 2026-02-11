/**
 * Утилиты для валидации форм
 * 
 * Валидация на клиенте перед отправкой на сервер
 * ВАЖНО: Это не заменяет валидацию на сервере!
 */

/**
 * Валидация email
 */
export const validateEmail = (email: string): string | null => {
  if (!email) {
    return 'Email обязателен';
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Некорректный email адрес';
  }

  return null;
};

/**
 * Валидация пароля
 * 
 * Требования:
 * - Минимум 8 символов
 * - Минимум 1 заглавная буква
 * - Минимум 1 строчная буква
 * - Минимум 1 цифра
 * - Минимум 1 спецсимвол
 */
export const validatePassword = (password: string): string | null => {
  if (!password) {
    return 'Пароль обязателен';
  }

  if (password.length < 8) {
    return 'Пароль должен содержать минимум 8 символов';
  }

  if (!/[a-z]/.test(password)) {
    return 'Пароль должен содержать строчные буквы';
  }

  if (!/[A-Z]/.test(password)) {
    return 'Пароль должен содержать заглавные буквы';
  }

  if (!/\d/.test(password)) {
    return 'Пароль должен содержать цифры';
  }

  if (!/[@$!%*?&]/.test(password)) {
    return 'Пароль должен содержать спецсимволы (@$!%*?&)';
  }

  return null;
};

/**
 * Проверка совпадения паролей
 */
export const validatePasswordConfirmation = (
  password: string,
  confirmPassword: string
): string | null => {
  if (!confirmPassword) {
    return 'Подтверждение пароля обязательно';
  }

  if (password !== confirmPassword) {
    return 'Пароли не совпадают';
  }

  return null;
};

/**
 * Валидация имени
 */
export const validateName = (name: string, fieldName: string = 'Имя'): string | null => {
  if (!name) {
    return null; // Имя опционально
  }

  if (name.length < 2) {
    return `${fieldName} должно содержать минимум 2 символа`;
  }

  if (name.length > 50) {
    return `${fieldName} не может быть длиннее 50 символов`;
  }

  return null;
};

/**
 * Оценка силы пароля
 * 
 * @returns число от 0 до 100
 */
export const calculatePasswordStrength = (password: string): number => {
  let strength = 0;

  if (password.length >= 8) strength += 20;
  if (password.length >= 12) strength += 10;
  if (password.length >= 16) strength += 10;

  if (/[a-z]/.test(password)) strength += 15;
  if (/[A-Z]/.test(password)) strength += 15;
  if (/\d/.test(password)) strength += 15;
  if (/[@$!%*?&]/.test(password)) strength += 15;

  return Math.min(strength, 100);
};

/**
 * Получение текстового описания силы пароля
 */
export const getPasswordStrengthText = (strength: number): {
  text: string;
  color: string;
} => {
  if (strength < 30) {
    return { text: 'Слабый', color: '#ff4444' };
  } else if (strength < 60) {
    return { text: 'Средний', color: '#ffaa00' };
  } else if (strength < 80) {
    return { text: 'Хороший', color: '#00aa00' };
  } else {
    return { text: 'Отличный', color: '#00cc00' };
  }
};
