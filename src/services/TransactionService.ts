import { CsvRow } from '../types/CsvRow';
import { Transaction } from '../types/Transaction';
import { Currency } from '../enums/Currency';

function parseBankDate(dateStr: string): string {
  const monthMap: Record<string, string> = {
    Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
    Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12',
  };

  const longDateMatch = dateStr.match(/\w+\s+(\w+)\s+(\d{1,2})\s+(\d{4})/);
  if (longDateMatch) {
    const month = monthMap[longDateMatch[1]] || '01';
    return `${longDateMatch[3]}-${month}-${longDateMatch[2].padStart(2, '0')}`;
  }

  const [day, month, year] = dateStr.split('/');
  const fullYear = year.length === 2 ? `20${year}` : year;
  return `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

function parseAmount(str: string | undefined): number {
  if (!str) return 0;
  return Number(str.replace(/,/g, ''));
}

export function convertToTransactions(csvRows: CsvRow[], currency: Currency): Transaction[] {
  return csvRows.map((row, index) => {
    const { Date: date, Description: description, Amount: amountStr, Balance: balanceStr, Currency: rowCurrency } = row;

    const amount = parseAmount(amountStr);
    const debitAmount = amount < 0 ? Math.abs(amount) : 0;
    const creditAmount = amount > 0 ? amount : 0;
    const cleanBalance = (balanceStr || '0').replace(' cr', '').replace(' dr', '').replace(/,/g, '');
    const balance = Number(cleanBalance);
    const transactionCurrency = (rowCurrency as Currency) || currency;

    if (isNaN(debitAmount) || isNaN(creditAmount) || isNaN(balance)) {
      throw new Error(`Invalid number format in row ${index + 1}, row:${JSON.stringify(row)}`);
    }

    const formattedDate = parseBankDate(date);

    return {
      transactionDate: formattedDate,
      valueDate: formattedDate,
      description,
      debitAmount,
      creditAmount,
      balance,
      reference: '',
      currency: transactionCurrency,
    };
  });
}
