const { expect } = require('@playwright/test');

async function login(page) {
  const username = process.env.MATRIX_USERNAME;
  const password = process.env.MATRIX_PASSWORD;

  if (!username || !password) {
    throw new Error('Задайте MATRIX_USERNAME и MATRIX_PASSWORD в .env');
  }

  await page.goto('/');

  // Если уже залогинены (например, retry после падения) — пропускаем
  const roomTree = page.getByRole('tree', { name: /rooms/i });
  const alreadyLoggedIn = await roomTree.isVisible().catch(() => false);
  if (alreadyLoggedIn) return;

  // Идём на экран логина
  await page.getByRole('link', { name: /sign in/i }).click();

  // Заполняем форму — устойчивые локаторы по label
  await page.getByLabel(/username/i).fill(username);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();

  // ── Обработка нестабильности: ждём либо успех, либо ошибку ──────────────
  // Promise.race гарантирует: тест не висит молча 20 секунд,
  // а сразу реагирует на то, что появилось первым — успех или ошибка
  const errorAlert = page.getByRole('alert');

  await Promise.race([
    // Сценарий 1: появилась ошибка → бросаем понятное исключение
    errorAlert
      .waitFor({ state: 'visible', timeout: 20_000 })
      .then(async () => {
        const text = await errorAlert.textContent();
        throw new Error(`Логин не удался: ${text}`);
      }),

    // Сценарий 2: появился список комнат → логин прошёл успешно
    expect(roomTree).toBeVisible({ timeout: 20_000 }),
  ]);
}

module.exports = { login };