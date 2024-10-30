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
        await attemptLogin(page, username, password);

        await page.waitForTimeout(2000);
        const pageContent = await page.content();

        if (!pageContent.includes("The data you entered is invalid")) {
            console.log('Login successful');

            // Check for "already logged in" message and handle it
            const alreadyLoggedIn = await page.evaluate((selector) => {
                const message = document.querySelector(selector);
                return message !== null;
            }, config.selectors.login.alreadyLoggedInMessage);

            if (alreadyLoggedIn) {
                console.log('Already logged in message detected, clicking continue');
                await page.click(config.selectors.login.alreadyLoggedInContinue);
                await page.waitForTimeout(2000);
            }

            result = LoginResult.Success;

            break;
        }
        console.log('Invalid credentials or CAPTCHA');
    }
    if (result !== LoginResult.Success) {
        throw new Error('Failed to login');
    }

    return result;
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
    console.log('CAPTCHA image loaded');

    let captchaText = '';
    for (let attempt = 1; attempt <= config.maxCaptchaAttempts; attempt++) {
        try {
            const base64Image = await getCaptchaImage(page);
            captchaText = await solveCaptcha(base64Image, { expectedLength: 5, validationRegex: /^[a-zA-Z0-9]+$/, language: 'eng' });
            break;
        } catch (error) {
            console.error('Error solving CAPTCHA:', error);
            await refreshCaptcha(page);
        }
    }
    if (!captchaText) {
        throw new Error('Failed to solve CAPTCHA');
    }

    console.log('Entering CAPTCHA:', captchaText);
    await page.type(config.selectors.login.captchaInput, captchaText);

    console.log('Clicking the login button');
    await page.evaluate((selector) => {
        const buttons = document.querySelectorAll(selector);
        if (buttons.length >= 2) {
            (buttons[1] as HTMLElement).click();
        } else {
            console.error('Login button not found');
        }
    }, config.selectors.login.continueButton);

    await page.waitForTimeout(5000);
}

async function getCaptchaImage(page: puppeteer.Page): Promise<string> {
    const captchaSelector = config.selectors.login.captchaImage;
    const base64Image = await page.evaluate((selector) => {
        const img = document.querySelector(selector) as HTMLImageElement;
        return img ? img.src.split(',')[1] : null;
    }, captchaSelector);
    if (!base64Image) {
        throw new Error('CAPTCHA image not found');
    }
    return base64Image;
}

async function refreshCaptcha(page: puppeteer.Page) {
    await page.evaluate((selector) => {
        const refreshButton = document.querySelector(selector) as HTMLElement;
        if (refreshButton) {
            refreshButton.click();
        } else {
            console.error('CAPTCHA refresh button not found');
        }
    }, config.selectors.login.captchaRefresh);
    await page.waitForTimeout(2000);
}
