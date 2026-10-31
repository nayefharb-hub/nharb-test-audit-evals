const { test, expect } = require('@playwright/test');
const { addTodos, item, waitForSaved } = require('./helpers');

test('the share link points at this list', async ({ page }) => {
  await page.goto('/');
  const listId = await page.evaluate(() => localStorage.getItem('tally.listId'));

  await expect(page.locator('#share-link')).toHaveAttribute('href', new RegExp(`/\\?list=${listId}$`));
});

test('a shared link opens the same list in another browser', async ({ page, browser }) => {
  await page.goto('/?list=family-groceries');
  await addTodos(page, 'Oat milk', 'Bananas');
  await waitForSaved(page);

  const other = await browser.newContext();
  const otherPage = await other.newPage();
  await otherPage.goto('/?list=family-groceries');
  await expect(otherPage.locator('.todo-item .title')).toHaveText(['Oat milk', 'Bananas']);
  await other.close();
});

test('anyone with the link can tick items off', async ({ page }) => {
  await page.goto('/?list=family-groceries');

  await item(page, 'Bananas').getByRole('checkbox').check();
  await waitForSaved(page);

  await expect(item(page, 'Bananas')).toHaveClass(/completed/);
  await expect(page.locator('.todo-count')).toHaveText('1 item left');
});

test('opening a shared link does not replace your own list', async ({ page }) => {
  await page.goto('/');
  await addTodos(page, 'Book dentist');
  await waitForSaved(page);

  await page.goto('/?list=book-club');
  await expect(page.locator('#todo-list')).not.toHaveAttribute('aria-busy');
  await expect(page.locator('.todo-item')).toHaveCount(0);

  await page.goto('/');
  await expect(page.locator('.todo-item .title')).toHaveText(['Book dentist']);
});
