import fs from 'fs';
import path from 'path';

const RATE_LIMIT_FILE = path.join(process.cwd(), 'rate-limit.json');
const DAILY_LIMIT = 25;

interface RateLimitData {
  count: number;
  lastResetDate: string;
}

function getRateLimitData(): RateLimitData {
  try {
    if (fs.existsSync(RATE_LIMIT_FILE)) {
      const data = fs.readFileSync(RATE_LIMIT_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error reading rate limit file:', error);
  }
  return { count: 0, lastResetDate: getTodayDate() };
}

function getTodayDate(): string {
  return new Date().toLocaleDateString('en-CA');
}

function shouldReset(data: RateLimitData): boolean {
  const today = getTodayDate();
  return data.lastResetDate !== today;
}

function saveRateLimitData(data: RateLimitData): void {
  try {
    fs.writeFileSync(RATE_LIMIT_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error writing rate limit file:', error);
  }
}

export function checkRateLimit(): { allowed: boolean; remaining: number; resetAt: string } {
  let data = getRateLimitData();

  if (shouldReset(data)) {
    data = { count: 0, lastResetDate: getTodayDate() };
  }

  const remaining = DAILY_LIMIT - data.count;
  const resetAt = getNextMidnight();

  if (data.count >= DAILY_LIMIT) {
    return { allowed: false, remaining: 0, resetAt };
  }

  data.count += 1;
  saveRateLimitData(data);

  return {
    allowed: true,
    remaining: DAILY_LIMIT - data.count,
    resetAt,
  };
}

function getNextMidnight(): string {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow.toISOString();
}

export function getRateLimitStatus(): { remaining: number; limit: number; resetAt: string } {
  let data = getRateLimitData();

  if (shouldReset(data)) {
    data = { count: 0, lastResetDate: getTodayDate() };
    saveRateLimitData(data);
  }

  return {
    remaining: Math.max(0, DAILY_LIMIT - data.count),
    limit: DAILY_LIMIT,
    resetAt: getNextMidnight(),
  };
}
