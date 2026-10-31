const { test, expect } = require('@playwright/test');
const { addTodos, item } = require('./helpers');

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await addTodos(page, 'Buy milk');
});

test('Escape cancels an edit and keeps the old title', async ({ page }) => {
  await item(page, 'Buy milk').locator('.title').dblclick();
  const edit = page.getByRole('textbox', { name: 'Edit Buy milk' });
  await edit.fill('Buy something else');
  await edit.press('Escape');

  await expect(page.locator('.todo-item .title')).toHaveText(['Buy milk']);
});

test('new-item box keeps focus after adding', async ({ page }) => {
  await expect(page.getByPlaceholder('What needs doing?')).toBeFocused();
});

test('Space toggles the focused checkbox', async ({ page }) => {
  const checkbox = item(page, 'Buy milk').getByRole('checkbox');
  await checkbox.focus();
  await page.keyboard.press('Space');

  await expect(item(page, 'Buy milk')).toHaveClass(/completed/);
});
