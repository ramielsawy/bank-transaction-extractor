# Selectors Configuration Guide

This guide explains how to configure the environment variables for the new accounts functionality based on the HTML structure provided.

## New Environment Variables for Accounts Functionality

### BANK_ACCOUNTS_BUTTON
**Purpose**: Selector for the accounts button that navigates to the accounts list page.

**HTML Reference**:
```html
<div tabindex="0" class="css-175oi2r r-1loqt21 r-1otgn73" data-testid="accounts-pressable">
```

**Recommended Selector**:
```
BANK_ACCOUNTS_BUTTON=[data-testid="accounts-pressable"]
```

### BANK_ACCOUNTS_LIST_CONTAINER
**Purpose**: Selector for the container that holds the list of accounts on the accounts page.

**HTML Reference**:
```html
<div class="css-175oi2r r-150rngu r-eqz5dr r-16y2uox r-1wbh5a2 r-11yh6sk r-1rnoaur r-agouwx r-1joea0r r-1mf7evn" style="margin-top: 0px; margin-bottom: 0px;">
```

**Recommended Selector**:
```
BANK_ACCOUNTS_LIST_CONTAINER=.css-175oi2r.r-150rngu.r-eqz5dr.r-16y2uox.r-1wbh5a2.r-11yh6sk.r-1rnoaur.r-agouwx.r-1joea0r.r-1mf7evn
```

### BANK_ACCOUNT_CARD
**Purpose**: Selector for individual account cards within the accounts list.

**HTML Reference**:
```html
<div tabindex="0" class="css-175oi2r r-1loqt21 r-1otgn73" data-testid="100037773586-pressable">
```

**Recommended Selector**:
```
BANK_ACCOUNT_CARD=[data-testid*="-pressable"]
```

### BANK_ACCOUNT_NUMBER
**Purpose**: Selector for the account number within each account card.

**HTML Reference**:
```html
<div dir="ltr" aria-label="100037773586" class="css-146c3p1 r-djgu52 r-1yu1gf3 r-ubezar r-135wba7 r-fdjqy7 r-3twk1y" data-testid="account-number">100037773586</div>
```

**Recommended Selector**:
```
BANK_ACCOUNT_NUMBER=[data-testid="account-number"]
```

## Example .env Configuration

Add these lines to your `.env` file:

```bash
# Accounts functionality selectors
BANK_ACCOUNTS_BUTTON=[data-testid="accounts-pressable"]
BANK_ACCOUNTS_LIST_CONTAINER=.css-175oi2r.r-150rngu.r-eqz5dr.r-16y2uox.r-1wbh5a2.r-11yh6sk.r-1rnoaur.r-agouwx.r-1joea0r.r-1mf7evn
BANK_ACCOUNT_CARD=[data-testid*="-pressable"]
BANK_ACCOUNT_NUMBER=[data-testid="account-number"]
```

## Account Structure Expected

Based on the HTML provided, the system expects accounts to be structured as follows:

### Savings Accounts
- Account Name: "Main", "DONOTUSE", etc.
- Account Numbers: "100037773586", "100049719005", etc.
- Currency: "EGP"
- Balance: Displayed as "‎496.75 EGP", "‎0.00 EGP", etc.
- Status: "Active"

### Current Accounts
- Account Name: "EGP Current", "EUR Current", "USD Current", etc.
- Account Numbers: "100055375938", "100059815312", "100059815304", etc.
- Currency: "EGP", "EUR", "USD", etc.
- Balance: Displayed with currency symbol
- Status: "Active"

## Testing the Configuration

You can test the configuration by running:

```bash
npm test -- tests/accounts.test.ts
```

Or use the example script:

```bash
npx ts-node examples/get-accounts.ts
```

## Troubleshooting

If the selectors don't work:

1. **Check the HTML structure**: The bank's website might have changed. Inspect the elements and update the selectors accordingly.

2. **Use more specific selectors**: If the CSS classes are too generic, try using `data-testid` attributes or more specific class combinations.

3. **Test individual selectors**: Use browser developer tools to test each selector manually.

4. **Check for dynamic content**: Some elements might be loaded dynamically. Ensure the selectors work after the page has fully loaded. 