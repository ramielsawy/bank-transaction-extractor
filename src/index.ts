import { Currency } from './enums/Currency';
import { Transaction } from './types/Transaction';
import { AccountInfo } from './types/AccountInfo';
import { resolveBankProvider } from './providers';

export { Currency } from './enums/Currency';
export { Transaction } from './types/Transaction';
export { AccountInfo } from './types/AccountInfo';
export {
  navigateToAccountsPage,
  getAccountNumbers,
  getAccountsInfo,
} from './services/AccountService';
export {
  listSupportedBankIds,
  isSupportedBankId,
  resolveBankProvider,
  UnknownBankError,
} from './providers';

const DEFAULT_BANK_ID = 'cib';

function resolveBankId(bankId?: string): string {
  return (bankId || process.env.BANK_ID || DEFAULT_BANK_ID).toLowerCase();
}

/**
 * Get transactions from a bank account
 */
export async function getTransactions(
  username: string,
  password: string,
  accountNumber: string,
  targetCurrency?: Currency,
  exchangeRate?: number,
  bankId?: string
): Promise<Transaction[]> {
  const provider = resolveBankProvider(resolveBankId(bankId));
  return provider.getTransactions(username, password, accountNumber, targetCurrency, exchangeRate);
}

/**
 * Get list of all account numbers from the bank
 */
export async function getAllAccountNumbers(
  username: string,
  password: string,
  bankId?: string
): Promise<string[]> {
  const provider = resolveBankProvider(resolveBankId(bankId));
  return provider.getAllAccountNumbers(username, password);
}

/**
 * Get detailed information about all accounts from the bank
 */
export async function getAllAccountsInfo(
  username: string,
  password: string,
  bankId?: string
): Promise<AccountInfo[]> {
  const provider = resolveBankProvider(resolveBankId(bankId));
  return provider.getAllAccountsInfo(username, password);
}
