import { stringify } from 'csv-stringify/sync';
import { Transaction } from '../types/Transaction';

export function transactionsToCsv(transactions: Transaction[]): string {
  return stringify(transactions, { header: true });
}

export function isValidAccountNumber(accountNumber: string): boolean {
  return !accountNumber.includes('data-testid') && !accountNumber.includes('[');
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

export function buildStatementFilename(accountNumber: string, date = new Date()): string {
  const timestamp = [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    pad(date.getHours()),
    pad(date.getMinutes()),
  ].join('-');

  return `${timestamp}-statement-${accountNumber}.csv`;
}
