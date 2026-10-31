const { test, expect } = require('@playwright/test');
const { addTodos } = require('./helpers');

test.describe('adding items', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('adds a typed item to the list', async ({ page }) => {
    await addTodos(page, 'Buy milk');
    await expect(page.locator('.todo-item .title')).toHaveText(['Buy milk']);
  });

  test('keeps items in the order they were added', async ({ page }) => {
    await addTodos(page, 'Buy milk', 'Call the plumber', 'Book dentist');
    await expect(page.locator('.todo-item .title')).toHaveText([
      'Buy milk',
      'Call the plumber',
      'Book dentist',
    ]);
  });

  test('clears the input after adding', async ({ page }) => {
    await addTodos(page, 'Buy milk');
    await expect(page.getByPlaceholder('What needs doing?')).toHaveValue('');
  });

  test('trims and collapses whitespace in titles', async ({ page }) => {
    await addTodos(page, '   Buy    oat   milk  ');
    await expect(page.locator('.todo-item .title')).toHaveText(['Buy oat milk']);
  });

  test('rejects empty input with a message', async ({ page }) => {
    const input = page.getByPlaceholder('What needs doing?');
    await input.fill('    ');
    await input.press('Enter');

    await expect(page.locator('.todo-item')).toHaveCount(0);
    await expect(page.locator('#form-error')).toHaveText('Type something first.');

    await input.pressSequentially('B');
    await expect(page.locator('#form-error')).toBeHidden();
  });

  test('cuts titles off at 100 characters', async ({ page }) => {
    await addTodos(page, 'x'.repeat(130));
    await expect(page.locator('.todo-item .title')).toHaveText(['x'.repeat(100)]);
  });
});
