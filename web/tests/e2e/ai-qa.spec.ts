import { test, expect } from '@playwright/test';

// ECD-7: the chat sidebar talks to a real model (halo/Gemma via the dev proxy).
// This makes a live network call, so give it a generous timeout.
const BASE_URL = process.env.QA_BASE_URL || 'http://localhost:5199';

test.describe('DeftWrite AI chat', () => {
  test.setTimeout(60000);

  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('chat returns a real model reply (not the "not configured" stub)', async ({ page }) => {
    await page.getByRole('button', { name: /New draft/i }).click();
    await page.getByPlaceholder('Draft title...').fill('AI Test');
    await page.getByRole('button', { name: 'Create', exact: true }).click();

    await page.getByPlaceholder('Ask anything...').fill('Respond with exactly the word READY and nothing else.');
    await page.getByPlaceholder('Ask anything...').press('Enter');

    // User bubble shows immediately.
    await expect(page.locator('.chat-msg-new')).toHaveCount(1);

    // Assistant bubble arrives from the model.
    await expect(page.locator('.chat-msg-new')).toHaveCount(2, { timeout: 45000 });
    const assistant = page.locator('.chat-msg-new').nth(1);
    const text = (await assistant.innerText()).trim();
    expect(text.length, 'assistant reply should be non-empty').toBeGreaterThan(0);
    expect(text, 'should not be the old "not configured" stub').not.toMatch(/not configured/i);
    expect(text, 'should not be the network-error fallback').not.toMatch(/couldn't reach/i);
  });
});
