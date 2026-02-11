"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const bcrypt = require("bcrypt");
const users_service_1 = require("../users/users.service");
const mail_service_1 = require("../mail/mail.service");
let AuthService = class AuthService {
    constructor(usersService, jwtService, configService, mailService) {
        this.usersService = usersService;
        this.jwtService = jwtService;
        this.configService = configService;
        this.mailService = mailService;
    }
    async register(createUserDto) {
        const user = await this.usersService.create(createUserDto);
        await this.mailService.sendEmailConfirmation(user.email, user.emailConfirmationToken, user.firstName);
        return {
            message: 'Регистрация успешна! Проверьте email для подтверждения аккаунта.',
            email: user.email,
        };
    }
    async login(loginDto) {
        const { email, password } = loginDto;
        const user = await this.usersService.findByEmail(email);
        if (!user) {
            throw new common_1.UnauthorizedException('Неверный email или пароль');
        }
        if (user.isLocked) {
            const lockTimeRemaining = Math.ceil((user.lockUntil.getTime() - Date.now()) / 1000 / 60);
            throw new common_1.UnauthorizedException(`Аккаунт временно заблокирован. Попробуйте снова через ${lockTimeRemaining} минут.`);
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            await this.usersService.incrementLoginAttempts(user.id);
            throw new common_1.UnauthorizedException('Неверный email или пароль');
        }
        if (!user.isEmailConfirmed) {
            throw new common_1.UnauthorizedException('Email не подтверждён. Проверьте почту и подтвердите регистрацию.');
        }
        await this.usersService.resetLoginAttempts(user.id);
        const tokens = await this.generateTokens(user.id, user.email);
        await this.usersService.updateRefreshToken(user.id, tokens.refreshToken);
        return {
            ...tokens,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
            },
        };
    }
    async refreshTokens(userId, refreshToken) {
        const user = await this.usersService.findById(userId);
        if (!user || !user.refreshToken) {
            throw new common_1.UnauthorizedException('Доступ запрещён');
        }
        const refreshTokenMatches = await bcrypt.compare(refreshToken, user.refreshToken);
        if (!refreshTokenMatches) {
            throw new common_1.UnauthorizedException('Доступ запрещён');
        }
        const tokens = await this.generateTokens(user.id, user.email);
        await this.usersService.updateRefreshToken(user.id, tokens.refreshToken);
        return tokens;
    }
    async logout(userId) {
        await this.usersService.updateRefreshToken(userId, null);
        return { message: 'Вы успешно вышли из системы' };
    }
    async confirmEmail(token) {
        await this.usersService.confirmEmail(token);
        return { message: 'Email успешно подтверждён! Теперь вы можете войти в систему.' };
    }
    async forgotPassword(email) {
        try {
            const token = await this.usersService.createPasswordResetToken(email);
            const user = await this.usersService.findByEmail(email);
            await this.mailService.sendPasswordReset(email, token, user.firstName);
            return {
                message: 'Инструкции по восстановлению пароля отправлены на email',
            };
        }
        catch (error) {
            return {
                message: 'Если email зарегистрирован, инструкции будут отправлены',
            };
        }
    }
    async resetPassword(token, newPassword) {
        await this.usersService.resetPassword(token, newPassword);
        return { message: 'Пароль успешно изменён! Теперь вы можете войти с новым паролем.' };
    }
    async resendConfirmationEmail(email) {
        const user = await this.usersService.findByEmail(email);
        if (!user) {
            throw new common_1.BadRequestException('Пользователь не найден');
        }
        if (user.isEmailConfirmed) {
            throw new common_1.ConflictException('Email уже подтверждён');
        }
        await this.mailService.sendEmailConfirmation(user.email, user.emailConfirmationToken, user.firstName);
        return { message: 'Письмо с подтверждением отправлено повторно' };
    }
    async generateTokens(userId, email) {
        const payload = { sub: userId, email };
        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(payload, {
                secret: this.configService.get('JWT_ACCESS_SECRET'),
                expiresIn: this.configService.get('JWT_ACCESS_EXPIRATION'),
            }),
            this.jwtService.signAsync(payload, {
                secret: this.configService.get('JWT_REFRESH_SECRET'),
                expiresIn: this.configService.get('JWT_REFRESH_EXPIRATION'),
            }),
        ]);
        return {
            accessToken,
            refreshToken,
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        jwt_1.JwtService,
        config_1.ConfigService,
        mail_service_1.MailService])
], AuthService);
//# sourceMappingURL=auth.service.js.map