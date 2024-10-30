export interface Transaction {
  transactionDate: string;
  valueDate: string;
  description: string;
  debitAmount: number;
  creditAmount: number;
  balance: number;
  reference: string;
  currency: string;
}
