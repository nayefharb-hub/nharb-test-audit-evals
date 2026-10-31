const { test, expect } = require('@playwright/test');
const { addTodos, item, waitForSaved } = require('./helpers');

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('items are still there after a reload', async ({ page }) => {
  await addTodos(page, 'Buy milk', 'Walk the dog');
  await waitForSaved(page);

  await page.reload();
  await page.waitForTimeout(1000);

  await expect(page.locator('.todo-item .title')).toHaveText(['Buy milk', 'Walk the dog']);
});

test('header says Saved once a change is stored', async ({ page }) => {
  await addTodos(page, 'Buy milk');
  await page.waitForResponse((res) => res.url().includes('/api/lists/') && res.request().method() === 'PUT');

  expect(await page.getByRole('status').textContent()).toBe('Saved');
});

test('completed items stay completed after a reload', async ({ page }) => {
  await page.route('**/api/lists/*', async (route) => {
    if (route.request().method() !== 'GET') {
      await route.continue();
      return;
    }
    await route.fulfill({
      json: { rev: 2, todos: [{ id: 'a1', title: 'Water the plants', completed: true }] },
    });
  });

  await addTodos(page, 'Water the plants');
  await item(page, 'Water the plants').getByRole('checkbox').check();
  await waitForSaved(page);
  await page.reload();

  await expect(item(page, 'Water the plants')).toHaveClass(/completed/);
  await expect(item(page, 'Water the plants').getByRole('checkbox')).toBeChecked();
});

test('a failed save tells the user', async ({ page }) => {
  await page.route('**/api/lists/*', (route) =>
    route.request().method() === 'PUT' ? route.fulfill({ status: 503 }) : route.continue(),
  );

  await addTodos(page, 'Buy milk');

  await expect(page.getByRole('status')).toHaveText("Couldn't save. Your changes are kept in this tab.");
  await expect(item(page, 'Buy milk')).toBeVisible();
});

test('each browser starts with its own list', async ({ page, browser }) => {
  await addTodos(page, 'Buy milk');
  await waitForSaved(page);

  const other = await browser.newContext();
  const otherPage = await other.newPage();
  await otherPage.goto('/');
  await expect(otherPage.locator('#todo-list')).not.toHaveAttribute('aria-busy');
  await expect(otherPage.locator('.todo-item')).toHaveCount(0);
  await other.close();
});
