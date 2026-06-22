import puppeteer from 'puppeteer';

import { Currency } from '../enums/Currency';
import { Transaction } from '../types/Transaction';
import { AccountInfo } from '../types/AccountInfo';
import { CsvRow } from '../types/CsvRow';
import { validateConfig } from '../config/config';
import { getBrowserLaunchOptions } from '../config/browser';
import {
  getAccountDetails,
  extractTransactionsFromAccount,
  navigateToAccountsPage,
  getAccountNumbers,
  getAccountsInfo,
} from '../services/AccountService';
import { loginToBank } from '../services/AuthService';
import { convertCurrency } from '../services/CurrencyService';
import { parseCsvContent } from '../services/FileService';
import { convertToTransactions } from '../services/TransactionService';
import { BankProvider } from './types';

async function withBrowserPage<T>(
  run: (page: puppeteer.Page) => Promise<T>,
  launchOptions?: Parameters<typeof getBrowserLaunchOptions>[0]
): Promise<T> {
  const browser = await puppeteer.launch(getBrowserLaunchOptions(launchOptions));
  const page = await browser.newPage();
  await page.setDefaultNavigationTimeout(120000);

  try {
    return await run(page);
  } finally {
    await browser.close();
  }
}

export const cibProvider: BankProvider = {
  id: 'cib',
  name: 'Commercial International Bank (CIB)',

  validateConfig() {
    validateConfig();
  },

  async getTransactions(
    username,
    password,
    accountNumber,
    targetCurrency,
    exchangeRate
  ): Promise<Transaction[]> {
    this.validateConfig();

    return withBrowserPage(async (page) => {
      await loginToBank(page, username, password);
      await navigateToAccountsPage(page);

      const accountDetails = await getAccountDetails(accountNumber, page);
      const sourceCurrency = accountDetails.currency;
      const resolvedTargetCurrency = targetCurrency ?? sourceCurrency;

      const fileContent = await extractTransactionsFromAccount(page, accountNumber);
      const csvRows: CsvRow[] = await parseCsvContent(fileContent);

      let transactions = convertToTransactions(csvRows, sourceCurrency);

      if (
        sourceCurrency &&
        resolvedTargetCurrency &&
        sourceCurrency !== resolvedTargetCurrency &&
        exchangeRate
      ) {
        transactions = convertCurrency(
          transactions,
          sourceCurrency,
          resolvedTargetCurrency,
          exchangeRate
        );
      }

      return transactions;
    });
  },

  async getAllAccountNumbers(username: string, password: string): Promise<string[]> {
    this.validateConfig();

    return withBrowserPage(
      async (page) => {
        await loginToBank(page, username, password);
        await navigateToAccountsPage(page);
        return getAccountNumbers(page);
      },
      { headless: false, defaultViewport: null }
    );
  },

  async getAllAccountsInfo(username: string, password: string): Promise<AccountInfo[]> {
    this.validateConfig();

    return withBrowserPage(async (page) => {
      await loginToBank(page, username, password);
      await navigateToAccountsPage(page);
      return getAccountsInfo(page);
    });
  },
};
