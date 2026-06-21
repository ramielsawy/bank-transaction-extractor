import puppeteer from 'puppeteer';

// Group internal types/enums (alphabetically)
import { Currency } from './enums/Currency';
import { Transaction } from './types/Transaction';
import { AccountInfo } from './types/AccountInfo';
import { CsvRow } from './types/CsvRow';

// Group configuration
import { config, validateConfig } from './config/config';

// Group services (alphabetically)
import { getAccountDetails, extractTransactionsFromAccount, navigateToAccountsPage, getAccountNumbers, getAccountsInfo } from './services/AccountService';
import { loginToBank } from './services/AuthService';
import { convertCurrency } from './services/CurrencyService';
import { parseCsvContent } from './services/FileService';
import { convertToTransactions } from './services/TransactionService';

// Export types and functions
export { Currency } from './enums/Currency';
export { Transaction } from './types/Transaction';
export { AccountInfo } from './types/AccountInfo';
export { navigateToAccountsPage, getAccountNumbers, getAccountsInfo } from './services/AccountService';

/**
 * Get transactions from a bank account
 * @param username - The username to login with
 * @param password - The password to login with
 * @param accountNumber - The account number to extract transactions from
 * @param targetCurrency - The target currency to convert the transactions to
 * @param exchangeRate - The exchange rate to use for the conversion
 * @returns An array of {@link Transaction} objects
 */
export async function getTransactions(
  username: string,
  password: string,
  accountNumber: string,
  targetCurrency?: Currency,
  exchangeRate?: number
): Promise<Transaction[]> {
  validateConfig();
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setDefaultNavigationTimeout(120000);

  try {
    await loginToBank(page, username, password);

    const accountDetails = await getAccountDetails(accountNumber, config, page);
    const sourceCurrency = accountDetails.currency;
    if (!targetCurrency) {
      targetCurrency = sourceCurrency;
    }

    let csvRows: CsvRow[] = [];
    if (accountDetails.elementId) {
      const fileContent = await extractTransactionsFromAccount(page, accountDetails.elementId);
      csvRows = await parseCsvContent(fileContent);
    }

    let transactions = convertToTransactions(csvRows, sourceCurrency);

    if (sourceCurrency && targetCurrency && sourceCurrency !== targetCurrency && !!exchangeRate) {
      transactions = convertCurrency(transactions, sourceCurrency, targetCurrency, exchangeRate);
    }

    return transactions;
  } finally {
    await browser.close();
  }
}

/**
 * Get list of all account numbers from the bank
 * @param username - The username to login with
 * @param password - The password to login with
 * @returns An array of account numbers
 */
export async function getAllAccountNumbers(
  username: string,
  password: string
): Promise<string[]> {
  validateConfig();
  const browser = await puppeteer.launch({
    headless: false, // Show the browser window
    defaultViewport: null, // Use full screen
  });
  const page = await browser.newPage();
  await page.setDefaultNavigationTimeout(120000);

  try {
    await loginToBank(page, username, password);
    await navigateToAccountsPage(page);
    const accountNumbers = await getAccountNumbers(page);
    return accountNumbers;
  } finally {
    await browser.close();
  }
}

/**
 * Get detailed information about all accounts from the bank
 * @param username - The username to login with
 * @param password - The password to login with
 * @returns An array of account information objects
 */
export async function getAllAccountsInfo(
  username: string,
  password: string
): Promise<AccountInfo[]> {
  validateConfig();
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setDefaultNavigationTimeout(120000);

  try {
    await loginToBank(page, username, password);
    await navigateToAccountsPage(page);
    const accountsInfo = await getAccountsInfo(page);
    return accountsInfo;
  } finally {
    await browser.close();
  }
}




