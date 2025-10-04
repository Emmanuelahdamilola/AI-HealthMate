
import { NextRequest } from 'next/server';

const RATE_LIMIT_WINDOW = 60 * 1000; // 1 min
const MAX_REQUESTS = 30; // max requests per window

const clients: Record<string, { count: number; firstRequest: number }> = {};

export const rateLimiter = (req: NextRequest) => {
  // @ts-ignore
  const ip = req.headers.get('x-forwarded-for') || req.ip || 'unknown';
  const now = Date.now();

  if (!clients[ip] || now - clients[ip].firstRequest > RATE_LIMIT_WINDOW) {
    clients[ip] = { count: 1, firstRequest: now };
    return true;
  }

  if (clients[ip].count < MAX_REQUESTS) {
    clients[ip].count += 1;
    return true;
  }

  return false;
};
