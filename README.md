[![npm version](https://badge.fury.io/js/bank-transaction-extractor.svg)](https://badge.fury.io/js/bank-transaction-extractor)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Downloads](https://img.shields.io/npm/dm/bank-transaction-extractor.svg)](https://www.npmjs.com/package/bank-transaction-extractor)

# Bank Transaction Extractor

A Node.js library for automated transaction extraction from online banking portals with currency conversion support. Designed for financial institutions that use web-based interfaces with CAPTCHA verification.

## ⚠️ Important Legal Disclaimer

This library is not affiliated, associated, authorized, endorsed by, or in any way officially connected with any financial institution. It is provided "as-is" without any warranties or guarantees. Users are responsible for:

- Ensuring compliance with all applicable data protection laws and regulations
- Obtaining necessary permissions for data access and processing
- Securely handling and storing any extracted financial data
- Verifying the accuracy of extracted data
- Using the library in accordance with their banking institution's terms of service

This library is intended for personal finance management only and should not be used to alter, falsify, or misrepresent financial data.

## Data Protection & Security Guidelines

1. **Data Privacy**:
   - All processing occurs locally on your machine
   - No data is transmitted to external servers
   - Temporary files are automatically cleared
   - Implements secure data handling practices

2. **Security Best Practices**:
   - Uses secure HTTPS connections
   - Implements robust authentication
   - Regular security updates
   - Follows standard financial security protocols

## Compatibility

This library is compatible with online banking portals that:
- Implement CAPTCHA verification
- Provide CSV/Excel export functionality
- Display transaction history in tabular format
- Support standard date formats (DD/MM/YYYY)

## Features

- Automated login with CAPTCHA solving using Google Gemini Vision API
- Transaction extraction for specified accounts
- Multi-currency support with conversion
- TypeScript support
- Automated cleanup of temporary files

## Installation

```bash
npm install bank-transaction-extractor
```

## Environment Variables

Create a `.env` file in your project root with the required variables. Here are the key environment variables you need to set:

### Required Variables
- `BANK_BASE_URL` - Your bank's base URL
- `BANK_LOGIN_USERNAME_SELECTOR` - CSS selector for username input
- `BANK_LOGIN_PASSWORD_SELECTOR` - CSS selector for password input
- `BANK_LOGIN_CONTINUE_BUTTON` - CSS selector for login button
- `BANK_LOGIN_CAPTCHA_INPUT` - CSS selector for CAPTCHA input field
- `BANK_LOGIN_CAPTCHA_IMAGE` - CSS selector for CAPTCHA image
- `BANK_ACCOUNTS_BUTTON` - CSS selector for the accounts button
- `BANK_ACCOUNTS_LIST_CONTAINER` - CSS selector for the accounts list container
- `BANK_ACCOUNT_CARD` - CSS selector for individual account cards
- `BANK_ACCOUNT_NUMBER` - CSS selector for account number within cards
- `BANK_DOWNLOAD_PATH` - Path where downloaded files will be stored
- And other bank-specific selectors...

Create a `.env` file in your project root with the required variables. You can find a template with all required variables in the `.env.example` file.
### Example .env file:
```
BANK_BASE_URL=https://your-bank-url.com
BANK_DOWNLOAD_PATH=./downloads
GEMINI_API_KEY=your-gemini-api-key-here
```

## Usage

### Basic Usage - Get Transactions

```typescript
import { getTransactions, Currency } from 'bank-transaction-extractor';

async function main() {
  try {
    const transactions = await getTransactions({
      username: 'your-username',
      password: 'your-password',
      accountNumber: 'your-account-number'
    });
    
    console.log('Transactions:', transactions);
  } catch (error) {
    console.error('Error:', error);
  }
}
```

### Get All Account Numbers

```typescript
import { getAllAccountNumbers } from 'bank-transaction-extractor';

async function main() {
  try {
    const accountNumbers = await getAllAccountNumbers(
      'your-username',
      'your-password'
    );
    
    console.log('Account Numbers:', accountNumbers);
  } catch (error) {
    console.error('Error:', error);
  }
}
```

### Get All Accounts Information

```typescript
import { getAllAccountsInfo, AccountInfo } from 'bank-transaction-extractor';

async function main() {
  try {
    const accountsInfo: AccountInfo[] = await getAllAccountsInfo(
      'your-username',
      'your-password'
    );
    
    console.log('Accounts Information:', accountsInfo);
    
    // Each account info contains:
    // - accountNumber: string
    // - accountName: string
    // - currency: Currency
    // - balance: number
    // - status: string
  } catch (error) {
    console.error('Error:', error);
  }
}
```

### Get Transactions with Currency Conversion

```typescript
import { getTransactions, Currency } from 'bank-transaction-extractor';

async function main() {
  try {
    const transactions = await getTransactions({
      username: 'your-username',
      password: 'your-password',
      accountNumber: 'your-account-number',
      targetCurrency: Currency.USD, // Optional: Target currency
      exchangeRate: 0.032 // Optional: Exchange rate (EGP to USD in this example)
    });
    
    console.log('Converted Transactions:', transactions);
  } catch (error) {
    console.error('Error:', error);
  }
}
```

## Transaction Object Structure

Each transaction object contains:

```typescript
interface BankTransaction {
  transactionDate: string;
  valueDate: string;
  description: string;
  debitAmount: number;
  creditAmount: number;
  balance: number;
  reference: string;
  currency: string;
}
```

## Error Handling

The library throws errors for various scenarios:
- Invalid credentials
- CAPTCHA solving failures
- Network issues
- Missing configuration

Always wrap your calls in try-catch blocks for proper error handling.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

[MIT License](LICENSE) - see the [LICENSE](LICENSE) file for details