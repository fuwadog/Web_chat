import fs from 'fs';
import path from 'path';

const RATE_LIMIT_FILE = path.join(process.cwd(), 'rate-limit.json');
const DAILY_LIMIT = 25;
const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 10;

interface RateLimitData {
  count: number;
  lastResetDate: string;
}

interface SlidingWindowEntry {
  timestamp: number;
}

const inMemoryLimit = {
  window: new Map<string, SlidingWindowEntry[]>(),
  cleanupInterval: null as ReturnType<typeof setInterval> | null,
};

function cleanupWindow(): void {
  const now = Date.now();
  for (const [key, entries] of inMemoryLimit.window) {
    const valid = entries.filter(e => now - e.timestamp < WINDOW_MS);
    if (valid.length === 0) {
      inMemoryLimit.window.delete(key);
    } else {
      inMemoryLimit.window.set(key, valid);
    }
  }
}

inMemoryLimit.cleanupInterval = setInterval(cleanupWindow, WINDOW_MS);

function getTodayDate(): string {
  return new Date().toLocaleDateString('en-CA');
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

function shouldReset(data: RateLimitData): boolean {
  return data.lastResetDate !== getTodayDate();
}

function saveRateLimitData(data: RateLimitData): void {
  try {
    fs.writeFileSync(RATE_LIMIT_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error writing rate limit file:', error);
  }
}

function getNextMidnight(): string {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow.toISOString();
}

export function checkRateLimit(): { allowed: boolean; remaining: number; resetAt: string } {
  const data = getRateLimitData();
  if (shouldReset(data)) {
    const newData = { count: 0, lastResetDate: getTodayDate() };
    saveRateLimitData(newData);
    return { allowed: true, remaining: DAILY_LIMIT, resetAt: getNextMidnight() };
  }

  if (data.count >= DAILY_LIMIT) {
    return { allowed: false, remaining: 0, resetAt: getNextMidnight() };
  }

  data.count += 1;
  saveRateLimitData(data);

  return {
    allowed: true,
    remaining: DAILY_LIMIT - data.count,
    resetAt: getNextMidnight(),
  };
}

export function checkSlidingWindowLimit(key: string): boolean {
  const now = Date.now();
  const entries = inMemoryLimit.window.get(key) || [];
  const validEntries = entries.filter(e => now - e.timestamp < WINDOW_MS);

  if (validEntries.length >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }

  validEntries.push({ timestamp: now });
  inMemoryLimit.window.set(key, validEntries);
  return true;
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

export function cleanupRateLimit(): void {
  if (inMemoryLimit.cleanupInterval) {
    clearInterval(inMemoryLimit.cleanupInterval);
  }
  inMemoryLimit.window.clear();
}