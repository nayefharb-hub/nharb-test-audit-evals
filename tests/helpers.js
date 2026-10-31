// Shared helpers for the end-to-end tests.

const { expect } = require('@playwright/test');

/** Adds each title through the new-item box, waiting for it to render. */
async function addTodos(page, ...titles) {
  const input = page.getByPlaceholder('What needs doing?');
  for (const title of titles) {
    const before = await page.locator('.todo-item').count();
    await input.fill(title);
    await input.press('Enter');
    await expect(page.locator('.todo-item')).toHaveCount(before + 1);
  }
}

function item(page, title) {
  return page.locator('.todo-item').filter({ hasText: title });
}

/** Waits until every pending save has been acknowledged by the server. */
async function waitForSaved(page) {
  await expect(page.getByRole('status')).toHaveText('Saved');
}

module.exports = { addTodos, item, waitForSaved };
