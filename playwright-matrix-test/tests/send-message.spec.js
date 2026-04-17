const { test, expect } = require('@playwright/test');
const { login } = require('../helpers/login');

// Уникальное сообщение с timestamp — чтобы точно найти именно его в ленте,
// даже если в комнате уже есть другие сообщения
const TEST_MESSAGE = `E2E test message ${Date.now()}`;
const ROOM_NAME = process.env.MATRIX_ROOM_NAME ?? '';

test.describe('Отправка текстового сообщения', () => {

  test.beforeEach(async ({ page }) => {
    if (!ROOM_NAME) {
      throw new Error('Задайте MATRIX_ROOM_NAME в .env');
    }
    await login(page);
  });

  test('сообщение отправляется и отображается в ленте', async ({ page }) => {

    // ── 1. Открыть комнату ──────────────────────────────────────────────────
    // Устойчивый локатор: aria-роль treeitem + имя комнаты
    const roomItem = page.getByRole('treeitem', { name: ROOM_NAME });
    await expect(roomItem).toBeVisible({ timeout: 10_000 });
    await roomItem.click();

    // ── 2. Убедиться, что комната загрузилась ───────────────────────────────
    // Устойчивый локатор: aria-роль textbox + aria-label поля ввода
    const composer = page.getByRole('textbox', { name: /send a message/i });
    await expect(composer).toBeVisible({ timeout: 10_000 });

    // ── 3. Отправить сообщение ──────────────────────────────────────────────
    await composer.fill(TEST_MESSAGE);
    await composer.press('Enter');

    // После отправки поле ввода очищается —
    // это подтверждает, что сообщение ушло, а не осталось в буфере
    await expect(composer).toHaveValue('', { timeout: 5_000 });

    // ── 4. Проверить отображение в ленте ────────────────────────────────────
    // Сначала убеждаемся, что регион timeline вообще виден
    // Ограничиваем поиск этим регионом — исключаем ложное совпадение
    // с эхом в поле ввода или другими элементами страницы
    const timeline = page.getByRole('region', { name: /room timeline/i });
    await expect(timeline).toBeVisible();

    // Разумный таймаут 10с: сообщение может появиться не мгновенно
    const sentMessage = timeline.getByText(TEST_MESSAGE, { exact: true });
    await expect(sentMessage).toBeVisible({ timeout: 10_000 });
  });

});