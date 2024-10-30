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
      BANK_ACCOUNT_DETAILS_CONTAINER: string;
      BANK_ACCOUNT_NUMBER_VALUE: string;
      BANK_ACCOUNT_NATIVE_BALANCE: string;
      BANK_ACCOUNT_CLICK_PREFIX: string;
      BANK_VIEW_MORE_BUTTON_PREFIX: string;
      BANK_EXPORT_BUTTON: string;
      BANK_EXPORT_ACTION_BUTTON_PREFIX: string;
      BANK_EXPORT_CONFIRM_BUTTON_PREFIX: string;
      BANK_ALREADY_LOGGED_IN_MESSAGE: string;
      BANK_ALREADY_LOGGED_IN_CONTINUE: string;
      BANK_DOWNLOAD_PATH: string;
      BANK_MAX_LOGIN_ATTEMPTS: string;
      BANK_MAX_CAPTCHA_ATTEMPTS: string;
    }
  }
}

export {};
