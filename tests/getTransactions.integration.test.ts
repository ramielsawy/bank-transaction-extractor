import { getTransactions } from '../src/index';
import dotenv from 'dotenv';

dotenv.config();

describe('getTransactions Integration Test', () => {
  it('should successfully retrieve transactions', async () => {
    // Ensure environment variables are set
    const username = process.env.BANK_USERNAME;
    const password = process.env.BANK_PASSWORD;
    const accountNumber = process.env.BANK_ACCOUNT_NUMBER;

    if (!username || !password || !accountNumber) {
      throw new Error('Missing required environment variables');
    }

    // Call the getTransactions function with default currency handling
    const rows = await getTransactions(username, password, accountNumber);

    console.log(rows);
    // Assertions
    expect(rows).toBeDefined();
    expect(Array.isArray(rows)).toBe(true);
    expect(rows.length).toBeGreaterThan(0);

    // Check if each row has the expected structure and data
    rows.forEach((row, index) => {
      // Check properties exist
      expect(row).toHaveProperty('valueDate');
      expect(row).toHaveProperty('transactionDate');
      expect(row).toHaveProperty('description');
      expect(row).toHaveProperty('debitAmount');
      expect(row).toHaveProperty('creditAmount');
      expect(row).toHaveProperty('balance');
      expect(row).toHaveProperty('currency');

      // Check required fields are not empty
      expect(row.valueDate).toBeTruthy();
      expect(row.transactionDate).toBeTruthy();
      expect(row.description).toBeTruthy();
      expect(row.balance).toBeTruthy();
      expect(row.currency).toBeTruthy();

      // Check if either Debit or Credit has a value
      expect(row.debitAmount || row.creditAmount).toBeTruthy();
    });

    // Log all rows for manual inspection
    console.log('All transaction rows:', rows);
  }, 300000); // Increase timeout to 5 minutes due to potential CAPTCHA solving delays
});
