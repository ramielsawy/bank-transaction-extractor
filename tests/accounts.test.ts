import { getAllAccountNumbers, getAllAccountsInfo, AccountInfo } from '../src/index';

describe('Accounts Functionality', () => {
  const username = process.env.BANK_USERNAME;
  const password = process.env.BANK_PASSWORD;

  beforeAll(() => {
    if (!username || !password) {
      throw new Error('BANK_USERNAME and BANK_PASSWORD environment variables are required for testing');
    }
  });

  it('should get all account numbers', async () => {
    const accountNumbers = await getAllAccountNumbers(username!, password!);
    
    expect(accountNumbers).toBeDefined();
    expect(Array.isArray(accountNumbers)).toBe(true);
    expect(accountNumbers.length).toBeGreaterThan(0);
    
    // Check that all items are strings and not empty
    accountNumbers.forEach(accountNumber => {
      expect(typeof accountNumber).toBe('string');
      expect(accountNumber.length).toBeGreaterThan(0);
    });
    
    console.log('Account Numbers:', accountNumbers);
  }, 300000); // 5 minutes timeout

  it('should get all accounts information', async () => {
    const accountsInfo: AccountInfo[] = await getAllAccountsInfo(username!, password!);
    
    expect(accountsInfo).toBeDefined();
    expect(Array.isArray(accountsInfo)).toBe(true);
    expect(accountsInfo.length).toBeGreaterThan(0);
    
    // Check structure of each account info
    accountsInfo.forEach(account => {
      expect(account).toHaveProperty('accountNumber');
      expect(account).toHaveProperty('accountName');
      expect(account).toHaveProperty('currency');
      expect(account).toHaveProperty('balance');
      expect(account).toHaveProperty('status');
      
      expect(typeof account.accountNumber).toBe('string');
      expect(typeof account.accountName).toBe('string');
      expect(typeof account.currency).toBe('string');
      expect(typeof account.balance).toBe('number');
      expect(typeof account.status).toBe('string');
      
      expect(account.accountNumber.length).toBeGreaterThan(0);
      expect(account.accountName.length).toBeGreaterThan(0);
      expect(account.currency.length).toBeGreaterThan(0);
      expect(account.status.length).toBeGreaterThan(0);
    });
    
    console.log('Accounts Information:', accountsInfo);
  }, 300000); // 5 minutes timeout
}); 