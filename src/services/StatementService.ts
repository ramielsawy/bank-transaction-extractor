import { stringify } from 'csv-stringify/sync';
import { Transaction } from '../types/Transaction';

export type StatementFormat = 'json' | 'csv';

export interface StatementResponse {
  bankId: string;
  accountNumber: string;
  count: number;
  transactions: Transaction[];
}

export function transactionsToCsv(transactions: Transaction[]): string {
  return stringify(transactions, { header: true });
}

export function buildStatementResponse(
  bankId: string,
  accountNumber: string,
  transactions: Transaction[]
): StatementResponse {
  return {
    bankId,
    accountNumber,
    count: transactions.length,
    transactions,
  };
}

export function resolveStatementFormat(acceptHeader?: string | string[] | null): StatementFormat {
  const accept = (Array.isArray(acceptHeader) ? acceptHeader.join(',') : acceptHeader ?? '')
    .toLowerCase();

  if (accept.includes('text/csv')) {
    return 'csv';
  }

  return 'json';
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
