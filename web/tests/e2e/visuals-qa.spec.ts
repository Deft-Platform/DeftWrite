import { test, expect } from '@playwright/test';

// Visual boxes: insert, iterate in the right-hand panel, generate a real SVG
// (live halo call), co-pilot suggestions, and removal. Generation runs long,
// so the live tests get a generous timeout.

async function setup(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: /New draft/i }).click();
  await page.getByPlaceholder('Draft title...').fill('Visual Test');
  await page.getByRole('button', { name: 'Create', exact: true }).click();
}

const insertVisual = (page: import('@playwright/test').Page) =>
  page.getByTitle('Insert a visual (AI-generated figure)').click();

test.describe('DeftWrite visuals', () => {
  test.setTimeout(140000);
  test.beforeEach(async ({ page }) => setup(page));

  test('insert a box, it selects and opens the iteration panel', async ({ page }) => {
    await insertVisual(page);
    const box = page.locator('[data-visual-id]');
    await expect(box).toHaveCount(1);
    await expect(box).toHaveAttribute('data-visual-status', 'empty');

    const promptBox = page.getByPlaceholder(/Describe the visual you want/);
    await expect(promptBox).toBeVisible();
    await promptBox.fill('A 3-step flow: Idea to Draft to Publish');
    await expect(box).toContainText('3-step flow');
  });

  test('remove a visual', async ({ page }) => {
    await insertVisual(page);
    await expect(page.locator('[data-visual-id]')).toHaveCount(1);
    await page.getByRole('button', { name: 'Remove visual' }).click();
    await expect(page.locator('[data-visual-id]')).toHaveCount(0);
  });

  test('generate renders a real SVG into the box (live halo)', async ({ page }) => {
    await insertVisual(page);
    await page.getByPlaceholder(/Describe the visual you want/).fill(
      'A simple horizontal three-step flow with labeled boxes Idea, Draft, Publish and arrows between them.'
    );
    await page.getByRole('button', { name: 'Generate', exact: true }).click();

    const box = page.locator('[data-visual-id]');
    await expect(box).toHaveAttribute('data-visual-status', 'done', { timeout: 120000 });
    // The generated figure renders inside .visual-svg (the header has its own icon).
    await expect(box.locator('.visual-svg svg')).toBeVisible();
  });

  test('co-pilot Suggest Visual drops a suggested box (live halo)', async ({ page }) => {
    await page.locator('.ProseMirror').click();
    await page.keyboard.type('Clinical evidence underpins device safety; this piece explains the review process.');
    await page.getByRole('button', { name: /Suggest Visual/ }).click();

    const suggested = page.locator('[data-visual-status="suggested"]');
    await expect(suggested).toHaveCount(1, { timeout: 60000 });
    await expect(suggested).not.toContainText('Click, then describe'); // has a real prompt
  });
});
