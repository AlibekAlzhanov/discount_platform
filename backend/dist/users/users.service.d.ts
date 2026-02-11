import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
export declare class UsersService {
    private usersRepository;
    private readonly SALT_ROUNDS;
    private readonly MAX_LOGIN_ATTEMPTS;
    private readonly LOCK_TIME;
    constructor(usersRepository: Repository<User>);
    create(createUserDto: CreateUserDto): Promise<User>;
    findByEmail(email: string): Promise<User | null>;
    findById(id: string): Promise<User | null>;
    confirmEmail(token: string): Promise<void>;
    createPasswordResetToken(email: string): Promise<string>;
    resetPassword(token: string, newPassword: string): Promise<void>;
    updateRefreshToken(userId: string, refreshToken: string | null): Promise<void>;
    incrementLoginAttempts(userId: string): Promise<void>;
    resetLoginAttempts(userId: string): Promise<void>;
    private hashPassword;
    private generateToken;
    private hashToken;
}
