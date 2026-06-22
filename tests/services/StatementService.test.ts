import { buildStatementFilename, isValidAccountNumber, transactionsToCsv } from '../../src/services/StatementService';
import { Currency } from '../../src/enums/Currency';

describe('StatementService', () => {
  it('converts transactions to CSV', () => {
    const csv = transactionsToCsv([
      {
        transactionDate: '2026-06-21',
        valueDate: '2026-06-21',
        description: 'Test payment',
        debitAmount: 100,
        creditAmount: 0,
        balance: 500,
        reference: '',
        currency: Currency.EGP,
      },
    ]);

    expect(csv).toContain('transactionDate');
    expect(csv).toContain('Test payment');
  });

  it('rejects selector-like account numbers', () => {
    expect(isValidAccountNumber('100037773586')).toBe(true);
    expect(isValidAccountNumber('[data-testid="account-number"]')).toBe(false);
  });

  it('builds timestamped statement filenames', () => {
    const filename = buildStatementFilename('100037773586', new Date('2026-06-22T15:04:00'));
    expect(filename).toBe('2026-06-22-15-04-statement-100037773586.csv');
  });
});
