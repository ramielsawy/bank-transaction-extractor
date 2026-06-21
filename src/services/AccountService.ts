import { Page } from 'puppeteer';
import { config, Config } from '../config/config';
import { Currency } from '../enums/Currency';
import { AccountInfo } from '../types/AccountInfo';
import { getDownloadedFileContent } from './FileService';
import { unlink } from 'fs/promises';

interface AccountDetails {
    elementId: string;
    currency: Currency;
    balance: number;
}

/**
 * Navigate to the accounts page by clicking the accounts button
 * @param page - The Puppeteer page instance
 */
export async function navigateToAccountsPage(page: Page): Promise<void> {
    console.log('Navigating to accounts page...');
    
    // Wait for the page to fully load after login
    await page.waitForTimeout(5000);
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'after-login.png' });
    console.log('Screenshot saved as after-login.png');
    
    // Try to find any element with "accounts" in the data-testid
    const accountsElements = await page.$$('[data-testid*="accounts"]');
    console.log(`Found ${accountsElements.length} elements with "accounts" in data-testid`);
    
    // Log all elements with data-testid containing "accounts"
    for (let i = 0; i < accountsElements.length; i++) {
        const element = accountsElements[i];
        const testId = await element.evaluate(el => el.getAttribute('data-testid'));
        const isVisible = await element.isIntersectingViewport();
        console.log(`  Element ${i + 1}: data-testid="${testId}", visible: ${isVisible}`);
    }
    
    // Try different possible selectors for the accounts button
    const possibleSelectors = [
        '[data-testid="accounts-pressable"]',
        '[data-testid*="accounts"]',
        'div[data-testid*="accounts"]',
        '[aria-label*="Accounts"]',
        '[aria-label*="accounts"]'
    ];
    
    let accountsButton = null;
    let usedSelector = '';
    
    for (const selector of possibleSelectors) {
        console.log(`Trying selector: ${selector}`);
        try {
            await page.waitForSelector(selector, { visible: true, timeout: 5000 });
            accountsButton = await page.$(selector);
            if (accountsButton) {
                usedSelector = selector;
                console.log(`Found accounts button with selector: ${selector}`);
                break;
            }
        } catch (error) {
            console.log(`Selector ${selector} not found or not visible`);
        }
    }
    
    if (!accountsButton) {
        // Log the current page content for debugging
        const pageContent = await page.content();
        console.log('Page content length:', pageContent.length);
        
        // Save page content to file for debugging
        require('fs').writeFileSync('page-after-login.html', pageContent);
        console.log('Page content saved to page-after-login.html');
        
        throw new Error(`Accounts button not found. Tried selectors: ${possibleSelectors.join(', ')}`);
    }
    
    // Click the accounts button
    await accountsButton.click();
    console.log(`Clicked accounts button using selector: ${usedSelector}`);
    
    // Wait for navigation to complete
    await page.waitForTimeout(3000);
    
    // Take another screenshot after clicking
    await page.screenshot({ path: 'after-accounts-click.png' });
    console.log('Screenshot saved as after-accounts-click.png');
    
    // Wait for the accounts list container to be visible
    try {
        await page.waitForSelector(config.selectors.accounts.listContainer, { visible: true, timeout: 10000 });
        console.log('Accounts page loaded successfully');
    } catch (error) {
        console.log('Accounts list container not found, but continuing...');
        // Don't throw error here, let the subsequent functions handle it
    }
}

/**
 * Extract all account numbers from the accounts list page
 * @param page - The Puppeteer page instance
 * @returns Array of account numbers
 */
export async function getAccountNumbers(page: Page): Promise<string[]> {
    console.log('Extracting account numbers from accounts page...');
    
    // Wait for account cards to be visible
    await page.waitForSelector(config.selectors.accounts.accountCard, { visible: true });
    
    // Extract all account numbers
    const accountNumbers = await page.evaluate((selectors) => {
        const accountCards = document.querySelectorAll(selectors.accountCard);
        const numbers: string[] = [];
        
        accountCards.forEach((card) => {
            const accountNumberElement = card.querySelector(selectors.accountNumber);
            if (accountNumberElement) {
                const accountNumber = accountNumberElement.textContent?.trim();
                if (accountNumber) {
                    numbers.push(accountNumber);
                }
            }
        });
        
        return numbers;
    }, config.selectors.accounts);
    
    console.log(`Found ${accountNumbers.length} accounts:`, accountNumbers);
    return accountNumbers;
}

