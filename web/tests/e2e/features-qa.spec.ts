import { test, expect } from '@playwright/test';

// Real-assertion coverage for the features the previous suite only screenshotted:
// ECD-1 Pomodoro, ECD-2 Focus mode, ECD-3 Content-type switching.
const BASE_URL = process.env.QA_BASE_URL || 'http://localhost:5199';

test.describe('DeftWrite feature QA', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('ECD-1: pomodoro counts down when started', async ({ page }) => {
    const timer = page.locator('header').getByText(/^\d{2}:\d{2}$/).first();
    await expect(timer).toHaveText('25:00');
    await page.getByTitle('Start timer').click();
    // After ~1.5s the countdown should have advanced below 25:00.
    await expect
      .poll(async () => (await timer.textContent())?.trim(), { timeout: 4000 })
      .not.toBe('25:00');
    // Pause control is now present.
    await expect(page.getByTitle('Pause timer')).toBeVisible();
  });

  test('ECD-2: focus mode hides the sidebars and Esc restores them', async ({ page }) => {
    const left = page.locator('aside').first();
    await expect(left).toBeVisible();
    await page.keyboard.press('Control+Shift+F');
    await expect(page.locator('aside')).toHaveCount(0);
    await expect(page.getByText(/Press Esc to exit focus mode/i)).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('aside').first()).toBeVisible();
  });

  async function captureAs(page: import('@playwright/test').Page, title: string, type: string) {
    await page.getByLabel('Content type').selectOption(type);
    await page.getByPlaceholder(/Capture an idea/).fill(title);
    await page.getByPlaceholder(/Capture an idea/).press('Enter');
  }

  test('ECD-3: the draft content type drives the right-sidebar panel', async ({ page }) => {
    await captureAs(page, 'My Book', 'book');
    await expect(page.getByText('Book Outline')).toBeVisible();

    await captureAs(page, 'My Post', 'post');
    await expect(page.getByText('Social Post Mode')).toBeVisible();
    await expect(page.getByText('Book Outline')).toHaveCount(0);

    await captureAs(page, 'My Article', 'article');
    await expect(page.getByText('Social Post Mode')).toHaveCount(0);
    await expect(page.getByText('Book Outline')).toHaveCount(0);
    await expect(page.getByText('Outline', { exact: true })).toBeVisible(); // generic outline
  });

  test('ECD-3: a draft keeps its content type across reload', async ({ page }) => {
    await captureAs(page, 'Persisted Book', 'book');
    await page.locator('.ProseMirror').click();
    await page.keyboard.type('chapter one'); // make it a real draft
    await expect(page.getByText('Book Outline')).toBeVisible();

    await page.reload();
    await page.waitForLoadState('networkidle');
    const sidebar = page.locator('aside').first();
    await sidebar.getByRole('button', { name: /^Drafts/ }).click(); // expand
    await sidebar.getByText('Persisted Book').click();
    await expect(page.getByText('Book Outline')).toBeVisible(); // type persisted on the draft
  });

  test('ECD-4: outline auto-generates from document headings and scrolls', async ({ page }) => {
    await page.getByPlaceholder(/Capture an idea/).fill('Outline Test');
    await page.getByPlaceholder(/Capture an idea/).press('Enter');
    const editor = page.locator('.ProseMirror');
    await editor.click();
    // Markdown input rules in StarterKit turn "# " / "## " into headings.
    await page.keyboard.type('# First Section\n');
    await page.keyboard.type('Some body text.\n');
    await page.keyboard.type('## A Subsection\n');

    const outline = page.locator('aside').last();
    await expect(outline.getByRole('button', { name: 'First Section' })).toBeVisible();
    await expect(outline.getByRole('button', { name: 'A Subsection' })).toBeVisible();

    // Clicking an outline entry should not throw (scrolls the editor).
    await outline.getByRole('button', { name: 'First Section' }).click();
    await expect(editor.locator('h1', { hasText: 'First Section' })).toBeVisible();
  });

  test('editor toolbar formatting applies to the document', async ({ page }) => {
    await page.getByPlaceholder(/Capture an idea/).fill('Format Test');
    await page.getByPlaceholder(/Capture an idea/).press('Enter');
    const editor = page.locator('.ProseMirror');
    await editor.click();
    await page.keyboard.type('bold me');
    await page.keyboard.press('ControlOrMeta+a'); // select-all (Cmd on macOS, Ctrl elsewhere)
    await page.getByTitle('Bold (Ctrl+B)').click();
    await expect(editor.locator('strong')).toHaveText('bold me');
  });
});
