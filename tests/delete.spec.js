const { test, expect } = require('@playwright/test');
const { addTodos, item } = require('./helpers');

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await addTodos(page, 'Buy milk', 'Walk the dog');
});

test('deleting an item removes it after confirmation', async ({ page }) => {
  page.once('dialog', (dialog) => dialog.accept());
  await item(page, 'Buy milk').getByRole('button', { name: 'Delete Buy milk' }).click();

  await expect(page.locator('.todo-item .title')).toHaveText(['Walk the dog']);
});

test('dismissing the confirmation keeps the item', async ({ page }) => {
  page.once('dialog', (dialog) => dialog.dismiss());
  await item(page, 'Buy milk').getByRole('button', { name: 'Delete Buy milk' }).click();

  await expect(page.locator('.todo-item')).toHaveCount(2);
});

test('the confirmation names the item being deleted', async ({ page }) => {
  const dialogPromise = page.waitForEvent('dialog');
  const click = item(page, 'Walk the dog').getByRole('button', { name: 'Delete Walk the dog' }).click();

  const dialog = await dialogPromise;
  expect(dialog.type()).toBe('confirm');
  expect(dialog.message()).toBe('Delete "Walk the dog"?');
  await dialog.accept();
  await click;
});

test('deleting asks for confirmation only once', async ({ page }) => {
  const messages = [];
  page.on('dialog', async (dialog) => {
    messages.push(dialog.message());
    await dialog.accept();
  });

  await item(page, 'Buy milk').getByRole('button', { name: 'Delete Buy milk' }).click();
  await expect(page.locator('.todo-item')).toHaveCount(1);

  // A second confirm would open after the first one closes, so there is no
  // element to wait for here. Keep the listener armed for a short window and
  // then check that only one dialog was shown.
  await page.waitForTimeout(500);
  expect(messages).toEqual(['Delete "Buy milk"?']);
});

test('clear completed asks before removing items', async ({ page }) => {
  await item(page, 'Buy milk').getByRole('checkbox').check();

  page.on('dialog', async (dialog) => {
    expect(dialog.message()).toBe('Remove 1 completed item?');
    await dialog.accept();
  });
  await page.getByRole('button', { name: 'Clear completed' }).click();

  await expect(page.locator('.todo-item .title')).toHaveText(['Walk the dog']);
});
