import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { stringify } from 'csv-stringify/sync';
import { getTransactions } from '../src/index';

dotenv.config();

async function main() {
  const username = process.env.BANK_USERNAME;
  const password = process.env.BANK_PASSWORD;
  const accountNumber = process.argv[2] || process.env.BANK_ACCOUNT_NUMBER;
  const outputPath = process.argv[3] || 'statement.csv';

  if (!username || !password) {
    console.error('Set BANK_USERNAME and BANK_PASSWORD in .env');
    process.exit(1);
  }

  if (!accountNumber) {
    console.error('Set BANK_ACCOUNT_NUMBER in .env or pass it as the first argument');
    process.exit(1);
  }

  try {
    console.log(`Fetching transactions for account ${accountNumber}...`);
    const transactions = await getTransactions(username, password, accountNumber);

    const csv = stringify(transactions, { header: true });
    const resolvedPath = path.resolve(outputPath);
    fs.writeFileSync(resolvedPath, csv);

    console.log(`Saved ${transactions.length} transactions to ${resolvedPath}`);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
