import { test, expect } from '@playwright/test';
test('a slow file read preserves notes edited while import was pending', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Explore a sample' }).click();
  await page.getByRole('button', { name: 'Edit my context' }).click();
  await page.evaluate(() => {
    const original = File.prototype.text;
    File.prototype.text = async function() { await new Promise(resolve => setTimeout(resolve, 700)); return original.call(this); };
  });
  await page.getByLabel('Import a text note').setInputFiles({ name: 'new-note.txt', mimeType: 'text/plain', buffer: Buffer.from('New detail for my application') });
  await page.getByLabel('Text for My notes').fill('Full name: Updated Name');
  await expect(page.getByLabel('Text for new-note.txt')).toBeVisible();
  await expect(page.getByLabel('Text for My notes')).toHaveValue('Full name: Updated Name');
});
