import puppeteer from 'puppeteer';

import { Currency } from './enums/Currency';
import { Transaction } from './types/Transaction';
import { AccountInfo } from './types/AccountInfo';
import { CsvRow } from './types/CsvRow';

import { config, validateConfig } from './config/config';

import { getAccountDetails, extractTransactionsFromAccount, navigateToAccountsPage, getAccountNumbers, getAccountsInfo } from './services/AccountService';
import { loginToBank } from './services/AuthService';
import { convertCurrency } from './services/CurrencyService';
import { parseCsvContent } from './services/FileService';
import { convertToTransactions } from './services/TransactionService';

export { Currency } from './enums/Currency';
export { Transaction } from './types/Transaction';
export { AccountInfo } from './types/AccountInfo';
export { navigateToAccountsPage, getAccountNumbers, getAccountsInfo } from './services/AccountService';

const browserLaunchOptions = {
  ignoreHTTPSErrors: true,
  args: ['--no-sandbox', '--ignore-certificate-errors'],
};

/**
 * Get transactions from a bank account
 */
export async function getTransactions(
  username: string,
  password: string,
  accountNumber: string,
  targetCurrency?: Currency,
  exchangeRate?: number
): Promise<Transaction[]> {
  validateConfig();
  const browser = await puppeteer.launch(browserLaunchOptions as puppeteer.LaunchOptions);
  const page = await browser.newPage();
  await page.setDefaultNavigationTimeout(120000);

  try {
    await loginToBank(page, username, password);
    await navigateToAccountsPage(page);

    const accountDetails = await getAccountDetails(accountNumber, page);
    const sourceCurrency = accountDetails.currency;
    if (!targetCurrency) {
      targetCurrency = sourceCurrency;
    }

    const fileContent = await extractTransactionsFromAccount(page, accountNumber);
    const csvRows: CsvRow[] = await parseCsvContent(fileContent);

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
 */
export async function getAllAccountNumbers(
  username: string,
  password: string
): Promise<string[]> {
  validateConfig();
  const browser = await puppeteer.launch({
    ...(browserLaunchOptions as puppeteer.LaunchOptions),
    headless: false,
    defaultViewport: null,
  });
  const page = await browser.newPage();
  await page.setDefaultNavigationTimeout(120000);

  try {
    await loginToBank(page, username, password);
    await navigateToAccountsPage(page);
    return await getAccountNumbers(page);
  } finally {
    await browser.close();
  }
}

/**
 * Get detailed information about all accounts from the bank
 */
export async function getAllAccountsInfo(
  username: string,
  password: string
): Promise<AccountInfo[]> {
  validateConfig();
  const browser = await puppeteer.launch(browserLaunchOptions as puppeteer.LaunchOptions);
  const page = await browser.newPage();
  await page.setDefaultNavigationTimeout(120000);

  try {
    await loginToBank(page, username, password);
    await navigateToAccountsPage(page);
    return await getAccountsInfo(page);
  } finally {
    await browser.close();
  }
}
