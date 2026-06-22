import { convertToTransactions } from '../../src/services/TransactionService';
import { CsvRow } from '../../src/types/CsvRow';
import { Currency } from '../../src/enums/Currency';

describe('TransactionService', () => {
  describe('convertToTransactions', () => {
    it('should convert valid CSV rows to transactions', () => {
      const csvRows: CsvRow[] = [
        {
          Date: 'Sun Jun 21 2026',
          Description: 'Payment for services',
          Amount: '-100.50',
          Balance: '500.00',
          Currency: 'USD',
        },
        {
          Date: 'Wed Jun 17 2026',
          Description: 'Deposit',
          Amount: '200.00',
          Balance: '700.00',
          Currency: 'USD',
        },
      ];

      const result = convertToTransactions(csvRows, Currency.USD);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        transactionDate: '2026-06-21',
        valueDate: '2026-06-21',
        description: 'Payment for services',
        debitAmount: 100.50,
        creditAmount: 0,
        balance: 500.00,
        reference: '',
        currency: Currency.USD,
      });

      expect(result[1]).toEqual({
        transactionDate: '2026-06-17',
        valueDate: '2026-06-17',
        description: 'Deposit',
        debitAmount: 0,
        creditAmount: 200.00,
        balance: 700.00,
        reference: '',
        currency: Currency.USD,
      });
    });

    it('should handle zero amount values', () => {
      const csvRows: CsvRow[] = [{
        Date: 'Sun Jun 21 2026',
        Description: 'Test transaction',
        Amount: '0',
        Balance: '500.00',
        Currency: 'USD',
      }];

      const result = convertToTransactions(csvRows, Currency.USD);

      expect(result[0]).toEqual(expect.objectContaining({
        debitAmount: 0,
        creditAmount: 0,
      }));
    });

    it('should throw error for invalid number formats', () => {
      const csvRows: CsvRow[] = [{
        Date: 'Sun Jun 21 2026',
        Description: 'Invalid transaction',
        Amount: 'invalid',
        Balance: 'invalid',
        Currency: 'USD',
      }];

      expect(() => {
        convertToTransactions(csvRows, Currency.USD);
      }).toThrow('Invalid number format in row 1');
    });
  });
});
