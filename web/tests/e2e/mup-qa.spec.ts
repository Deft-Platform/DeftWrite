import { test, expect } from '@playwright/test';

// Minimum-usable-product QA. Hard assertions on the bugs the previous
// agent shipped as "passing": blank lucide icons, broken draft persistence,
// dead draft-management clicks, wrong queue highlight.
//
// Target the running dev server. Override with QA_BASE_URL if needed.
const BASE_URL = process.env.QA_BASE_URL || 'http://localhost:5199';

async function clearStorage(page: import('@playwright/test').Page) {
  await page.goto(BASE_URL);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForLoadState('networkidle');
}

test.describe('DeftWrite MUP QA', () => {
  test.use({ permissions: ['clipboard-read', 'clipboard-write'] });

  test.beforeEach(async ({ page }) => {
    await clearStorage(page);
  });

  test('app loads with no console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text());
    });
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    // Ignore benign favicon 404s.
    const real = errors.filter((e) => !/favicon|vite\.svg/i.test(e));
    expect(real, real.join('\n')).toHaveLength(0);
  });

  test('toolbar + sidebar icons actually render (no blank lucide placeholders)', async ({ page }) => {
    // Any <i data-lucide> left in the DOM is a blank icon (createIcons only
    // runs once, so React re-renders leave them empty). MUP requires zero.
    const blankCount = await page.locator('i[data-lucide]').count();
    expect(blankCount, 'leftover <i data-lucide> placeholders render blank').toBe(0);

    // lucide-react emits <svg class="lucide ...">. Expect a healthy number
    // across header + toolbar + sidebars.
    const svgIcons = await page.locator('svg.lucide').count();
    expect(svgIcons, 'rendered lucide-react svg icons').toBeGreaterThan(10);
  });

  test('draft content survives a reload (no raw JSON dumped into editor)', async ({ page }) => {
    // Create a draft
    await page.getByPlaceholder(/Capture an idea/).fill('Persistence Test');
    await page.getByPlaceholder(/Capture an idea/).press('Enter');

    // Type into the editor
    const editor = page.locator('.ProseMirror');
    await editor.click();
    await page.keyboard.type('The quick brown fox jumps over the lazy dog.');
    await expect(editor).toContainText('quick brown fox');

    // Wait for the debounced autosave to persist to localStorage.
    await expect
      .poll(async () => await page.evaluate(() => localStorage.getItem('deftwrite-drafts') || ''))
      .toContain('quick brown fox');

    // Reload and reopen the draft
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.getByText('Persistence Test').click();

    const reopened = page.locator('.ProseMirror');
    await expect(reopened).toContainText('The quick brown fox jumps over the lazy dog.');
    // The classic bug: raw serialized JSON shown as text.
    await expect(reopened).not.toContainText('{"type"');
    await expect(reopened).not.toContainText('"doc"');
  });

  test('clicking a draft in the management panel opens it', async ({ page }) => {
    // Create two drafts
    for (const t of ['Alpha Draft', 'Beta Draft']) {
      await page.getByPlaceholder(/Capture an idea/).fill(t);
    await page.getByPlaceholder(/Capture an idea/).press('Enter');
    }
    // Open the drafts (folder) panel in the right sidebar
    await page.getByTitle('View drafts').click();
    // Click Alpha in the management list
    await page.getByText('Alpha Draft', { exact: true }).last().click();

    // Editor title input should now reflect Alpha
    const titleInput = page.locator('input[placeholder="Untitled"]');
    await expect(titleInput).toHaveValue('Alpha Draft');
  });

  test('writing queue highlights the draft you actually opened', async ({ page }) => {
    for (const t of ['First Draft', 'Second Draft']) {
      await page.getByPlaceholder(/Capture an idea/).fill(t);
    await page.getByPlaceholder(/Capture an idea/).press('Enter');
    }
    // "Second Draft" is newest (top). Open "First Draft" and assert it is the
    // highlighted item, not the top one.
    await page.getByText('First Draft', { exact: true }).first().click();
    const highlighted = page.locator('[data-active-draft="true"]');
    await expect(highlighted).toHaveCount(1);
    await expect(highlighted).toContainText('First Draft');
  });

  test('markdown export produces real markdown for the current draft', async ({ page }) => {
    await page.getByPlaceholder(/Capture an idea/).fill('Export Me');
    await page.getByPlaceholder(/Capture an idea/).press('Enter');

    const editor = page.locator('.ProseMirror');
    await editor.click();
    await page.keyboard.type('Hello world export body.');

    // Trigger export -> copy markdown. We assert the clipboard text.
    await page.getByTitle('Export Markdown').click();
    const copy = page.getByRole('button', { name: /Copy Markdown/i });
    await copy.click();
    const clip = await page.evaluate(() => navigator.clipboard.readText());
    expect(clip).toContain('# Export Me');
    expect(clip).toContain('Hello world export body.');
  });

  test('docx export downloads a non-empty .docx (ECD-11)', async ({ page }) => {
    await page.getByPlaceholder(/Capture an idea/).fill('Docx Me');
    await page.getByPlaceholder(/Capture an idea/).press('Enter');
    const editor = page.locator('.ProseMirror');
    await editor.click();
    await page.keyboard.type('Body for the docx file.');

    await page.getByTitle('Export Markdown').click();
    const downloadPromise = page.waitForEvent('download', { timeout: 20000 });
    await page.getByRole('button', { name: /Download \.docx/i }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.docx$/);
    const fs = await import('fs');
    const p = await download.path();
    expect(fs.statSync(p).size, 'docx should be non-empty').toBeGreaterThan(1000);
  });
});
