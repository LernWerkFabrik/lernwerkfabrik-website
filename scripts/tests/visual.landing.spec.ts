import { test, expect } from '@playwright/test';

const BASE_URL = process.env.PW_BASE_URL ?? 'http://localhost:3000';
const SCREENSHOT_OPTIONS = {
  fullPage: true,
  animations: 'disabled' as const,
  caret: 'hide' as const,
  timeout: 20000,
  maxDiffPixels: 400,
};

test.describe('LWF Landing Visual', () => {
  test('baseline: landing screenshot', async ({ page }) => {
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });

    await expect(page).toHaveScreenshot('landing.png', SCREENSHOT_OPTIONS);
  });

  test('PROVOKE: force layout regression (should FAIL without --update-snapshots)', async ({ page }) => {
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });

    await page.addStyleTag({
      content: `
        /* Provoked regression */
        body { padding-right: 0 !important; }
        main, header, [data-testid="page"], .container { padding-right: 0 !important; }
        /* Optional: small shift to guarantee visible diff */
        main { transform: translateX(6px) !important; }
      `,
    });

    await expect(page).toHaveScreenshot('landing.png', SCREENSHOT_OPTIONS);
  });
});
