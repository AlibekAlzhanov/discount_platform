export declare class LoginDto {
    email: string;
    password: string;
}
export { CreateUserDto as RegisterDto } from '../../users/dto/create-user.dto';
export declare class ConfirmEmailDto {
    token: string;
}
export declare class ForgotPasswordDto {
    email: string;
}
export declare class ResetPasswordDto {
    token: string;
    password: string;
}
export declare class RefreshTokenDto {
    refreshToken: string;
}
