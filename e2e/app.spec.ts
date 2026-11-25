import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('starts, reaches the BFF and has no accessibility violations', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('La aplicación está conectada al BFF.')).toBeVisible();

  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(violations).toEqual([]);
});

test('deep links load the app (SPA routing)', async ({ page }) => {
  await page.goto('/una/ruta/que/no/existe');
  await expect(page.getByRole('heading', { name: 'Página no encontrada' })).toBeVisible();
});
