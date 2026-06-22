import dotenv from 'dotenv';

dotenv.config();

export interface Config {
  baseUrl: string;
  downloadPath: string;
  maxLoginAttempts: number;
  maxCaptchaAttempts: number;
  selectors: {
    login: {
      username: string;
      password: string;
      continueButton: string;
      captchaInput: string;
      captchaImage: string;
      captchaRefresh: string;
      alreadyLoggedInPopup: string;
      alreadyLoggedInActionButton: string;
    };
    account: {
      pressableSuffix: string;
      number: string;
      name: string;
      balance: string;
      status: string;
      viewAllButton: string;
      downloadButton: string;
      exportCsvOption: string;
      exportConfirmButton: string;
    };
    accounts: {
      button: string;
      accountCard: string;
      accountNumber: string;
    };
  };
}

export const config = {
  baseUrl: process.env.BANK_BASE_URL || 'https://digitalinternetbanking.cibeg.com/login',
  downloadPath: process.env.BANK_DOWNLOAD_PATH || '/tmp/downloads',
  maxLoginAttempts: Number(process.env.BANK_MAX_LOGIN_ATTEMPTS) || 3,
  maxCaptchaAttempts: Number(process.env.BANK_MAX_CAPTCHA_ATTEMPTS) || 10,
  selectors: {
    login: {
      username: process.env.BANK_LOGIN_USERNAME_SELECTOR || '[data-testid="Username-input"]',
      password: process.env.BANK_LOGIN_PASSWORD_SELECTOR || '[data-testid="Password-input"]',
      continueButton: process.env.BANK_LOGIN_CONTINUE_BUTTON || '[data-testid="cib-loginButton"]',
      captchaInput: process.env.BANK_LOGIN_CAPTCHA_INPUT || '[data-testid="undefined-input"], [data-testid="captcha-input"]',
      captchaImage: process.env.BANK_LOGIN_CAPTCHA_IMAGE || '[data-testid="captcha-image"]',
      captchaRefresh: process.env.BANK_LOGIN_CAPTCHA_REFRESH || 'div[tabindex="0"] svg[data-testid="icon"]',
      alreadyLoggedInPopup: process.env.BANK_ALREADY_LOGGED_IN_POPUP || '[data-testid="already-logged-in-message"]',
      alreadyLoggedInActionButton: process.env.BANK_ALREADY_LOGGED_IN_ACTION_BUTTON || '[data-testid="already-logged-in-action-button"]',
    },
    account: {
      pressableSuffix: process.env.BANK_ACCOUNT_PRESSABLE_SUFFIX || '-pressable',
      number: process.env.BANK_ACCOUNT_NUMBER_SELECTOR || '[data-testid="account-number"]',
      name: process.env.BANK_ACCOUNT_NAME || '[data-testid="account-name"]',
      balance: process.env.BANK_ACCOUNT_BALANCE || '[data-testid="balance"]',
      status: process.env.BANK_ACCOUNT_STATUS || '[data-testid="status-text"]',
      viewAllButton: process.env.BANK_VIEW_ALL_BUTTON || '[data-testid="view-all-button-button"]',
      downloadButton: process.env.BANK_DOWNLOAD_BUTTON || '[data-testid="download-button"]',
      exportCsvOption: process.env.BANK_EXPORT_CSV_OPTION || '[data-testid="CSV (Spreadsheet)-RadioBox"]',
      exportConfirmButton: process.env.BANK_EXPORT_CONFIRM_BUTTON || '[data-testid="transaction-type-button"]',
    },
    accounts: {
      button: process.env.BANK_ACCOUNTS_BUTTON || '[data-testid="accounts-pressable"]',
      accountCard: process.env.BANK_ACCOUNT_CARD || '[data-testid$="-pressable"]:not([data-testid="accounts-pressable"])',
      accountNumber: process.env.BANK_ACCOUNT_NUMBER_SELECTOR || '[data-testid="account-number"]',
    },
  },
} satisfies Config;

export function validateConfig() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('Missing required environment variable: GEMINI_API_KEY');
  }
}
