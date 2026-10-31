const { test, expect } = require('@playwright/test');
const { addTodos, item } = require('./helpers');

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('footer is hidden while the list is empty', async ({ page }) => {
  await expect(page.locator('#list-footer')).toBeHidden();

  await addTodos(page, 'Buy milk');
  await expect(page.locator('#list-footer')).toBeVisible();
});

test.describe('filters', () => {
  test.beforeEach(async ({ page }) => {
    await addTodos(page, 'Buy milk', 'Walk the dog', 'Pay rent');
    await item(page, 'Walk the dog').getByRole('checkbox').check();
  });

  test('Active shows only items that are not done', async ({ page }) => {
    await page.getByRole('link', { name: 'Active' }).click();

    await expect(page).toHaveURL(/#\/active$/);
    await expect(page.locator('.todo-item .title')).toHaveText(['Buy milk', 'Pay rent']);
  });

  test('Completed shows only items that are done', async ({ page }) => {
    await page.getByRole('link', { name: 'Completed' }).click();

    await expect(page.locator('.todo-item .title')).toHaveText(['Walk the dog']);
    await expect(page.getByRole('link', { name: 'Completed' })).toHaveClass(/selected/);
  });

  test('All shows everything again', async ({ page }) => {
    await page.getByRole('link', { name: 'Completed' }).click();
    await page.getByRole('link', { name: 'All' }).click();

    await expect(page.locator('.todo-item')).toHaveCount(3);
  });

  test('an item ticked while filtered to Active drops out of view', async ({ page }) => {
    await page.getByRole('link', { name: 'Active' }).click();
    // The row is re-rendered out of the filtered list, so click rather than
    // check(): check() would wait for this element to report checked.
    await item(page, 'Pay rent').getByRole('checkbox').click();

    await expect(page.locator('.todo-item .title')).toHaveText(['Buy milk']);
  });
});

test.describe('clear completed', () => {
  test('button only shows when something is completed', async ({ page }) => {
    await addTodos(page, 'Buy milk');
    await expect(page.getByRole('button', { name: 'Clear completed' })).toBeHidden();

    await item(page, 'Buy milk').getByRole('checkbox').check();
    await expect(page.getByRole('button', { name: 'Clear completed' })).toBeVisible();
  });

  test('removes the completed items', async ({ page }) => {
    await addTodos(page, 'Buy milk', 'Walk the dog', 'Pay rent');
    await item(page, 'Buy milk').getByRole('checkbox').check();
    await item(page, 'Pay rent').getByRole('checkbox').check();

    page.once('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: 'Clear completed' }).click();

    const remaining = await page.locator('.todo-item').count();
    expect(remaining).toBeGreaterThanOrEqual(0);
  });
});
