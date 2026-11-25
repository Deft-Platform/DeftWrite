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

  test('Save / File It flashes Saved', async ({ page }) => {
    await createDraft(page, 'Advance Me');
    await page.locator('.ProseMirror').click();
    await page.keyboard.type('Some content.');

    await page.getByRole('button', { name: /Save \/ File It/ }).click();
    await expect(page.getByText('Saved')).toBeVisible();
  });

  test('a captured item is an idea; writing into it promotes it to a draft', async ({ page }) => {
    await createDraft(page, 'Just an idea');
    const now = page.locator('[data-active-draft="true"]'); // the Now card
    await expect(now).toHaveAttribute('data-idea', 'true');
    await expect(now).toContainText('Idea');

    // Writing into it promotes it to a draft (no longer an idea).
    await page.locator('.ProseMirror').click();
    await page.keyboard.type('Now it has content.');
    await expect(now).not.toHaveAttribute('data-idea', 'true');
    await expect(now).toContainText('Draft');
  });

  test('queue tiers: active item is Now; others fall into Drafts / Ideas', async ({ page }) => {
    await createDraft(page, 'First Idea');  // becomes Now
    await createDraft(page, 'Second Idea'); // now Now; First Idea drops to Ideas

    const sidebar = page.locator('aside').first();
    // Now shows the most recent capture.
    await expect(sidebar.locator('[data-active-draft="true"]')).toContainText('Second Idea');
    // First Idea is tucked into the collapsed Ideas section.
    await expect(sidebar.getByText('First Idea')).toHaveCount(0);
    await sidebar.getByRole('button', { name: /^Ideas/ }).click(); // expand
    await expect(sidebar.getByText('First Idea')).toBeVisible();

    // Opening it makes it the Now item.
    await sidebar.getByText('First Idea').click();
    await expect(sidebar.locator('[data-active-draft="true"]')).toContainText('First Idea');
  });
});
