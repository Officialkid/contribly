import { test, expect } from '@playwright/test';

const email = process.env.E2E_EMAIL;
const password = process.env.E2E_PASSWORD;
const inviteCode = process.env.E2E_INVITE_CODE;

// Helper: skip when required env is absent
const requireEnv = (value: string | undefined, name: string) => {
  test.skip(!value, `${name} env not set`);
  return value as string;
};

// 1) Login flow
test('login redirects to org dashboard', async ({ page }) => {
  requireEnv(email, 'E2E_EMAIL');
  requireEnv(password, 'E2E_PASSWORD');

  await page.goto('/login');
  await page.getByLabel('Email Address').fill(email!);
  await page.getByLabel('Password').fill(password!);
  await page.getByRole('button', { name: 'Sign In' }).click();

  await page.waitForURL('**/orgs/**');
  await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();
});

// 2) Accept invite (existing user path)
test('accept invite as existing user', async ({ page }) => {
  requireEnv(email, 'E2E_EMAIL');
  requireEnv(password, 'E2E_PASSWORD');
  requireEnv(inviteCode, 'E2E_INVITE_CODE');

  await page.goto(`/invites/${inviteCode}`);
  await page.getByRole('button', { name: 'Sign In Existing Account' }).click();
  await page.getByLabel('Email').fill(email!);
  await page.getByLabel('Password').fill(password!);
  await page.getByRole('button', { name: 'Accept Invite' }).click();

  await page.waitForURL('**/orgs/**');
  await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();
});

// 3) Org dashboard loads after navigation
test('org dashboard renders content', async ({ page }) => {
  requireEnv(email, 'E2E_EMAIL');
  requireEnv(password, 'E2E_PASSWORD');

  await page.goto('/login');
  await page.getByLabel('Email Address').fill(email!);
  await page.getByLabel('Password').fill(password!);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.waitForURL('**/orgs/**');

  // Expect header and role badge to render
  await expect(page.getByRole('heading').first()).toBeVisible();
});

// 4) Logout flow
test('logout clears session', async ({ page }) => {
  requireEnv(email, 'E2E_EMAIL');
  requireEnv(password, 'E2E_PASSWORD');

  await page.goto('/login');
  await page.getByLabel('Email Address').fill(email!);
  await page.getByLabel('Password').fill(password!);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.waitForURL('**/orgs/**');

  await page.getByRole('button', { name: 'Logout' }).click();
  await page.waitForURL('**/login', { waitUntil: 'networkidle' });
  await expect(page).toHaveURL(/login/);
});
