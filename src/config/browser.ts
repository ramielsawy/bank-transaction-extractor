import puppeteer from 'puppeteer';

export function getBrowserLaunchOptions(overrides: Record<string, unknown> = {}): puppeteer.LaunchOptions {
  const baseArgs = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--ignore-certificate-errors',
  ];

  const overrideArgs = Array.isArray(overrides.args) ? overrides.args as string[] : [];

  return {
    ignoreHTTPSErrors: true,
    headless: process.env.NODE_ENV === 'production' ? true : (overrides.headless as boolean | undefined) ?? true,
    ...overrides,
    args: [...baseArgs, ...overrideArgs],
    ...(process.env.PUPPETEER_EXECUTABLE_PATH
      ? { executablePath: process.env.PUPPETEER_EXECUTABLE_PATH }
      : {}),
  } as puppeteer.LaunchOptions;
}
