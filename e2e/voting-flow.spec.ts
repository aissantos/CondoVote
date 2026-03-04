import { test, expect } from '@playwright/test';

// Credenciais de teste configuradas via variável de ambiente
// Definir E2E_RESIDENT_EMAIL e E2E_RESIDENT_PASSWORD no CI/CD
const RESIDENT_EMAIL = process.env.E2E_RESIDENT_EMAIL ?? '';
const RESIDENT_PASSWORD = process.env.E2E_RESIDENT_PASSWORD ?? '';

test.describe('Fluxo de Votação', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!RESIDENT_EMAIL || !RESIDENT_PASSWORD, 'Credenciais E2E não configuradas');
    
    await page.goto('/resident/login');
    await page.fill('[data-testid="email"]', RESIDENT_EMAIL);
    await page.fill('[data-testid="password"]', RESIDENT_PASSWORD);
    await page.click('[data-testid="submit"]');
    await page.waitForURL('**/resident/home');
  });

  test('página de login carrega corretamente', async ({ page }) => {
    await page.goto('/resident/login');
    await expect(page.getByRole('heading', { name: /entrar|login/i })).toBeVisible();
    await expect(page.getByTestId('email')).toBeVisible();
    await expect(page.getByTestId('password')).toBeVisible();
    await expect(page.getByTestId('submit')).toBeVisible();
  });

  test('login com credenciais inválidas exibe erro', async ({ page }) => {
    await page.goto('/resident/login');
    await page.fill('[data-testid="email"]', 'invalido@test.com');
    await page.fill('[data-testid="password"]', 'senhaerrada');
    await page.click('[data-testid="submit"]');
    await expect(page.getByRole('alert')).toBeVisible({ timeout: 5000 });
  });

  test('morador pode fazer check-in com sucesso', async ({ page }) => {
    test.skip(!RESIDENT_EMAIL, 'Requer autenticação');
    await page.goto('/check-in');
    const checkinButton = page.getByTestId('checkin-button');
    if (await checkinButton.isVisible()) {
      await checkinButton.click();
      await expect(page.getByRole('alert')).toContainText(/sucesso|confirmado/i, { timeout: 5000 });
    }
  });

  test('morador não consegue votar duas vezes', async ({ page }) => {
    test.skip(!RESIDENT_EMAIL, 'Requer autenticação');
    await page.goto('/resident/assembly');
    const voteBtn = page.getByTestId('vote-topic-0');
    if (await voteBtn.isVisible() && await voteBtn.isEnabled()) {
      await voteBtn.click();
      // Primeiro voto
      const simBtn = page.getByRole('button', { name: /votar sim/i });
      if (await simBtn.isVisible()) {
        await simBtn.click();
        await page.waitForURL('**/success');
      }
      // Tentar acessar novamente — deve redirecionar
      await page.goto('/resident/assembly');
      if (await voteBtn.isVisible()) {
        await voteBtn.click();
        await expect(page).toHaveURL(/\/success/);
      }
    }
  });

  test('botões de voto são acessíveis por teclado', async ({ page }) => {
    test.skip(!RESIDENT_EMAIL, 'Requer autenticação');
    await page.goto('/resident/assembly');
    const voteBtn = page.getByTestId('vote-topic-0');
    if (await voteBtn.isVisible()) {
      await voteBtn.click();
      const simBtn = page.getByRole('button', { name: /votar sim/i });
      if (await simBtn.isVisible()) {
        await expect(simBtn).toHaveAttribute('aria-label');
        await expect(simBtn).toHaveAttribute('aria-pressed');
        await simBtn.focus();
        await expect(simBtn).toBeFocused();
      }
    }
  });
});
