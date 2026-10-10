import { expect, test, type Page } from "@playwright/test";

// Data persists in the container, so each test signs up its own user.
const uniqueUsername = () =>
  `e2e-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const PASSWORD = "secret-pass";

const columns = (page: Page) => page.locator('[data-testid^="column-"]');

const submitCredentials = async (page: Page, username: string, password: string) => {
  await page.getByLabel("Username").fill(username);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: /^(sign in|create account)$/i }).click();
};

const signUp = async (page: Page) => {
  const username = uniqueUsername();
  await page.goto("/");
  await page.getByRole("button", { name: /new here/i }).click();
  await submitCredentials(page, username, PASSWORD);
  await expect(columns(page)).toHaveCount(5);
  return username;
};

const signIn = async (page: Page, username: string, password = PASSWORD) => {
  await submitCredentials(page, username, password);
  await expect(columns(page)).toHaveCount(5);
};

const logOut = async (page: Page) => {
  await page.getByRole("button", { name: /log out/i }).click();
  await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
};

// Resolves once the board save that the next action triggers has finished.
const boardSaved = (page: Page) =>
  page.waitForResponse(
    (response) => response.url().endsWith("/api/board") && response.request().method() === "PUT"
  );

const reloadBoard = async (page: Page) => {
  await page.reload();
  await expect(columns(page)).toHaveCount(5);
};

test("shows the sign in screen", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
  await expect(columns(page)).toHaveCount(0);
});

test("shows an error on a wrong password", async ({ page }) => {
  await page.goto("/");
  await submitCredentials(page, "user", "wrong-password");
  // Matched by text: Next.js adds its own (empty) role="alert" route announcer.
  await expect(page.getByText("Invalid username or password")).toBeVisible();
});

test("the demo account signs in and out", async ({ page }) => {
  await page.goto("/");
  await signIn(page, "user", "password");
  await expect(page.getByText("Signed in as")).toContainText("user");
  await logOut(page);
});

test("a new account gets the default board and stays signed in on reload", async ({ page }) => {
  const username = await signUp(page);
  await expect(page.getByTestId("card-card-1")).toBeVisible();
  await reloadBoard(page);
  await expect(page.getByText("Signed in as")).toContainText(username);
});

test("adding a card survives a reload", async ({ page }) => {
  await signUp(page);
  const firstColumn = columns(page).first();
  await firstColumn.getByRole("button", { name: /add a card/i }).click();
  await firstColumn.getByPlaceholder("Card title").fill("Playwright card");
  await firstColumn.getByPlaceholder("Details").fill("Added via e2e.");
  const saved = boardSaved(page);
  await firstColumn.getByRole("button", { name: /add card/i }).click();
  await saved;

  await reloadBoard(page);
  await expect(columns(page).first().getByText("Playwright card")).toBeVisible();
});

test("editing a card survives a reload", async ({ page }) => {
  await signUp(page);
  const card = page.getByTestId("card-card-1");
  await card.getByRole("button", { name: /^edit/i }).click();
  await card.getByLabel("Card title").fill("Edited card");
  await card.getByLabel("Card details").fill("Edited via e2e.");
  const saved = boardSaved(page);
  await card.getByRole("button", { name: "Save" }).click();
  await saved;

  await reloadBoard(page);
  await expect(card.getByText("Edited card")).toBeVisible();
  await expect(card.getByText("Edited via e2e.")).toBeVisible();
});

test("removing a card survives a reload", async ({ page }) => {
  await signUp(page);
  const saved = boardSaved(page);
  await page.getByTestId("card-card-1").getByRole("button", { name: /^delete/i }).click();
  await saved;

  await reloadBoard(page);
  await expect(page.getByTestId("card-card-1")).toHaveCount(0);
});

test("renaming a column survives a reload", async ({ page }) => {
  await signUp(page);
  const title = page.getByTestId("column-col-backlog").getByLabel("Column title");
  await title.fill("Ideas");
  const saved = boardSaved(page);
  await title.press("Enter");
  await saved;

  await reloadBoard(page);
  await expect(title).toHaveValue("Ideas");
});

test("moving a card between columns survives a reload", async ({ page }) => {
  await signUp(page);
  const card = page.getByTestId("card-card-1");
  const targetColumn = page.getByTestId("column-col-review");
  const cardBox = await card.boundingBox();
  const columnBox = await targetColumn.boundingBox();
  if (!cardBox || !columnBox) {
    throw new Error("Unable to resolve drag coordinates.");
  }

  const saved = boardSaved(page);
  await page.mouse.move(cardBox.x + cardBox.width / 2, cardBox.y + cardBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(columnBox.x + columnBox.width / 2, columnBox.y + 120, { steps: 12 });
  await page.mouse.up();
  await saved;

  await reloadBoard(page);
  await expect(targetColumn.getByTestId("card-card-1")).toBeVisible();
});

test("changes survive logging out and back in", async ({ page }) => {
  const username = await signUp(page);
  const saved = boardSaved(page);
  await page.getByTestId("card-card-1").getByRole("button", { name: /^delete/i }).click();
  await saved;

  await logOut(page);
  await signIn(page, username);
  await expect(page.getByTestId("card-card-1")).toHaveCount(0);
});

test("boards of different users are independent", async ({ page }) => {
  await signUp(page);
  const saved = boardSaved(page);
  await page.getByTestId("card-card-1").getByRole("button", { name: /^delete/i }).click();
  await saved;
  await logOut(page);

  await page.getByRole("button", { name: /new here/i }).click();
  await submitCredentials(page, uniqueUsername(), PASSWORD);
  await expect(page.getByTestId("card-card-1")).toBeVisible();
});
