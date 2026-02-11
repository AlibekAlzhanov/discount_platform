import { ConfigService } from '@nestjs/config';
export declare class MailService {
    private configService;
    private transporter;
    constructor(configService: ConfigService);
    sendEmailConfirmation(email: string, token: string, userName?: string): Promise<void>;
    sendPasswordReset(email: string, token: string, userName?: string): Promise<void>;
    private sendMail;
    private renderTemplate;
    private getBuiltInTemplate;
}
