import { Currency } from '../enums/Currency';
import { AccountInfo } from '../types/AccountInfo';
import { Transaction } from '../types/Transaction';

export interface BankProvider {
  readonly id: string;
  readonly name: string;
  validateConfig(): void;
  getTransactions(
    username: string,
    password: string,
    accountNumber: string,
    targetCurrency?: Currency,
    exchangeRate?: number
  ): Promise<Transaction[]>;
  getAllAccountNumbers(username: string, password: string): Promise<string[]>;
  getAllAccountsInfo(username: string, password: string): Promise<AccountInfo[]>;
}
