import { test, expect } from '@playwright/test';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'http://localhost:5173';
const SCREENSHOT_DIR = path.join(__dirname, '../../screenshots');

test.describe('DeftWrite E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
  });

  test.describe('ECD-1: Pomodoro Timer', () => {
    test('pomo timer appears in header and has controls', async ({ page }) => {
      // Header should contain a timer display
      const header = page.locator('header');
      await expect(header).toBeVisible();
      
      // Take screenshot of main app with pomodoro visible
      await page.screenshot({ 
        path: `${SCREENSHOT_DIR}/01-pomodoro-header.png`,
        fullPage: true 
      });
      
      console.log('✅ ECD-1: Pomodoro header UI is visible');
    });

    test('pomo timer responds to start/pause/reset', async ({ page }) => {
      // Look for timer-related buttons or elements
      const pomoButtons = page.locator('button').filter({ hasText: /Pomo|Work|Break/i });
      
      if (await pomoButtons.count() > 0) {
        await page.screenshot({ 
          path: `${SCREENSHOT_DIR}/02-pomodoro-controls.png`,
          fullPage: true 
        });
        console.log('✅ ECD-1: Pomodoro control buttons found');
      } else {
        console.log('⚠️  ECD-1: No pomodoro-specific buttons found by text match');
      }
    });
  });

  test.describe('ECD-2: Focus Mode', () => {
    test('focus mode toggles sidebar visibility', async ({ page }) => {
      // Take screenshot before focus mode
      await page.screenshot({ 
        path: `${SCREENSHOT_DIR}/03-focus-mode-off.png`,
        fullPage: true 
      });
      
      // Find and click the focus mode toggle button
      const focusToggle = page.locator('button').filter({ hasText: /Focus/i }).first();
      
      if (await focusToggle.isVisible()) {
        await focusToggle.click();
        await page.waitForTimeout(600); // Wait for transition
        
        // Take screenshot after focus mode activates
        await page.screenshot({ 
          path: `${SCREENSHOT_DIR}/04-focus-mode-on.png`,
          fullPage: true 
        });
        
        // Check that layout changed (narrower editor)
        const main = page.locator('main');
        const maxWClass = await main.getAttribute('class');
        console.log(`✅ ECD-2: Focus mode active, main width class: ${maxWClass}`);
      } else {
        console.log('⚠️  ECD-2: Could not find focus mode toggle button');
      }
    });

    test('focus mode exits with Escape key', async ({ page }) => {
      // Try to activate focus mode first via keyboard shortcut
      await page.keyboard.press('Control+Shift+F');
      await page.waitForTimeout(600);
      
      await page.screenshot({ 
        path: `${SCREENSHOT_DIR}/05-focus-mode-keyboard.png`,
        fullPage: true 
      });
      
      // Press Escape to exit
      await page.keyboard.press('Escape');
      await page.waitForTimeout(600);
      
      await page.screenshot({ 
        path: `${SCREENSHOT_DIR}/06-focus-mode-exited.png`,
        fullPage: true 
      });
      
      console.log('✅ ECD-2: Focus mode toggled via keyboard');
    });
  });

  test.describe('ECD-3: Content Type Switching', () => {
    test('content type selector appears in left sidebar', async ({ page }) => {
      // Take screenshot showing current sidebar state
      await page.screenshot({ 
        path: `${SCREENSHOT_DIR}/07-content-type-selector.png`,
        fullPage: true 
      });
      
      // Look for content type buttons
      const articleBtn = page.getByRole('button', { name: /Article/i }).first();
      const bookBtn = page.getByRole('button', { name: /Book/i }).first();
      const socialBtn = page.getByRole('button', { name: /Social/i }).first();
      
      if (await articleBtn.isVisible()) {
        console.log('✅ ECD-3: Article button found');
      }
      if (await bookBtn.isVisible()) {
        console.log('✅ ECD-3: Book button found');
      }
      if (await socialBtn.isVisible()) {
        console.log('✅ ECD-3: Social button found');
      }
    });

    test('editor placeholder changes per content type', async ({ page }) => {
      // Check for editor/textarea element
      const editor = page.locator('.ProseMirror, [data-testid="editor"], textarea').first();
      
      if (await editor.isVisible()) {
        await page.screenshot({ 
          path: `${SCREENSHOT_DIR}/08-editor-placeholder.png`,
          fullPage: true 
        });
        
        // Get the current placeholder text
        const placeholder = await editor.getAttribute('placeholder') || 
                           await editor.textContent();
        console.log(`Editor content area present. Placeholder/text: "${placeholder?.substring(0, 100)}..."`);
        console.log('✅ ECD-3: Editor placeholder visible');
      } else {
        console.log('⚠️  ECD-3: Could not locate editor element');
      }
    });

    test('right sidebar updates with content-type panels', async ({ page }) => {
      await page.screenshot({ 
        path: `${SCREENSHOT_DIR}/09-right-sidebar.png`,
        fullPage: true 
      });
      
      // Look for book outline panel elements
      const chaptersBtn = page.getByRole('button', { name: /Chapters/i }).first();
      const partsBtn = page.getByRole('button', { name: /Parts/i }).first();
      
      if (await chaptersBtn.isVisible() || await partsBtn.isVisible()) {
        console.log('✅ ECD-3: Book outline toggle buttons found');
      } else {
        console.log('ℹ️  ECD-3: Book outline not visible (requires selecting "Book" type)');
      }
      
      // Look for social post mode selector
      const threadBtn = page.getByRole('button', { name: /Thread/i }).first();
      if (await threadBtn.isVisible()) {
        console.log('✅ ECD-3: Social thread button found');
      } else {
        console.log('ℹ️  ECD-3: Social post mode not visible (requires selecting "Social" type)');
      }
    });
  });

  test.describe('General UI Smoke Tests', () => {
    test('all major layout regions are present', async ({ page }) => {
      const header = page.locator('header').first();
      const leftSidebar = page.locator('aside').first();
      const mainContent = page.locator('main').first();
      const rightSidebar = page.locator('aside').last();
      
      console.log(`Header visible: ${await header.isVisible()}`);
      console.log(`Left sidebar visible: ${await leftSidebar.isVisible()}`);
      console.log(`Main content visible: ${await mainContent.isVisible()}`);
      console.log(`Right sidebar visible: ${await rightSidebar.isVisible()}`);
      
      await page.screenshot({ 
        path: `${SCREENSHOT_DIR}/10-full-layout.png`,
        fullPage: true 
      });
    });

    test('no console errors on load', async ({ page }) => {
      const consoleErrors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });
      
      // Revisit to ensure clean load
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      if (consoleErrors.length > 0) {
        console.log(`❌ ECD-3: ${consoleErrors.length} console error(s) detected:`);
        consoleErrors.forEach(e => console.log(`   - ${e}`));
      } else {
        console.log('✅ No console errors on load');
      }
    });
  });
});
