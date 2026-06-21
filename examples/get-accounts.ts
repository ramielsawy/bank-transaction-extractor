import { getAllAccountNumbers, getAllAccountsInfo, AccountInfo } from '../src/index';

async function main() {
  const username = process.env.BANK_USERNAME;
  const password = process.env.BANK_PASSWORD;

  if (!username || !password) {
    console.error('Please set BANK_USERNAME and BANK_PASSWORD environment variables');
    process.exit(1);
  }

  try {
    console.log('🔐 Logging in and navigating to accounts page...');
    
    // Get all account numbers
    console.log('\n📋 Getting all account numbers...');
    const accountNumbers = await getAllAccountNumbers(username, password);
    console.log('Account Numbers:', accountNumbers);
    
    // Get detailed account information
    console.log('\n📊 Getting detailed account information...');
    const accountsInfo: AccountInfo[] = await getAllAccountsInfo(username, password);
    
    console.log('\n🏦 Accounts Information:');
    accountsInfo.forEach((account, index) => {
      console.log(`\n  Account ${index + 1}:`);
      console.log(`    Number: ${account.accountNumber}`);
      console.log(`    Name: ${account.accountName}`);
      console.log(`    Currency: ${account.currency}`);
      console.log(`    Balance: ${account.balance}`);
      console.log(`    Status: ${account.status}`);
    });
    
    console.log('\n✅ Successfully retrieved all account information!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main(); 