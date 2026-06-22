import {
  getBankProvider,
  isSupportedBankId,
  listSupportedBankIds,
  resolveBankProvider,
  UnknownBankError,
} from '../src/providers';

describe('bank providers', () => {
  it('lists supported banks', () => {
    expect(listSupportedBankIds()).toContain('cib');
  });

  it('resolves known bank providers', () => {
    const provider = resolveBankProvider('cib');
    expect(provider.id).toBe('cib');
    expect(provider.name).toContain('CIB');
  });

  it('is case-insensitive', () => {
    expect(getBankProvider('CIB')?.id).toBe('cib');
    expect(isSupportedBankId('CIB')).toBe(true);
  });

  it('throws for unknown banks', () => {
    expect(() => resolveBankProvider('unknown-bank')).toThrow(UnknownBankError);

    try {
      resolveBankProvider('unknown-bank');
    } catch (error) {
      expect(error).toBeInstanceOf(UnknownBankError);
      expect((error as UnknownBankError).supportedBankIds).toContain('cib');
    }
  });
});
