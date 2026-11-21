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
  await page.getByRole('button', { name: /New draft/i }).click();
  await page.getByPlaceholder('Draft title...').fill(title);
  await page.getByRole('button', { name: 'Create', exact: true }).click();
}

test.describe('DeftWrite core flows', () => {
  test.beforeEach(async ({ page }) => reset(page));

  test('draft lifecycle: create then delete', async ({ page }) => {
    await createDraft(page, 'Temp Draft');
    const queue = page.locator('aside').first();
    await expect(queue.getByText('Temp Draft')).toBeVisible();

    // The new draft is active; delete it via its row button.
    const active = page.locator('[data-active-draft="true"]');
    await active.hover();
    await active.getByRole('button', { name: 'Delete draft' }).click();
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

  test('inbox: capture an idea and promote it to a draft', async ({ page }) => {
    await page.getByPlaceholder('Capture an idea...').fill('Write about evidence');
    await page.getByPlaceholder('Capture an idea...').press('Enter');

    const sidebar = page.locator('aside').first();
    const ideaRow = sidebar.locator('div', { hasText: 'Write about evidence' }).last();
    await expect(ideaRow).toBeVisible();

    await ideaRow.getByTitle('Start a draft from this idea').click();
    // Promoted: editor opens on the new draft, titled from the idea.
    await expect(page.locator('input[placeholder="Untitled"]')).toHaveValue('Write about evidence');
    // And it leaves the inbox.
    await expect(sidebar.getByText('Write about evidence', { exact: true })).toHaveCount(1);
  });

  test('priority sorts the queue above recency (Up Next)', async ({ page }) => {
    await createDraft(page, 'A Draft'); // older
    await createDraft(page, 'B Draft'); // newer -> starts on top (both Med)

    const queue = page.locator('aside').first();
    await expect(queue.locator('[data-priority]').first()).toContainText('B Draft');

    // Raise A Draft to High (Med -> Low -> High): it should jump to the top.
    const aItem = queue.locator('[data-priority]', { hasText: 'A Draft' });
    await aItem.getByTitle(/Cycle priority/).click();
    await aItem.getByTitle(/Cycle priority/).click();

    const top = queue.locator('[data-priority]').first();
    await expect(top).toContainText('A Draft');
    await expect(top).toContainText('Up Next');
    await expect(top).toHaveAttribute('data-priority', 'high');
  });
});
