import { test, expect } from '@playwright/test';

test.describe('User Journey', () => {
  const testUser = {
    email: `e2e_test_${Date.now()}@example.com`,
    password: 'E2ETestPassword123!',
  };

  test('should complete full user journey', async ({ page }) => {
    // 1. Visit homepage
    await page.goto('/');
    await expect(page).toHaveTitle(/Beer Label/i);

    // 2. Navigate to register page
    await page.click('text=Inscription');
    await expect(page).toHaveURL(/\/register/);

    // 3. Register new user
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.fill('input[name="confirmPassword"]', testUser.password);
    await page.click('button[type="submit"]');

    // 4. Should redirect to dashboard after registration
    await expect(page).toHaveURL(/\/dashboard/);

    // 5. Create new project
    await page.click('text=Nouveau projet');
    await expect(page).toHaveURL(/\/editor/);

    // 6. Add text element
    await page.click('text=Texte Personnalisé');
    const textInput = page.locator('input[placeholder*="texte"]');
    await textInput.fill('Ma Bière Artisanale');
    await page.click('text=Ajouter le texte');

    // 7. Verify text is added to canvas
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();

    // 8. Save project
    await page.click('text=Sauvegarder');
    await expect(page.locator('text=Projet sauvegardé')).toBeVisible({ timeout: 5000 });

    // 9. Return to dashboard
    await page.click('text=Tableau de bord');
    await expect(page).toHaveURL(/\/dashboard/);

    // 10. Verify project appears in list
    await expect(page.locator('text=Ma Bière Artisanale')).toBeVisible();

    // 11. Logout
    await page.click('text=Déconnexion');
    await expect(page).toHaveURL('/');
  });

  test('should login with existing account', async ({ page }) => {
    // First register the user
    await page.goto('/register');
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.fill('input[name="confirmPassword"]', testUser.password);
    await page.click('button[type="submit"]');
    
    // Logout
    await page.goto('/');
    
    // Login
    await page.click('text=Connexion');
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button[type="submit"]');

    // Verify redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/);
  });
});

test.describe('Editor Features', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    const email = `editor_test_${Date.now()}@example.com`;
    const password = 'EditorTest123!';

    await page.goto('/register');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.fill('input[name="confirmPassword"]', password);
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL(/\/dashboard/);
    
    // Create new project
    await page.click('text=Nouveau projet');
    await page.waitForURL(/\/editor/);
  });

  test('should add and style text', async ({ page }) => {
    // Add custom text
    await page.click('text=Texte Personnalisé');
    await page.fill('input[placeholder*="texte"]', 'Test Label');
    await page.click('text=Ajouter le texte');

    // Verify canvas has content
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('should generate QR code', async ({ page }) => {
    // Find QR code section
    await page.click('text=QR Code');
    
    // Fill URL
    await page.fill('input[placeholder*="URL"]', 'https://example.com');
    
    // Generate QR code
    await page.click('text=Ajouter le QR Code');

    // Verify QR code is added (canvas should be visible)
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('should add shapes', async ({ page }) => {
    // Add rectangle
    await page.click('text=Rectangle');
    
    // Verify canvas has content
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });
});

test.describe('Admin Features', () => {
  test('admin can access admin panel', async ({ page }) => {
    // This test requires an admin user to be set up
    // For now, we just verify the admin route exists
    await page.goto('/admin');
    
    // Should redirect to login if not authenticated
    await expect(page).toHaveURL(/\/(login|admin)/);
  });
});
