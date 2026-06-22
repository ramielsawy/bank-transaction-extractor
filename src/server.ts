import http from 'http';
import { URL } from 'url';
import dotenv from 'dotenv';
import { getTransactions } from './index';
import { isValidAccountNumber, transactionsToCsv } from './services/StatementService';

dotenv.config();

const PORT = Number(process.env.PORT || process.env.API_PORT) || 3000;
const API_KEY = process.env.API_KEY;

interface StatementRequest {
  username?: string;
  password?: string;
  accountNumber?: string;
}

function sendJson(res: http.ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

function isAuthorized(req: http.IncomingMessage): boolean {
  if (!API_KEY) {
    return true;
  }
  return req.headers['x-api-key'] === API_KEY;
}

function parseJsonBody(req: http.IncomingMessage): Promise<StatementRequest> {
  return new Promise((resolve, reject) => {
    let data = '';

    req.on('data', (chunk) => {
      data += chunk;
    });

    req.on('end', () => {
      if (!data) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(data));
      } catch {
        reject(new Error('Invalid JSON body'));
      }
    });

    req.on('error', reject);
  });
}

function resolveStatementParams(body: StatementRequest, searchParams: URLSearchParams): StatementRequest {
  return {
    username: body.username || searchParams.get('username') || process.env.BANK_USERNAME,
    password: body.password || searchParams.get('password') || process.env.BANK_PASSWORD,
    accountNumber: body.accountNumber || searchParams.get('accountNumber') || process.env.BANK_ACCOUNT_NUMBER,
  };
}

async function handleStatement(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  body: StatementRequest,
  searchParams: URLSearchParams
): Promise<void> {
  const { username, password, accountNumber } = resolveStatementParams(body, searchParams);

  if (!username || !password || !accountNumber) {
    sendJson(res, 400, {
      error: 'username, password, and accountNumber are required (body, query, or .env)',
    });
    return;
  }

  if (!isValidAccountNumber(accountNumber)) {
    sendJson(res, 400, {
      error: 'accountNumber must be a bank account number, not a CSS selector',
    });
    return;
  }

  console.log(`Fetching statement for account ${accountNumber}...`);
  const transactions = await getTransactions(username, password, accountNumber);
  const csv = transactionsToCsv(transactions);
  const filename = `statement-${accountNumber}.csv`;

  res.writeHead(200, {
    'Content-Type': 'text/csv; charset=utf-8',
    'Content-Disposition': `attachment; filename="${filename}"`,
  });
  res.end(csv);
  console.log(`Returned ${transactions.length} transactions for account ${accountNumber}`);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);

  try {
    if (req.method === 'GET' && url.pathname === '/health') {
      sendJson(res, 200, { status: 'ok' });
      return;
    }

    if ((req.method === 'POST' || req.method === 'GET') && url.pathname === '/api/statement') {
      if (!isAuthorized(req)) {
        sendJson(res, 401, { error: 'Unauthorized' });
        return;
      }

      const body = req.method === 'POST' ? await parseJsonBody(req) : {};
      await handleStatement(req, res, body, url.searchParams);
      return;
    }

    sendJson(res, 404, { error: 'Not found' });
  } catch (error) {
    console.error('API error:', error);
    sendJson(res, 500, {
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Bank statement API listening on port ${PORT}`);
  console.log(`  GET  /health`);
  console.log(`  POST /api/statement`);
  console.log(`  GET  /api/statement?accountNumber=...`);
  if (API_KEY) {
    console.log('  Auth: x-api-key header required');
  }
});
