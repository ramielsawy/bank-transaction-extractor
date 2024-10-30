import fs from 'fs/promises';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { CsvRow } from '../types/CsvRow';
import { config } from '../config/config';
import { Page } from 'puppeteer';

export async function getDownloadedFileContent(page: Page): Promise<string> {
    // Set up download behavior
    const client = await page.target().createCDPSession();
    await client.send('Page.setDownloadBehavior', {
        behavior: 'allow',
        downloadPath: config.downloadPath
    });
    let fileFound = false;
    let attempts = 0;
    const downloadWaitTime = 30; // 30 seconds total wait time

    while (!fileFound && attempts < downloadWaitTime) {
        const files = await fs.readdir(config.downloadPath);
        if (files.length > 0 && !files[0].endsWith('.crdownload')) {
            fileFound = true;
            console.log(`Download completed: ${files[0]}`);
            const filePath = path.join(config.downloadPath, files[0]);
            const fileContent = await fs.readFile(filePath, 'utf8');
            await fs.unlink(filePath);
            return fileContent;
        }
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        attempts++;
    }
    throw new Error(`Download failed after ${downloadWaitTime} seconds`);
}

export async function parseCsvContent(fileContent: string): Promise<CsvRow[]> {
    return parse(fileContent, {
        columns: true,
    });
}
