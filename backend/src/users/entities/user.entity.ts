import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * Сущность пользователя в базе данных
 * 
 * Хранит основную информацию о пользователе:
 * - Учётные данные (email, пароль)
 * - Статус подтверждения email
 * - Токены для подтверждения и восстановления
 * - Даты создания и обновления
 */
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  @Index() // Индекс для быстрого поиска по email
  email: string;

  @Column()
  password: string; // Хранится в хэшированном виде (bcrypt)

  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  // Подтверждение email
  @Column({ default: false })
  isEmailConfirmed: boolean;

  @Column({ nullable: true })
  emailConfirmationToken: string; // Токен для подтверждения email (хэшированный)

  @Column({ nullable: true })
  emailConfirmationExpires: Date; // Срок действия токена

  // Восстановление пароля
  @Column({ nullable: true })
  passwordResetToken: string; // Токен для сброса пароля (хэшированный)

  @Column({ nullable: true })
  passwordResetExpires: Date; // Срок действия токена

  // Refresh token для JWT
  @Column({ nullable: true })
  refreshToken: string; // Хэшированный refresh token

  // Безопасность
  @Column({ default: 0 })
  loginAttempts: number; // Счётчик неудачных попыток входа

  @Column({ nullable: true })
  lockUntil: Date; // Время блокировки после неудачных попыток

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  /**
   * Проверка, заблокирован ли аккаунт
   */
  get isLocked(): boolean {
    return !!(this.lockUntil && this.lockUntil > new Date());
  }
}
