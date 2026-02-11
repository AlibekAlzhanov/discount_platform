import { AuthService } from './auth.service';
import { LoginDto, RegisterDto, ConfirmEmailDto, ForgotPasswordDto, ResetPasswordDto, RefreshTokenDto } from './dto/auth.dto';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    register(registerDto: RegisterDto): Promise<{
        message: string;
        email: string;
    }>;
    login(loginDto: LoginDto): Promise<{
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
        };
        accessToken: string;
        refreshToken: string;
    }>;
    refreshTokens(user: any, refreshTokenDto: RefreshTokenDto): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    logout(user: any): Promise<{
        message: string;
    }>;
    confirmEmail(confirmEmailDto: ConfirmEmailDto): Promise<{
        message: string;
    }>;
    forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<{
        message: string;
    }>;
    resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{
        message: string;
    }>;
    resendConfirmation(body: {
        email: string;
    }): Promise<{
        message: string;
    }>;
    getProfile(user: any): Promise<{
        userId: any;
        email: any;
    }>;
}
