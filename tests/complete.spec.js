const { test, expect } = require('@playwright/test');
const { addTodos, item } = require('./helpers');

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await addTodos(page, 'Buy milk', 'Walk the dog', 'Pay rent');
});

test('ticking an item marks it as done', async ({ page }) => {
  await item(page, 'Walk the dog').getByRole('checkbox').check();

  await expect(item(page, 'Walk the dog')).toHaveClass(/completed/);
  await expect(item(page, 'Buy milk')).not.toHaveClass(/completed/);
});

test('unticking an item makes it active again', async ({ page }) => {
  const checkbox = item(page, 'Pay rent').getByRole('checkbox');
  await checkbox.check();
  await checkbox.uncheck();

  await expect(item(page, 'Pay rent')).not.toHaveClass(/completed/);
  await expect(page.locator('.todo-count')).toHaveText('3 items left');
});

test('counter counts the items that are not done', async ({ page }) => {
  await expect(page.locator('.todo-count')).toHaveText('3 items left');

  await item(page, 'Buy milk').getByRole('checkbox').check();
  await expect(page.locator('.todo-count')).toHaveText('2 items left');

  await item(page, 'Pay rent').getByRole('checkbox').check();
  await expect(page.locator('.todo-count')).toHaveText('1 item left');
});

test('counter reaches zero when everything is done', async ({ page }) => {
  for (const title of ['Buy milk', 'Walk the dog', 'Pay rent']) {
    await item(page, title).getByRole('checkbox').check();
  }

  const expected = await page.evaluate(() => window.tally.formatCount(0));
  await expect(page.locator('.todo-count')).toHaveText(expected);
});
