import { Currency } from '../enums/Currency';

export interface AccountDetails {
  currency?: Currency;
  element: Element;
  nativeBalanceElement: Element;
  accountNumber: string;
  elementId?: string;
}

