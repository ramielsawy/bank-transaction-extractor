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
    await page.goto(config.baseUrl, { waitUntil: 'networkidle2' });

    for (let attempt = 1; attempt <= config.maxLoginAttempts; attempt++) {
        console.log(`Login attempt ${attempt}`);

        try {
            const onCaptchaScreen = await page.$('[data-testid="captcha-image"]');
            if (onCaptchaScreen) {
                await attemptCaptchaLogin(page);
            } else {
                await attemptLogin(page, username, password);
            }

            await page.waitForTimeout(3000);

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
                    continue;
                }
            }

            const currentUrl = page.url();
            if (currentUrl.includes('/home') || currentUrl.includes('/login') === false) {
                console.log('Login successful (URL check)');

                const alreadyLoggedInPopup = await page.$(config.selectors.login.alreadyLoggedInPopup);
                if (alreadyLoggedInPopup) {
                    console.log('Already logged in popup detected, handling...');
                    await handleAlreadyLoggedInPopup(page);
                }

                result = LoginResult.Success;
                break;
            }

            const pageContent = await page.content();
            if (!pageContent.includes('The data you entered is invalid') &&
                !pageContent.includes('Invalid Login')) {
                console.log('Login successful (fallback check)');

                const alreadyLoggedInPopup = await page.$(config.selectors.login.alreadyLoggedInPopup);
                if (alreadyLoggedInPopup) {
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
        return await page.evaluate(() => {
            return new Promise((resolve) => {
                const errorElements = document.querySelectorAll('[data-testid*="error"], [data-testid*="message"]');

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

                const successElements = document.querySelectorAll('[data-testid*="accounts"], [data-testid*="dashboard"], [data-testid="cib-logo"]');
                if (successElements.length > 0 && !document.querySelector('[data-testid="loginTemplate"]')) {
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
        await page.waitForSelector(config.selectors.login.alreadyLoggedInPopup, { timeout: 5000 });
        console.log('Already logged in popup found');

        const continueButton = await page.$(config.selectors.login.alreadyLoggedInActionButton);
        if (continueButton) {
            await continueButton.click();
            console.log('Clicked Continue button in already logged in popup');
            await page.waitForTimeout(2000);
        }
    } catch (error) {
        console.log('Could not handle already logged in popup:', error);
    }
}

async function clickLoginButton(page: puppeteer.Page): Promise<void> {
    const clicked = await page.evaluate((selector) => {
        const buttons = Array.from(document.querySelectorAll(selector));
        const loginButton = buttons.find((button) => button.textContent?.trim() === 'Login');
        if (loginButton instanceof HTMLElement) {
            loginButton.click();
            return true;
        }
        return false;
    }, config.selectors.login.continueButton);

    if (!clicked) {
        throw new Error('Login button not found');
    }
}

async function attemptLogin(page: puppeteer.Page, username: string, password: string) {
    console.log('Waiting for username input to be loaded');
    await page.waitForSelector(config.selectors.login.username, { visible: true });

    await page.click(config.selectors.login.username, { clickCount: 3 });
    await page.type(config.selectors.login.username, username);
    await page.click(config.selectors.login.password, { clickCount: 3 });
    await page.type(config.selectors.login.password, password);

    console.log('Clicking the login button');
    await clickLoginButton(page);
    await page.waitForTimeout(2000);

    const captchaImage = await page.$(config.selectors.login.captchaImage);
    if (!captchaImage) {
        console.log('No CAPTCHA required, proceeding with login');
        return;
    }

    await attemptCaptchaLogin(page);
}

async function attemptCaptchaLogin(page: puppeteer.Page): Promise<void> {
    console.log('CAPTCHA image loaded');

    for (let captchaAttempt = 1; captchaAttempt <= config.maxCaptchaAttempts; captchaAttempt++) {
        let captchaText = '';
        try {
            const base64Image = await getCaptchaImage(page);
            captchaText = await solveCaptcha(base64Image, { expectedLength: 5, validationRegex: /^[a-zA-Z0-9]+$/ });
        } catch (error) {
            console.error('Error solving CAPTCHA:', error);
            if (captchaAttempt < config.maxCaptchaAttempts) {
                await refreshCaptcha(page);
                continue;
            }
            throw new Error('Failed to solve CAPTCHA');
        }

        console.log('Entering CAPTCHA:', captchaText);

        await page.waitForSelector(config.selectors.login.captchaInput, { visible: true });
        await page.click(config.selectors.login.captchaInput, { clickCount: 3 });
        await page.type(config.selectors.login.captchaInput, captchaText);

        console.log('Clicking the login button after CAPTCHA');
        await clickLoginButton(page);

        console.log('Waiting for login to process...');
        await page.waitForTimeout(10000);

        const loginTemplate = await page.$('[data-testid="loginTemplate"]');
        if (!loginTemplate) {
            console.log('Successfully left login page');
            return;
        }

        console.log(`CAPTCHA attempt ${captchaAttempt} failed, refreshing captcha...`);
        if (captchaAttempt < config.maxCaptchaAttempts) {
            await refreshCaptcha(page);
        }
    }

    const errorMessages = await page.$$eval(
        '[data-testid*="error"], [class*="error"], [class*="invalid"]',
        (elements) => elements.map((el) => el.textContent).filter((text) => text && text.trim().length > 0)
    );

    if (errorMessages.length > 0) {
        throw new Error(`Login failed: ${errorMessages.join(', ')}`);
    }

    throw new Error('Failed to login after all CAPTCHA attempts');
}

async function getCaptchaImage(page: puppeteer.Page): Promise<string> {
    const captchaSelector = config.selectors.login.captchaImage;
    const base64Image = await page.evaluate((selector) => {
        const container = document.querySelector(selector);
        if (!container) return null;

        const img = container.querySelector('img') as HTMLImageElement | null;
        if (img && img.src.startsWith('data:image')) {
            return img.src.split(',')[1];
        }

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
