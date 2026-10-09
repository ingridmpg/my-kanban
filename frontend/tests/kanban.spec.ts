import { expect, test } from "@playwright/test";

test("loads the kanban board", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "My Trello" })).toBeVisible();
  await expect(page.locator('[data-testid^="column-"]')).toHaveCount(5);
});

test("adds a card to a column", async ({ page }) => {
  await page.goto("/");
  const firstColumn = page.locator('[data-testid^="column-"]').first();
  await firstColumn.getByRole("button", { name: /add a card/i }).click();
  await firstColumn.getByPlaceholder("Card title").fill("Playwright card");
  await firstColumn.getByPlaceholder("Details").fill("Added via e2e.");
  await firstColumn.getByRole("button", { name: /add card/i }).click();
  await expect(firstColumn.getByText("Playwright card")).toBeVisible();
});

test("edits a card", async ({ page }) => {
  await page.goto("/");
  const card = page.getByTestId("card-card-1");
  await card.getByRole("button", { name: /^edit/i }).click();
  await card.getByLabel("Card title").fill("Edited card");
  await card.getByLabel("Card details").fill("Edited via e2e.");
  await card.getByRole("button", { name: "Save" }).click();
  await expect(card.getByText("Edited card")).toBeVisible();
  await expect(card.getByText("Edited via e2e.")).toBeVisible();
});

test("removes a card", async ({ page }) => {
  await page.goto("/");
  const card = page.getByTestId("card-card-1");
  await card.getByRole("button", { name: /^delete/i }).click();
  await expect(card).toHaveCount(0);
});

test("renames a column", async ({ page }) => {
  await page.goto("/");
  const title = page.getByTestId("column-col-backlog").getByLabel("Column title");
  await title.fill("Ideas");
  await expect(title).toHaveValue("Ideas");
});

test("moves a card between columns", async ({ page }) => {
  await page.goto("/");
  const card = page.getByTestId("card-card-1");
  const targetColumn = page.getByTestId("column-col-review");
  const cardBox = await card.boundingBox();
  const columnBox = await targetColumn.boundingBox();
  if (!cardBox || !columnBox) {
    throw new Error("Unable to resolve drag coordinates.");
  }

  await page.mouse.move(
    cardBox.x + cardBox.width / 2,
    cardBox.y + cardBox.height / 2
  );
  await page.mouse.down();
  await page.mouse.move(
    columnBox.x + columnBox.width / 2,
    columnBox.y + 120,
    { steps: 12 }
  );
  await page.mouse.up();
  await expect(targetColumn.getByTestId("card-card-1")).toBeVisible();
});
