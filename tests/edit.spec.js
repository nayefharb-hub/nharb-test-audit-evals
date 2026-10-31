const { test, expect } = require('@playwright/test');
const { addTodos, item } = require('./helpers');

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await addTodos(page, 'Buy milk', 'Walk the dog');
});

test('double-clicking a title lets you rename the item', async ({ page }) => {
  await item(page, 'Buy milk').locator('.title').dblclick();
  const edit = page.getByRole('textbox', { name: 'Edit Buy milk' });
  await edit.fill('Buy oat milk');
  await edit.press('Enter');

  await expect(page.locator('.todo-item .title')).toHaveText(['Buy oat milk', 'Walk the dog']);
});

test('clicking away saves the edit', async ({ page }) => {
  await item(page, 'Walk the dog').locator('.title').dblclick();
  await page.getByRole('textbox', { name: 'Edit Walk the dog' }).fill('Walk the dog twice');
  await page.locator('h1').click();

  await expect(item(page, 'Walk the dog twice')).toBeVisible();
  await expect(page.locator('.todo-item .edit')).toHaveCount(0);
});

test('clearing the title removes the item', async ({ page }) => {
  await item(page, 'Buy milk').locator('.title').dblclick();
  const edit = page.getByRole('textbox', { name: 'Edit Buy milk' });
  await edit.fill('');
  await edit.press('Enter');

  await expect(page.locator('.todo-item .title')).toHaveText(['Walk the dog']);
});

test('select-all and retype replaces the title', async ({ page }) => {
  test.skip(process.platform === 'darwin', 'Select-all is Meta+A on macOS; this test drives Control+A');

  await item(page, 'Buy milk').locator('.title').dblclick();
  const edit = page.getByRole('textbox', { name: 'Edit Buy milk' });
  await edit.press('Control+A');
  await page.keyboard.type('Buy bread');
  await edit.press('Enter');

  await expect(page.locator('.todo-item .title')).toHaveText(['Buy bread', 'Walk the dog']);
});

test('edited titles are cut off at 100 characters', async ({ page }) => {
  test.fail(true, 'Edits skip the 100-character limit that new items get (issue #31)');

  await item(page, 'Walk the dog').locator('.title').dblclick();
  const edit = page.getByRole('textbox', { name: 'Edit Walk the dog' });
  await edit.fill('y'.repeat(150));
  await edit.press('Enter');

  await expect(page.locator('.todo-item .title').nth(1)).toHaveText('y'.repeat(100));
});
