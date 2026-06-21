import puppeteer from 'puppeteer';
import { config } from '../config/config';
import { LoginResult } from '../enums/LoginResult';
import { solveCaptcha } from './CaptchaSolver';

export async function loginToBank(page: puppeteer.Page, username: string, password: string): Promise<LoginResult> {
    if (!username || !password) {
        throw new Error('Username and password must be provided');
    }

    let result = LoginResult.InvalidInput;

    console.log('Navigating to the login page');
    await page.goto(config.baseUrl);

    for (let attempt = 1; attempt <= config.maxLoginAttempts; attempt++) {
        console.log(`Login attempt ${attempt}`);
        
        try {
            await attemptLogin(page, username, password);
            
            // Wait for the API response and check the result
            await page.waitForTimeout(3000);
            
            // Check for API response in network requests
            const apiResponse = await checkLoginApiResponse(page);
            
            if (apiResponse) {
                if (apiResponse.statusCode === 200) {
                    console.log('Login successful via API');
                    result = LoginResult.Success;
                    break;
                } else if (apiResponse.statusCode === 428 && apiResponse.errorCode === 'AUTH-4') {
                    console.log('Already logged in detected, handling popup...');
                    await handleAlreadyLoggedInPopup(page);
                    result = LoginResult.Success;
                    break;
                } else if (apiResponse.statusCode === 401 && apiResponse.errorCode === 'AUTH-0') {
                    console.log('Invalid credentials detected from API');
                    continue; // Try again
                }
            }
            
            // Fallback: Check page content for success indicators
            const pageContent = await page.content();
            if (!pageContent.includes("The data you entered is invalid") && 
                !pageContent.includes("Invalid Login")) {
                console.log('Login successful (fallback check)');
                
                // Check for the new "already logged in" popup structure
                const alreadyLoggedInPopup = await page.$('[data-testid="already-logged-in-message"]');
                if (alreadyLoggedInPopup) {
                    console.log('Already logged in popup detected, handling...');
                    await handleAlreadyLoggedInPopup(page);
                }
                
                result = LoginResult.Success;
                break;
            }
            
            console.log('Invalid credentials or CAPTCHA');
            
        } catch (error) {
            console.error(`Login attempt ${attempt} failed:`, error);
            if (attempt === config.maxLoginAttempts) {
                throw error;
            }
        }
    }
    
    if (result !== LoginResult.Success) {
        throw new Error('Failed to login after all attempts');
    }

    return result;
}

async function checkLoginApiResponse(page: puppeteer.Page): Promise<any> {
    try {
        // Listen for network responses
        return await page.evaluate(() => {
            return new Promise((resolve) => {
                // Check if there's any indication of the API response in the page
                const errorElements = document.querySelectorAll('[data-testid*="error"], [data-testid*="message"]');
                
                // Look for specific error messages
                for (let i = 0; i < errorElements.length; i++) {
                    const element = errorElements[i];
                    const text = element.textContent || '';
                    if (text.includes('Invalid Login')) {
                        resolve({ statusCode: 401, errorCode: 'AUTH-0' });
                        return;
                    }
                    if (text.includes('already logged in') || text.includes('another device')) {
                        resolve({ statusCode: 428, errorCode: 'AUTH-4' });
                        return;
                    }
                }
                
                // Check for success indicators
                const successElements = document.querySelectorAll('[data-testid*="accounts"], [data-testid*="dashboard"]');
                if (successElements.length > 0) {
                    resolve({ statusCode: 200 });
                    return;
                }
                
                resolve(null);
            });
        });
    } catch (error) {
        console.log('Could not check API response:', error);
        return null;
    }
}

async function handleAlreadyLoggedInPopup(page: puppeteer.Page): Promise<void> {
    try {
        // Wait for the popup to appear
        await page.waitForSelector('[data-testid="already-logged-in-message"]', { timeout: 5000 });
        console.log('Already logged in popup found');
        
        // Click the Continue button
        const continueButton = await page.$('[data-testid="already-logged-in-action-button"]');
        if (continueButton) {
            await continueButton.click();
            console.log('Clicked Continue button in already logged in popup');
            await page.waitForTimeout(2000);
        } else {
            // Fallback: try the old selector
            await page.click(config.selectors.login.alreadyLoggedInContinue);
            console.log('Clicked Continue button using fallback selector');
            await page.waitForTimeout(2000);
        }
    } catch (error) {
        console.log('Could not handle already logged in popup:', error);
        // Don't throw error, continue with login process
    }
}

