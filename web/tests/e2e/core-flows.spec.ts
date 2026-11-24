import { test, expect } from '@playwright/test';

// Core user flows that round out the browser-QA routine: draft lifecycle,
// persona switching, font cycling, and the Save / File It status advance.

async function reset(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForLoadState('networkidle');
}

async function createDraft(page: import('@playwright/test').Page, title: string) {
  await page.getByPlaceholder(/Capture an idea/).fill(title);
    await page.getByPlaceholder(/Capture an idea/).press('Enter');
}

test.describe('DeftWrite core flows', () => {
  test.beforeEach(async ({ page }) => reset(page));

  test('capture adds an item and delete requires confirmation', async ({ page }) => {
    await createDraft(page, 'Temp Draft');
    const queue = page.locator('aside').first();
    await expect(queue.getByText('Temp Draft')).toBeVisible();

    const active = page.locator('[data-active-draft="true"]');
    await active.hover();
    // One click no longer deletes — it asks to confirm.
    await active.getByRole('button', { name: 'Delete', exact: true }).click();
    await expect(active.getByText('Delete?')).toBeVisible();
    await expect(queue.getByText('Temp Draft')).toBeVisible(); // still there

    await active.getByRole('button', { name: 'Confirm delete' }).click();
    await expect(queue.getByText('Temp Draft')).toHaveCount(0);
  });

  test('persona switch updates the header and scopes the queue', async ({ page }) => {
    await createDraft(page, 'Biz Draft'); // created under the default "Business" persona
    // Open the persona selector and switch to Entrepreneur.
    await page.locator('aside').first().getByRole('button', { name: /Business/ }).click();
    await page.getByRole('button', { name: /Entrepreneur/ }).click();

    await expect(page.locator('header')).toContainText('Entrepreneur');
    // The Business draft should not show under the Entrepreneur persona.
    await expect(page.locator('aside').first().getByText('Biz Draft')).toHaveCount(0);
  });

  test('font switcher cycles serif -> sans', async ({ page }) => {
    const serif = page.getByRole('button', { name: 'Playfair', exact: true });
    await expect(serif).toBeVisible();
    await serif.click();
    // exact: 'Inter' would substring-match "Draft (Internal)" otherwise.
    await expect(page.getByRole('button', { name: 'Inter', exact: true })).toBeVisible();
  });

  test('Save / File It advances the draft status', async ({ page }) => {
    await createDraft(page, 'Advance Me');
    await page.locator('.ProseMirror').click();
    await page.keyboard.type('Some content.');

    await page.getByRole('button', { name: /Save \/ File It/ }).click();
    // A new draft starts at "draft"; the flow advances it to "polish".
    await expect(page.locator('[data-active-draft="true"]')).toContainText('polish');
  });

  test('a captured item is an idea; writing into it promotes it to a draft', async ({ page }) => {
    await createDraft(page, 'Just an idea');
    const item = page.locator('[data-active-draft="true"]');
    await expect(item).toHaveAttribute('data-idea', 'true');
    await expect(item).toContainText('Idea');

    // Writing into it promotes it to a draft (no longer an idea).
    await page.locator('.ProseMirror').click();
    await page.keyboard.type('Now it has content.');
    await expect(item).not.toHaveAttribute('data-idea', 'true');
    await expect(item).toContainText('draft');
  });

  test('ideas sink below focused drafts; priority promotes an idea (Up Next)', async ({ page }) => {
    await createDraft(page, 'A Draft'); // older idea
    await createDraft(page, 'B Draft'); // newer idea -> top among ideas (by recency)

    const queue = page.locator('aside').first();
    await expect(queue.locator('[data-priority]').first()).toContainText('B Draft');

    // One click on A's priority chip (none -> High) focuses it; it jumps to top.
    const aItem = queue.locator('[data-priority]', { hasText: 'A Draft' });
    await aItem.getByTitle(/priority/).click();

    const top = queue.locator('[data-priority]').first();
    await expect(top).toContainText('A Draft');
    await expect(top).toContainText('Up Next');
    await expect(top).toHaveAttribute('data-priority', 'high');
  });
});
