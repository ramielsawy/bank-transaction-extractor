import { Page } from 'puppeteer';
import { config } from '../config/config';
import { Currency } from '../enums/Currency';
import { AccountInfo } from '../types/AccountInfo';
import { waitForCsvApiResponse } from './FileService';

interface AccountDetails {
    currency: Currency;
    balance: number;
}

function accountPressableSelector(accountNumber: string): string {
    return `[data-testid="${accountNumber}${config.selectors.account.pressableSuffix}"]`;
}

function parseBalanceText(balanceText: string): { balance: number; currency: Currency } {
    const match = balanceText.match(/([0-9,]+\.?[0-9]*)\s+([A-Z]{3})/);
    return {
        balance: match ? parseFloat(match[1].replace(/,/g, '')) : 0,
        currency: (match?.[2] || 'EGP') as Currency,
    };
}

/**
 * Navigate to the accounts list page from the home dashboard.
 */
export async function navigateToAccountsPage(page: Page): Promise<void> {
    console.log('Navigating to accounts page...');

    await page.waitForSelector(config.selectors.accounts.button, { visible: true, timeout: 30000 });
    await page.click(config.selectors.accounts.button);

    await page.waitForFunction(
        (accountNumberSelector: string) => document.querySelectorAll(accountNumberSelector).length > 0,
        { timeout: 30000 },
        config.selectors.accounts.accountNumber
    );

    console.log('Accounts page loaded successfully');
}

/**
 * Extract all account numbers from the accounts list page.
 */
export async function getAccountNumbers(page: Page): Promise<string[]> {
    console.log('Extracting account numbers from accounts page...');

    await page.waitForSelector(config.selectors.accounts.accountNumber, { visible: true });

    const accountNumbers = await page.evaluate((selectors) => {
        const cards = document.querySelectorAll(selectors.accountCard);
        const numbers: string[] = [];

        cards.forEach((card) => {
            const accountNumberElement = card.querySelector(selectors.accountNumber);
            const accountNumber = accountNumberElement?.textContent?.trim();
            if (accountNumber) {
                numbers.push(accountNumber);
            }
        });

        return numbers;
    }, config.selectors.accounts);

    console.log(`Found ${accountNumbers.length} accounts:`, accountNumbers);
    return accountNumbers;
}

/**
 * Extract detailed account information from the accounts list page.
 */
export async function getAccountsInfo(page: Page): Promise<AccountInfo[]> {
    console.log('Extracting detailed account information from accounts page...');

    await page.waitForSelector(config.selectors.accounts.accountCard, { visible: true });

    const accountsInfo = await page.evaluate((selectors) => {
        const accountCards = document.querySelectorAll(selectors.accountCard);
        const accounts: AccountInfo[] = [];

        accountCards.forEach((card) => {
            const accountNumber = card.querySelector('[data-testid="account-number"]')?.textContent?.trim() || '';
            const accountName = card.querySelector('[data-testid="account-name"]')?.textContent?.trim() || '';
            const balanceText = card.querySelector('[data-testid="balance"]')?.textContent?.trim() || '';
            const status = card.querySelector('[data-testid="status-text"]')?.textContent?.trim() || '';

            const balanceMatch = balanceText.match(/([0-9,]+\.?[0-9]*)\s+([A-Z]{3})/);
            const balance = balanceMatch ? parseFloat(balanceMatch[1].replace(/,/g, '')) : 0;
            const currency = balanceMatch ? balanceMatch[2] : 'EGP';

            if (accountNumber) {
                accounts.push({
                    accountNumber,
                    accountName,
                    currency: currency as Currency,
                    balance,
                    status,
                });
            }
        });

        return accounts;
    }, config.selectors.accounts);

    console.log(`Found ${accountsInfo.length} accounts with details:`, accountsInfo);
    return accountsInfo;
}

export async function getAccountDetails(accountNumber: string, page: Page): Promise<AccountDetails> {
    console.log(`Searching for account: ${accountNumber}`);

    await page.waitForSelector(config.selectors.accounts.accountCard, { visible: true });

    const accountInfo = await page.evaluate(
        (selectors, targetAccountNumber) => {
            const cards = document.querySelectorAll(selectors.accountCard);

            for (const card of Array.from(cards)) {
                const displayedAccountNumber = card.querySelector(selectors.accountNumber)?.textContent?.trim();
                if (displayedAccountNumber?.includes(targetAccountNumber)) {
                    const balanceText = card.querySelector('[data-testid="balance"]')?.textContent?.trim() || '';
                    const match = balanceText.match(/([0-9,]+\.?[0-9]*)\s+([A-Z]{3})/);
                    return {
                        balance: match ? parseFloat(match[1].replace(/,/g, '')) : 0,
                        currency: match?.[2] || 'EGP',
                    };
                }
            }

            return null;
        },
        config.selectors.accounts,
        accountNumber
    );

    if (!accountInfo) {
        throw new Error(`Account ${accountNumber} not found`);
    }

    console.log(`Found matching account: ${accountNumber}`, accountInfo);
    return {
        currency: accountInfo.currency as Currency,
        balance: accountInfo.balance,
    };
}

export async function extractTransactionsFromAccount(page: Page, accountNumber: string): Promise<string> {
    console.log(`Starting transaction extraction for account: ${accountNumber}`);

    const accountSelector = accountPressableSelector(accountNumber);
    await page.waitForSelector(accountSelector, { visible: true, timeout: 30000 });
    await page.click(accountSelector);
    console.log('Opened account detail page');

    await page.waitForSelector(config.selectors.account.viewAllButton, { visible: true, timeout: 30000 });
    await page.click(config.selectors.account.viewAllButton);
    console.log('Opened full transaction list');

    await page.waitForSelector(config.selectors.account.downloadButton, { visible: true, timeout: 30000 });

    const csvResponsePromise = waitForCsvApiResponse(page);

    await page.click(config.selectors.account.downloadButton);
    console.log('Opened download modal');

    await page.waitForSelector(config.selectors.account.exportCsvOption, { visible: true, timeout: 10000 });
    await page.click(config.selectors.account.exportCsvOption);
    console.log('Selected CSV format');

    await page.waitForSelector(config.selectors.account.exportConfirmButton, { visible: true, timeout: 10000 });
    await page.click(config.selectors.account.exportConfirmButton);
    console.log('Confirmed CSV download');

    const csvContent = await csvResponsePromise;
    console.log('Received CSV content from API');
    return csvContent;
}
