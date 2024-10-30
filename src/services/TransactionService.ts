import { CsvRow } from '../types/CsvRow';
import { Transaction } from '../types/Transaction';
import { Currency } from '../enums/Currency';

export function convertToTransactions(csvRows: CsvRow[], currency: Currency): Transaction[] {
  return csvRows.map((row, index) => {
    const {
      Date: valueDate,
      'Txn Date': transactionDate,
      Narrative: description,
      Debit: debitStr,
      Credit: creditStr,
      Balance: balanceStr
    } = row;

    const formatDate = (dateStr: string): string => {
      const [day, month, year] = dateStr.split('/');
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    };

    const parseAmount = (str: string | undefined): number => {
      if (!str) return 0;
      return Number(str.replace(/,/g, ''));
    };

    const debitAmount = parseAmount(debitStr);
    const creditAmount = parseAmount(creditStr);
    const cleanBalance = (balanceStr || '0').replace(' cr', '').replace(' dr', '').replace(/,/g, '');
    const balance = Number(cleanBalance);

    if (isNaN(debitAmount) || isNaN(creditAmount) || isNaN(balance)) {
      throw new Error(`Invalid number format in row ${index + 1}, row:${row}`);
    }

    return {
      transactionDate: formatDate(transactionDate),
      valueDate: formatDate(valueDate),
      description,
      debitAmount,
      creditAmount,
      balance,
      reference: '',
      currency
    };
  });
}