/**
 * Extract detailed account information from the accounts list page
 * @param page - The Puppeteer page instance
 * @returns Array of account information objects
 */
export async function getAccountsInfo(page: Page): Promise<AccountInfo[]> {
    console.log('Extracting detailed account information from accounts page...');
    
    // Wait for account cards to be visible
    await page.waitForSelector(config.selectors.accounts.accountCard, { visible: true });
    
    // Extract detailed account information
    const accountsInfo = await page.evaluate((selectors) => {
        const accountCards = document.querySelectorAll(selectors.accountCard);
        const accounts: AccountInfo[] = [];
        
        accountCards.forEach((card) => {
            // Extract account number
            const accountNumberElement = card.querySelector('[data-testid="account-number"]');
            const accountNumber = accountNumberElement?.textContent?.trim() || '';
            
            // Extract account name
            const accountNameElement = card.querySelector('[data-testid="account-name"]');
            const accountName = accountNameElement?.textContent?.trim() || '';
            
            // Extract balance and currency
            const balanceElement = card.querySelector('[data-testid="balance"]');
            const balanceText = balanceElement?.textContent?.trim() || '';
            
            // Parse balance and currency (format: "‎496.75 EGP")
            const balanceMatch = balanceText.match(/([0-9,]+\.?[0-9]*)\s+([A-Z]{3})/);
            const balance = balanceMatch ? parseFloat(balanceMatch[1].replace(/,/g, '')) : 0;
            const currency = balanceMatch ? balanceMatch[2] : 'EGP';
            
            // Extract status
            const statusElement = card.querySelector('[data-testid="status-text"]');
            const status = statusElement?.textContent?.trim() || '';
            
            if (accountNumber) {
                accounts.push({
                    accountNumber,
                    accountName,
                    currency: currency as Currency,
                    balance,
                    status
                });
            }
        });
        
        return accounts;
    }, config.selectors.accounts);
    
    console.log(`Found ${accountsInfo.length} accounts with details:`, accountsInfo);
    return accountsInfo;
}

export async function getAccountDetails(
    accountNumber: string,
    config: Config,
    page: Page
): Promise<AccountDetails> {
    console.log(`Searching for account: ${accountNumber}`);
    await page.waitForSelector(config.selectors.account.detailsContainer);
    
    const accounts = await page.$$(config.selectors.account.detailsContainer);
    console.log(`Found ${accounts.length} account containers`);

    for (const account of accounts) {
        const accountNumberElement = await account.$(config.selectors.account.numberValue);
        const displayedAccountNumber = await accountNumberElement?.evaluate(el => el.textContent);
        console.log(`Checking account number: ${displayedAccountNumber}`);

        if (displayedAccountNumber?.includes(accountNumber)) {
            console.log(`Found matching account: ${accountNumber}`);
            const elementId = await accountNumberElement?.evaluate(el => {
                const logs = {
                    element: el.outerHTML,
                    elementId: el.id,
                    parent: el.parentElement?.outerHTML,
                    parentOfParent: el.parentElement?.parentElement?.outerHTML
                };
                // Log to browser console
                console.log('Element:', logs.element);
                console.log('Element ID:', logs.elementId);
                console.log('Parent:', logs.parent);
                console.log('Parent of parent:', logs.parentOfParent);

                // Return both the ID and logs
                return {
                    // Check element -> parent -> parentOfParent for ID
                    id: el.id ||
                        el.parentElement?.id ||
                        el.parentElement?.parentElement?.id || '',
                    logs
                };
            });

            // Log to terminal console
            console.log('Browser logs:', elementId?.logs);

            const balanceElement = await account.$(config.selectors.account.nativeBalance);
            console.log(`Balance element found: ${!!balanceElement}`);
            const actualElementId = elementId?.id;
            const balanceText = await balanceElement?.evaluate(el => el.textContent);
            console.log(`Balance text: ${balanceText}, Element ID: ${actualElementId}`);

            if (!balanceText || !balanceElement || !actualElementId) {
                continue;
            }

            // Parse currency and balance from the balance text
            // Assuming balance text format is like "USD 1,234.56"
            const [currencyStr, balanceStr] = (balanceText || '').split(' ');
            const currency = currencyStr as Currency;
            const balance = parseFloat(balanceStr.replace(/,/g, ''));

            return {
                elementId: actualElementId,
                currency,
                balance
            };
        }
    }

    console.log(`No account found matching: ${accountNumber}`);
    throw new Error(`Account ${accountNumber} not found`);
}

