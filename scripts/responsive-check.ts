import { chromium, type Page } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const EMAIL = process.env.TEST_EMAIL || '';
const PASSWORD = process.env.TEST_PASSWORD || '';
const OUT_DIR = '.responsive-screenshots';

const VIEWPORTS = [
  { name: 'mobile-375', width: 375, height: 812 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'desktop-1440', width: 1440, height: 900 },
];

const PUBLIC_ROUTES = ['/', '/login', '/register'];
const AUTH_ROUTES = [
  '/dashboard',
  '/nuovo',
  '/preventivi',
  '/preventivi/archivio',
  '/clienti',
  '/impostazioni',
];

async function login(page: Page) {
  if (!EMAIL || !PASSWORD) {
    throw new Error('TEST_EMAIL / TEST_PASSWORD env vars required for auth routes');
  }
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[type="email"]', EMAIL);
  await page.fill('input[type="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(dashboard|nuovo)/, { timeout: 20000 });
}

async function shoot(
  page: Page,
  route: string,
  viewport: (typeof VIEWPORTS)[number],
  label: string,
) {
  await page.setViewportSize({ width: viewport.width, height: viewport.height });
  try {
    await page.goto(`${BASE_URL}${route}`, { waitUntil: 'networkidle', timeout: 20000 });
  } catch {
    // fall back to domcontentloaded if networkidle times out
    await page.goto(`${BASE_URL}${route}`, { waitUntil: 'domcontentloaded' });
  }
  await page.waitForTimeout(1000);
  const safeRoute = route === '/' ? 'root' : route.replace(/^\//, '').replace(/\//g, '_');
  const dir = join(OUT_DIR, label, safeRoute);
  await mkdir(dir, { recursive: true });
  const path = join(dir, `${viewport.name}.png`);
  await page.screenshot({ path, fullPage: true });
  console.log(`  ✓ ${route} @ ${viewport.name} → ${path}`);
}

async function main() {
  const label = process.argv[2] || 'run';
  const onlyRoute = process.argv[3];
  console.log(`📸 Responsive screenshots — label: "${label}"`);

  const browser = await chromium.launch();

  // Public routes
  const publicCtx = await browser.newContext();
  const publicPage = await publicCtx.newPage();
  const publicRoutes = onlyRoute ? PUBLIC_ROUTES.filter((r) => r === onlyRoute) : PUBLIC_ROUTES;
  for (const route of publicRoutes) {
    for (const vp of VIEWPORTS) await shoot(publicPage, route, vp, label);
  }
  await publicCtx.close();

  // Authenticated routes
  const authRoutes = onlyRoute ? AUTH_ROUTES.filter((r) => r === onlyRoute) : AUTH_ROUTES;
  if (authRoutes.length > 0) {
    const authCtx = await browser.newContext();
    const authPage = await authCtx.newPage();
    await login(authPage);
    for (const route of authRoutes) {
      for (const vp of VIEWPORTS) await shoot(authPage, route, vp, label);
    }
    await authCtx.close();
  }

  await browser.close();
  console.log(`\nDone. Screenshots saved under ${OUT_DIR}/${label}/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
