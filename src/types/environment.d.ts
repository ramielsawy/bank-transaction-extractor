declare global {
  namespace NodeJS {
    interface ProcessEnv {
      BANK_BASE_URL: string;
      BANK_LOGIN_USERNAME_SELECTOR: string;
      BANK_LOGIN_PASSWORD_SELECTOR: string;
      BANK_LOGIN_CONTINUE_BUTTON: string;
      BANK_LOGIN_CAPTCHA_INPUT: string;
      BANK_LOGIN_CAPTCHA_IMAGE: string;
      BANK_LOGIN_CAPTCHA_REFRESH: string;
      BANK_ALREADY_LOGGED_IN_POPUP: string;
      BANK_ALREADY_LOGGED_IN_ACTION_BUTTON: string;
      BANK_ACCOUNTS_BUTTON: string;
      BANK_ACCOUNT_CARD: string;
      BANK_ACCOUNT_NUMBER: string;
      BANK_ACCOUNT_PRESSABLE_SUFFIX: string;
      BANK_ACCOUNT_NAME: string;
      BANK_ACCOUNT_BALANCE: string;
      BANK_ACCOUNT_STATUS: string;
      BANK_VIEW_ALL_BUTTON: string;
      BANK_DOWNLOAD_BUTTON: string;
      BANK_EXPORT_CSV_OPTION: string;
      BANK_EXPORT_CONFIRM_BUTTON: string;
      BANK_DOWNLOAD_PATH: string;
      BANK_MAX_LOGIN_ATTEMPTS: string;
      BANK_MAX_CAPTCHA_ATTEMPTS: string;
      GEMINI_API_KEY: string;
    }
  }
}

export {};
