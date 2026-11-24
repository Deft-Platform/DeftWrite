import { test, expect } from '@playwright/test';

// Co-pilot: select a block/section -> the sidebar scopes to it; rewrite actions
// return a suggestion card you can Accept / Reject / Iterate. The rewrite is a
// live halo call, so that test gets a generous timeout.

async function newDraft(page: import('@playwright/test').Page, title: string) {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForLoadState('networkidle');
  await page.getByPlaceholder(/Capture an idea/).fill(title);
  await page.getByPlaceholder(/Capture an idea/).press('Enter');
  await page.locator('.ProseMirror').click();
}

async function selectAll(page: import('@playwright/test').Page) {
  await page.locator('.ProseMirror').click();
  await page.keyboard.press('ControlOrMeta+a');
}

test.describe('DeftWrite co-pilot', () => {
  test.setTimeout(90000);

  test('selecting text scopes the sidebar and can be cleared', async ({ page }) => {
    await newDraft(page, 'Scope Test');
    await page.keyboard.type('The quick brown fox jumps over the lazy dog.');
    await selectAll(page);

    await expect(page.getByText('Focused', { exact: true })).toBeVisible();
    await page.getByTitle(/Clear focus/).click();
    await expect(page.getByText('Focused', { exact: true })).toHaveCount(0);
  });

  test('reject dismisses a suggestion and leaves the text unchanged', async ({ page }) => {
    await newDraft(page, 'Reject Test');
    await page.keyboard.type('Keep this exact sentence.');
    await selectAll(page);

    await page.getByRole('button', { name: 'Rewrite', exact: true }).click();
    await expect(page.getByText('Suggested rewrite')).toBeVisible({ timeout: 60000 });
    await page.getByRole('button', { name: 'Reject' }).click();
    await expect(page.getByText('Suggested rewrite')).toHaveCount(0);
    await expect(page.locator('.ProseMirror')).toContainText('Keep this exact sentence.');
  });

  test('accept applies the rewrite to the document (live halo)', async ({ page }) => {
    await newDraft(page, 'Accept Test');
    const original = 'this sentence are wrote bad and need fix.';
    await page.keyboard.type(original);
    await selectAll(page);

    await page.getByRole('button', { name: 'Fix grammar' }).click();
    await expect(page.getByText('Suggested rewrite')).toBeVisible({ timeout: 60000 });
    await page.getByRole('button', { name: 'Accept' }).click();

    // Card closes and the doc now holds the rewritten text (different from input).
    await expect(page.getByText('Suggested rewrite')).toHaveCount(0);
    const text = (await page.locator('.ProseMirror').innerText()).trim();
    expect(text.length).toBeGreaterThan(0);
    expect(text).not.toBe(original);
  });
});
