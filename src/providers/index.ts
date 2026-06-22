import { cibProvider } from './cibProvider';
import { BankProvider } from './types';

const providers = new Map<string, BankProvider>([[cibProvider.id, cibProvider]]);

export class UnknownBankError extends Error {
  constructor(
    public readonly bankId: string,
    public readonly supportedBankIds: string[]
  ) {
    super(
      `Unknown bank "${bankId}". Supported banks: ${supportedBankIds.join(', ') || 'none'}`
    );
    this.name = 'UnknownBankError';
  }
}

export function listSupportedBankIds(): string[] {
  return [...providers.keys()];
}

export function getBankProvider(bankId: string): BankProvider | undefined {
  return providers.get(bankId.toLowerCase());
}

export function isSupportedBankId(bankId: string): boolean {
  return providers.has(bankId.toLowerCase());
}

export function resolveBankProvider(bankId: string): BankProvider {
  const provider = getBankProvider(bankId);
  if (!provider) {
    throw new UnknownBankError(bankId, listSupportedBankIds());
  }
  return provider;
}

export { BankProvider } from './types';
export { cibProvider } from './cibProvider';
