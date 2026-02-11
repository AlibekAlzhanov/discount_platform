export declare class User {
    id: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    isEmailConfirmed: boolean;
    emailConfirmationToken: string;
    emailConfirmationExpires: Date;
    passwordResetToken: string;
    passwordResetExpires: Date;
    refreshToken: string;
    loginAttempts: number;
    lockUntil: Date;
    createdAt: Date;
    updatedAt: Date;
    get isLocked(): boolean;
}
