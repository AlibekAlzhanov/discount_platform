import { IsEmail, IsString, MinLength, Matches, IsOptional } from 'class-validator';

/**
 * DTO для создания пользователя
 * 
 * Валидация:
 * - Email: корректный формат email
 * - Пароль: минимум 8 символов, 1 заглавная, 1 цифра, 1 спецсимвол
 * - Имя и фамилия: опциональны
 */
export class CreateUserDto {
  @IsEmail({}, { message: 'Некорректный email адрес' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'Пароль должен содержать минимум 8 символов' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    {
      message: 'Пароль должен содержать: заглавные и строчные буквы, цифру и спецсимвол (@$!%*?&)',
    },
  )
  password: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;
}
