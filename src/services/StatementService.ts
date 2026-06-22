import { stringify } from 'csv-stringify/sync';
import { Transaction } from '../types/Transaction';

export function transactionsToCsv(transactions: Transaction[]): string {
  return stringify(transactions, { header: true });
}

export function isValidAccountNumber(accountNumber: string): boolean {
  return !accountNumber.includes('data-testid') && !accountNumber.includes('[');
}