export async function extractTransactionsFromAccount(page: Page, accountElementID: string): Promise<string> {
    const getTimestampedFilename = (name: string) => {
        return `${Date.now()}-${name}.png`;
    };

    // Create an array to track screenshot files for cleanup
    const screenshotFiles: string[] = [];

    try {
        // Initial state
        const initialScreenshot = getTimestampedFilename('initial-state');
        await page.screenshot({ path: initialScreenshot });
        screenshotFiles.push(initialScreenshot);

        console.log(`Starting transaction extraction for account ID: ${accountElementID}`);
        const lastPartOfElementID = accountElementID.split('_').pop();
        console.log(`Using element ID suffix: ${lastPartOfElementID}`);

        // Click on the account element to expand it
        const clickSelector = `${config.selectors.account.clickPrefix}${lastPartOfElementID}`;
        console.log(`Clicking expand with selector: ${clickSelector}`);
        await page.click(clickSelector);
        
        // After expansion
        const afterExpandScreenshot = getTimestampedFilename('after-expand');
        await page.screenshot({ path: afterExpandScreenshot });
        screenshotFiles.push(afterExpandScreenshot);

        await page.waitForTimeout(2000);
        console.log('Waited after expansion');

        // Find and click the "View More" button
        const viewMoreSelector = `${config.selectors.account.viewMoreButtonPrefix}${lastPartOfElementID}`;
        console.log(`Clicking "View More" with selector: ${viewMoreSelector}`);
        await page.waitForSelector(viewMoreSelector);
        await page.click(viewMoreSelector);
        console.log('Clicked "View More"');
        await page.waitForNavigation();

        // After navigation
        const afterNavigationScreenshot = getTimestampedFilename('after-navigation');
        await page.screenshot({ path: afterNavigationScreenshot });
        screenshotFiles.push(afterNavigationScreenshot);

        // Export sequence with improved error handling and visibility checks
        console.log('Starting export sequence');
        await page.waitForSelector(config.selectors.account.exportButton, { visible: true });
        
        // Ensure the element is visible and clickable
        const exportButton = await page.$(config.selectors.account.exportButton);
        if (!exportButton) {
            throw new Error('Export button not found');
        }

        // Before export sequence
        const beforeExportScreenshot = getTimestampedFilename('before-export');
        await page.screenshot({ path: beforeExportScreenshot });
        screenshotFiles.push(beforeExportScreenshot);

        await exportButton.evaluate(el => {
            if (!(el instanceof HTMLElement)) {
                throw new Error('Export button is not an HTMLElement');
            }
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
        
        await page.waitForTimeout(1000); // Wait for scroll to complete
        await exportButton.click();
        console.log('Export button clicked');

        await page.waitForTimeout(1000); // Wait for scroll to complete
        await page.click(config.selectors.account.exportActionButtonPrefix);
        console.log('CSV format selected');

        // Click the Export button
        await page.click(config.selectors.account.exportConfirmButtonPrefix);
        console.log('Export modal confirmed');

        const content = await getDownloadedFileContent(page);
        
        // Cleanup all screenshots
        await Promise.all(screenshotFiles.map(async (file) => {
            try {
                await unlink(file);
                console.log(`Deleted screenshot: ${file}`);
            } catch (error) {
                console.warn(`Failed to delete screenshot ${file}:`, error);
            }
        }));

        return content;
    } catch (error) {
        // In case of error, still try to cleanup screenshots
        await Promise.all(screenshotFiles.map(async (file) => {
            try {
                await unlink(file);
                console.log(`Deleted screenshot: ${file}`);
            } catch (cleanupError) {
                console.warn(`Failed to delete screenshot ${file}:`, cleanupError);
            }
        }));
        throw error; // Re-throw the original error
    }
}
