import { Page } from 'puppeteer';
import { config, Config } from '../config/config';
import { Currency } from '../enums/Currency';
import { getDownloadedFileContent } from './FileService';
import { unlink } from 'fs/promises';

interface AccountDetails {
    elementId: string;
    currency: Currency;
    balance: number;
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
