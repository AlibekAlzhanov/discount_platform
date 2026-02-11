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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const user_entity_1 = require("./entities/user.entity");
let UsersService = class UsersService {
    constructor(usersRepository) {
        this.usersRepository = usersRepository;
        this.SALT_ROUNDS = 10;
        this.MAX_LOGIN_ATTEMPTS = 5;
        this.LOCK_TIME = 2 * 60 * 60 * 1000;
    }
    async create(createUserDto) {
        const existingUser = await this.findByEmail(createUserDto.email);
        if (existingUser) {
            throw new common_1.ConflictException('Пользователь с таким email уже существует');
        }
        const hashedPassword = await this.hashPassword(createUserDto.password);
        const { token, hashedToken, expiresAt } = this.generateToken();
        const user = this.usersRepository.create({
            ...createUserDto,
            password: hashedPassword,
            emailConfirmationToken: hashedToken,
            emailConfirmationExpires: expiresAt,
        });
        const savedUser = await this.usersRepository.save(user);
        Object.assign(savedUser, { emailConfirmationToken: token });
        return savedUser;
    }
    async findByEmail(email) {
        return this.usersRepository.findOne({ where: { email } });
    }
    async findById(id) {
        return this.usersRepository.findOne({ where: { id } });
    }
    async confirmEmail(token) {
        const hashedToken = this.hashToken(token);
        const user = await this.usersRepository.findOne({
            where: {
                emailConfirmationToken: hashedToken,
            },
        });
        if (!user) {
            throw new common_1.NotFoundException('Токен подтверждения недействителен');
        }
        if (user.emailConfirmationExpires < new Date()) {
            throw new common_1.ConflictException('Токен подтверждения истёк');
        }
        user.isEmailConfirmed = true;
        user.emailConfirmationToken = null;
        user.emailConfirmationExpires = null;
        await this.usersRepository.save(user);
    }
    async createPasswordResetToken(email) {
        const user = await this.findByEmail(email);
        if (!user) {
            throw new common_1.NotFoundException('Пользователь не найден');
        }
        if (!user.isEmailConfirmed) {
            throw new common_1.ConflictException('Email не подтверждён');
        }
        const { token, hashedToken, expiresAt } = this.generateToken();
        user.passwordResetToken = hashedToken;
        user.passwordResetExpires = expiresAt;
        await this.usersRepository.save(user);
        return token;
    }
    async resetPassword(token, newPassword) {
        const hashedToken = this.hashToken(token);
        const user = await this.usersRepository.findOne({
            where: {
                passwordResetToken: hashedToken,
            },
        });
        if (!user) {
            throw new common_1.NotFoundException('Токен сброса пароля недействителен');
        }
        if (user.passwordResetExpires < new Date()) {
            throw new common_1.ConflictException('Токен сброса пароля истёк');
        }
        user.password = await this.hashPassword(newPassword);
        user.passwordResetToken = null;
        user.passwordResetExpires = null;
        user.loginAttempts = 0;
        user.lockUntil = null;
        await this.usersRepository.save(user);
    }
    async updateRefreshToken(userId, refreshToken) {
        const hashedRefreshToken = refreshToken ? await this.hashPassword(refreshToken) : null;
        await this.usersRepository.update(userId, {
            refreshToken: hashedRefreshToken,
        });
    }
    async incrementLoginAttempts(userId) {
        const user = await this.findById(userId);
        if (!user)
            return;
        const updates = {
            loginAttempts: user.loginAttempts + 1,
        };
        if (user.loginAttempts + 1 >= this.MAX_LOGIN_ATTEMPTS) {
            updates.lockUntil = new Date(Date.now() + this.LOCK_TIME);
        }
        await this.usersRepository.update(userId, updates);
    }
    async resetLoginAttempts(userId) {
        await this.usersRepository.update(userId, {
            loginAttempts: 0,
            lockUntil: null,
        });
    }
    async hashPassword(password) {
        return bcrypt.hash(password, this.SALT_ROUNDS);
    }
    generateToken() {
        const token = crypto.randomBytes(32).toString('hex');
        const hashedToken = this.hashToken(token);
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        return { token, hashedToken, expiresAt };
    }
    hashToken(token) {
        return crypto.createHash('sha256').update(token).digest('hex');
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], UsersService);
//# sourceMappingURL=users.service.js.map