import { convertCurrency } from '../src/services/CurrencyService';
import { Currency } from '../src/enums/Currency';
import { Transaction } from '../src/types/Transaction';

describe('convertCurrency', () => {
  it('should correctly convert the sample input to the expected output', () => {
    const input: Transaction[] = [
      {
        transactionDate: '28/7/2024',
        valueDate: '28/7/2024',
        description: 'Payment of Interest',
        debitAmount: 0,
        creditAmount: 141.33,
        balance: 120139.19,
        reference: '',
        currency: Currency.EGP
      },
      {
        transactionDate: '28/7/2024',
        valueDate: '28/7/2024',
        description: 'Internet Transfer To Own AC',
        debitAmount: 120000.00,
        creditAmount: 0,
        balance: 139.19,
        reference: '',
        currency: Currency.EGP
      }
    ];

    const expected: Transaction[] = [
      {
        transactionDate: '28/7/2024',
        valueDate: '28/7/2024',
        description: 'Payment of Interest',
        debitAmount: 0,
        creditAmount: 2.83,
        balance: 2402.78,
        reference: '',
        currency: Currency.USD
      },
      {
        transactionDate: '28/7/2024',
        valueDate: '28/7/2024',
        description: 'Internet Transfer To Own AC',
        debitAmount: 2400.00,
        creditAmount: 0,
        balance: 2.78,
        reference: '',
        currency: Currency.USD
      }
    ];

    const result = convertCurrency(
      input,
      Currency.EGP,
      Currency.USD,
      0.02
    );

    expect(result).toEqual(expected);
  });

  it('should handle empty input', () => {
    const result = convertCurrency([], Currency.EGP, Currency.USD, 0.02);
    expect(result).toEqual([]);
  });

  it('should handle same currency conversion', () => {
    const input: Transaction[] = [{
      transactionDate: '1/1/2024',
      valueDate: '1/1/2024',
      description: 'Test',
      debitAmount: 0,
      creditAmount: 1000.00,
      balance: 100.00,
      reference: '',
      currency: Currency.USD
    }];

    const result = convertCurrency(input, Currency.USD, Currency.USD, 1);
    expect(result).toEqual(input);
  });
});
