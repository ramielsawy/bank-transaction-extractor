import dotenv from 'dotenv';

// Load environment variables
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
      alreadyLoggedInMessage: string;
      alreadyLoggedInContinue: string;
      alreadyLoggedInPopup: string;
      alreadyLoggedInActionButton: string;
    };
    account: {
      detailsContainer: string;
      numberValue: string;
      nativeBalance: string;
      clickPrefix: string;
      viewMoreButtonPrefix: string;
      exportButton: string;
      exportActionButtonPrefix: string;
      exportConfirmButtonPrefix: string;
    };
    accounts: {
      button: string;
      listContainer: string;
      accountCard: string;
      accountNumber: string;
    };
  };
}

export const config: Config = {
  baseUrl: process.env.BANK_BASE_URL,
  downloadPath: process.env.BANK_DOWNLOAD_PATH,
  maxLoginAttempts: Number(process.env.BANK_MAX_LOGIN_ATTEMPTS) || 3,
  maxCaptchaAttempts: Number(process.env.BANK_MAX_CAPTCHA_ATTEMPTS) || 3,
  selectors: {
    login: {
      username: process.env.BANK_LOGIN_USERNAME_SELECTOR,
      password: process.env.BANK_LOGIN_PASSWORD_SELECTOR,
      continueButton: process.env.BANK_LOGIN_CONTINUE_BUTTON,
      captchaInput: process.env.BANK_LOGIN_CAPTCHA_INPUT,
      captchaImage: process.env.BANK_LOGIN_CAPTCHA_IMAGE,
      captchaRefresh: process.env.BANK_LOGIN_CAPTCHA_REFRESH,
      alreadyLoggedInMessage: process.env.BANK_ALREADY_LOGGED_IN_MESSAGE || '',
      alreadyLoggedInContinue: process.env.BANK_ALREADY_LOGGED_IN_CONTINUE || '',
      alreadyLoggedInPopup: process.env.BANK_ALREADY_LOGGED_IN_POPUP || '[data-testid="already-logged-in-message"]',
      alreadyLoggedInActionButton: process.env.BANK_ALREADY_LOGGED_IN_ACTION_BUTTON || '[data-testid="already-logged-in-action-button"]',
    },
    account: {
      detailsContainer: process.env.BANK_ACCOUNT_DETAILS_CONTAINER,
      numberValue: process.env.BANK_ACCOUNT_NUMBER_VALUE,
      nativeBalance: process.env.BANK_ACCOUNT_NATIVE_BALANCE,
      clickPrefix: process.env.BANK_ACCOUNT_CLICK_PREFIX,
      viewMoreButtonPrefix: process.env.BANK_VIEW_MORE_BUTTON_PREFIX,
      exportButton: process.env.BANK_EXPORT_BUTTON,
      exportActionButtonPrefix: process.env.BANK_EXPORT_ACTION_BUTTON_PREFIX,
      exportConfirmButtonPrefix: process.env.BANK_EXPORT_CONFIRM_BUTTON_PREFIX,
    },
    accounts: {
      button: process.env.BANK_ACCOUNTS_BUTTON || '',
      listContainer: process.env.BANK_ACCOUNTS_LIST_CONTAINER || '',
      accountCard: process.env.BANK_ACCOUNT_CARD || '',
      accountNumber: process.env.BANK_ACCOUNT_NUMBER || '',
    }
  }
} as const;

export function validateConfig() {
  const requiredEnvVars = Object.keys(config);
  const missingVars = requiredEnvVars.filter(key => !config[key as keyof typeof config]);

  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
}
