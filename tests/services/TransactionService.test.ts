import { convertToTransactions } from '../../src/services/TransactionService';
import { CsvRow } from '../../src/types/CsvRow';
import { Currency } from '../../src/enums/Currency';

describe('TransactionService', () => {
  describe('convertToTransactions', () => {
    it('should convert valid CSV rows to transactions', () => {
      const csvRows: CsvRow[] = [
        {
          'Date': '3/3/2024',
          'Txn Date': '2/3/2024',
          'Narrative': 'Payment for services',
          'Debit': '100.50',
          'Credit': '',
          'Balance': '500.00'
        },
        {
          'Date': '21/3/2024',
          'Txn Date': '21/3/2024',
          'Narrative': 'Deposit',
          'Debit': '',
          'Credit': '200.00',
          'Balance': '700.00 cr'
        }
      ];

      const result = convertToTransactions(csvRows, Currency.USD);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        transactionDate: '2024-03-02',
        valueDate: '2024-03-03',
        description: 'Payment for services',
        debitAmount: 100.50,
        creditAmount: 0,
        balance: 500.00,
        reference: '',
        currency: Currency.USD
      });

      expect(result[1]).toEqual({
        transactionDate: '2024-03-21',
        valueDate: '2024-03-21',
        description: 'Deposit',
        debitAmount: 0,
        creditAmount: 200.00,
        balance: 700.00,
        reference: '',
        currency: Currency.USD
      });
    });

    it('should handle empty debit/credit values', () => {
      const csvRows: CsvRow[] = [{
        'Date': '3/3/2024',
        'Txn Date': '2/3/2024',
        'Narrative': 'Test transaction',
        'Debit': '',
        'Credit': '',
        'Balance': '500.00'
      }];

      const result = convertToTransactions(csvRows, Currency.USD);

      expect(result[0]).toEqual(expect.objectContaining({
        debitAmount: 0,
        creditAmount: 0
      }));
    });

    it('should throw error for invalid number formats', () => {
      const csvRows: CsvRow[] = [{
        'Date': '3/3/2024',
        'Txn Date': '2/3/2024',
        'Narrative': 'Invalid transaction',
        'Debit': 'invalid',
        'Credit': '',
        'Balance': 'invalid'
      }];

      expect(() => {
        convertToTransactions(csvRows, Currency.USD);
      }).toThrow('Invalid number format in row 1');
    });

    it('should handle balance with cr/dr suffix', () => {
      const csvRows: CsvRow[] = [{
        'Date': '3/3/2024',
        'Txn Date': '2/3/2024',
        'Narrative': 'Test transaction',
        'Debit': '100',
        'Credit': '',
        'Balance': '500.00 cr'
      }];

      const result = convertToTransactions(csvRows, Currency.USD);

      expect(result[0].balance).toBe(500.00);
    });
  });
});
