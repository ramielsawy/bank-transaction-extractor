import { Currency } from '../enums/Currency';

export interface AccountInfo {
    accountNumber: string;
    accountName: string;
    currency: Currency;
    balance: number;
    status: string;
} 