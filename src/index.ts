import puppeteer from 'puppeteer';

// Group internal types/enums (alphabetically)
import { Currency } from './enums/Currency';
import { Transaction } from './types/Transaction';
import { CsvRow } from './types/CsvRow';

// Group configuration
import { config, validateConfig } from './config/config';

// Group services (alphabetically)
import { getAccountDetails, extractTransactionsFromAccount } from './services/AccountService';
import { loginToBank } from './services/AuthService';
import { convertCurrency } from './services/CurrencyService';
import { parseCsvContent } from './services/FileService';
import { convertToTransactions } from './services/TransactionService';

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