async function attemptLogin(page: puppeteer.Page, username: string, password: string) {
    console.log('Config:', config);
    console.log('Waiting for username input to be loaded');
    await page.waitForSelector(config.selectors.login.username, { visible: true });

    console.log('Entering username and password');
    await page.type(config.selectors.login.username, username);
    await page.type(config.selectors.login.password, password);

    console.log('Clicking the continue button');
    await page.click(config.selectors.login.continueButton);
    await page.waitForTimeout(2000);
    
    // Check if CAPTCHA is required
    const captchaImage = await page.$(config.selectors.login.captchaImage);
    if (!captchaImage) {
        console.log('No CAPTCHA required, proceeding with login');
        return;
    }
    
    console.log('CAPTCHA image loaded');

    let captchaText = '';
    for (let attempt = 1; attempt <= config.maxCaptchaAttempts; attempt++) {
        try {
            const base64Image = await getCaptchaImage(page);
            captchaText = await solveCaptcha(base64Image, { expectedLength: 5, validationRegex: /^[a-zA-Z0-9]+$/ });
            break;
        } catch (error) {
            console.error('Error solving CAPTCHA:', error);
            if (attempt < config.maxCaptchaAttempts) {
                await refreshCaptcha(page);
            }
        }
    }
    if (!captchaText) {
        throw new Error('Failed to solve CAPTCHA');
    }

    console.log('Entering CAPTCHA:', captchaText);
    
    // Wait for the captcha input field to be visible and ready
    await page.waitForSelector(config.selectors.login.captchaInput, { visible: true });
    
    // Clear any existing text and type the captcha
    await page.click(config.selectors.login.captchaInput);
    await page.keyboard.down('Control');
    await page.keyboard.press('KeyA');
    await page.keyboard.up('Control');
    await page.type(config.selectors.login.captchaInput, captchaText);

    console.log('Clicking the login button');
    
    // Try to find and click the login button more reliably
    const loginButtons = await page.$$(config.selectors.login.continueButton);
    if (loginButtons.length >= 2) {
        await loginButtons[1].click();
        console.log('Clicked login button (second instance)');
    } else if (loginButtons.length === 1) {
        await loginButtons[0].click();
        console.log('Clicked login button (first instance)');
    } else {
        throw new Error('Login button not found');
    }

    // Wait longer for the login to process
    console.log('Waiting for login to process...');
    await page.waitForTimeout(10000);
    
    // Check if we're still on the login page
    const loginTemplate = await page.$('[data-testid="loginTemplate"]');
    if (loginTemplate) {
        console.log('Still on login page, checking for errors...');
        
        // Look for error messages
        const errorMessages = await page.$$eval('[data-testid*="error"], [class*="error"], [class*="invalid"]', 
            elements => elements.map(el => el.textContent).filter(text => text && text.trim().length > 0)
        );
        
        if (errorMessages.length > 0) {
            console.log('Found error messages:', errorMessages);
            throw new Error(`Login failed: ${errorMessages.join(', ')}`);
        }
        
        // Check if CAPTCHA is wrong
        const captchaInput = await page.$(config.selectors.login.captchaInput);
        if (captchaInput) {
            const captchaValue = await captchaInput.evaluate(el => (el as HTMLInputElement).value);
            if (captchaValue === captchaText) {
                console.log('CAPTCHA appears to be wrong, will retry');
                throw new Error('CAPTCHA appears to be incorrect');
            }
        }
    } else {
        console.log('Successfully left login page');
    }
}

async function getCaptchaImage(page: puppeteer.Page): Promise<string> {
    const captchaSelector = config.selectors.login.captchaImage;
    const base64Image = await page.evaluate((selector) => {
        const container = document.querySelector(selector);
        if (!container) return null;

        // Try to find an <img> tag inside
        const img = container.querySelector('img') as HTMLImageElement | null;
        if (img && img.src.startsWith('data:image')) {
            return img.src.split(',')[1];
        }

        // Or extract background-image from inline style
        const bgStyle = window.getComputedStyle(container).backgroundImage;
        const match = bgStyle?.match(/^url\("data:image\/[^;]+;base64,([^"]+)"\)/);
        return match?.[1] || null;
    }, captchaSelector);

    if (!base64Image) {
        throw new Error('CAPTCHA image not found');
    }
    return base64Image;
}

async function refreshCaptcha(page: puppeteer.Page) {
    await page.evaluate((selector) => {
        const refreshButton = document.querySelector(selector);
        if (refreshButton) {
            refreshButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        } else {
            console.error('CAPTCHA refresh button not found');
        }
    }, config.selectors.login.captchaRefresh);
    await page.waitForTimeout(2000);
}
