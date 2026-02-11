import { IsEmail, IsString, MinLength } from 'class-validator';

/**
 * DTO для входа в систему
 */
export class LoginDto {
  @IsEmail({}, { message: 'Некорректный email адрес' })
  email: string;

  @IsString()
  @MinLength(1, { message: 'Пароль не может быть пустым' })
  password: string;
}

/**
 * DTO для регистрации (наследует CreateUserDto из users модуля)
 */
export { CreateUserDto as RegisterDto } from '../../users/dto/create-user.dto';

/**
 * DTO для подтверждения email
 */
export class ConfirmEmailDto {
  @IsString()
  token: string;
}

/**
 * DTO для запроса восстановления пароля
 */
export class ForgotPasswordDto {
  @IsEmail({}, { message: 'Некорректный email адрес' })
  email: string;
}

/**
 * DTO для сброса пароля
 */
export class ResetPasswordDto {
  @IsString()
  token: string;

  @IsString()
  @MinLength(8, { message: 'Пароль должен содержать минимум 8 символов' })
  password: string;
}

/**
 * DTO для обновления токена
 */
export class RefreshTokenDto {
  @IsString()
  refreshToken: string;
}
