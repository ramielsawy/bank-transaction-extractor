import { parse } from 'csv-parse/sync';
import { CsvRow } from '../types/CsvRow';
import { Page } from 'puppeteer';

export async function waitForCsvApiResponse(page: Page): Promise<string> {
  const response = await page.waitForResponse(
    (res) => res.url().includes('/v1/transfers') && res.url().includes('format=csv') && res.status() === 200,
    { timeout: 60000 }
  );

  const json = await response.json();
  if (!json.data) {
    throw new Error('CSV data not found in API response');
  }

  return Buffer.from(json.data, 'base64').toString('utf8');
}

export async function parseCsvContent(fileContent: string): Promise<CsvRow[]> {
  const normalizedContent = fileContent.replace(/^\uFEFF/, '');
  const lines = normalizedContent.split('\n');
  const headerIndex = lines.findIndex((line) => line.startsWith('Date,'));
  const csvData = headerIndex >= 0 ? lines.slice(headerIndex).join('\n') : normalizedContent;

  return parse(csvData, {
    columns: true,
    skip_empty_lines: true,
  });
}
