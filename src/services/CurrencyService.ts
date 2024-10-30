import { Transaction } from '../types/Transaction';
import { Currency } from '../enums/Currency';

function convertValue(value: number, exchangeRate: number): number {
  return Number((value * exchangeRate).toFixed(2));
}

export function convertCurrency(
  transactions: Transaction[],
  sourceCurrency: Currency,
  targetCurrency: Currency,
  exchangeRate: number
): Transaction[] {
  if (transactions.length <= 0) return transactions;
  if (sourceCurrency === targetCurrency) return transactions;

  return transactions.map(transaction => ({
    ...transaction,
    debitAmount: convertValue(transaction.debitAmount, exchangeRate),
    creditAmount: convertValue(transaction.creditAmount, exchangeRate),
    balance: convertValue(transaction.balance, exchangeRate),
    currency: targetCurrency
  }));
}

