import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'blord-store-test-'));
process.env.BLORD_DATA_DIR = tempDir;

import {
  addContactInquiry,
  addNewsletterSubscriber,
  authenticateExecutive,
  authenticateStaff,
  changeExecutivePassword,
  changeStaffMemberPassword,
  claimExecutiveAdmin,
  claimInitialStaffAdmin,
  claimStaffMemberAccount,
  createStaffAccount,
  getAuthMode,
  getExecutiveAuthMode,
  getSessionUserProfile,
  getSiteContent,
  getStaffInbox,
  listStaffAccounts,
  readUploadedMediaFile,
  resetSiteContent,
  saveSiteContent,
  saveUploadedImageBuffer,
  updateStaffAccountRole,
  updateUserPreferences,
  verifySessionToken,
  verifyStaffToken,
} from './server-store';

test('first-run staff claim locks once claimed and verifies Bearer tokens', () => {
  delete process.env.STAFF_ADMIN_PASSCODE;
  assert.equal(getAuthMode().mode, 'unclaimed');

  const claim1 = claimInitialStaffAdmin('admin@blordholdings.com', 'StrongPass2026!');
  assert.equal(claim1.ok, true);
  if (claim1.ok) {
    const payload = verifyStaffToken(`Bearer ${claim1.token}`);
    assert.ok(payload);
    assert.equal(payload.email, 'admin@blordholdings.com');
    assert.equal(payload.role, 'staff');
  }

  // Second claim must fail with 409
  const claim2 = claimInitialStaffAdmin('other@blordholdings.com', 'AnotherPass2026!');
  assert.equal(claim2.ok, false);
  if (!claim2.ok) {
    assert.equal(claim2.status, 409);
  }

  // Login works with valid credentials and rejects wrong password
  const badLogin = authenticateStaff('admin@blordholdings.com', 'WrongPass');
  assert.equal(badLogin.ok, false);

  const goodLogin = authenticateStaff('admin@blordholdings.com', 'StrongPass2026!');
  assert.equal(goodLogin.ok, true);
});

test('single Executive Admin claim, login, password rotation, and multi-staff roles work cleanly', () => {
  delete process.env.EXECUTIVE_ADMIN_PASSCODE;
  assert.equal(getExecutiveAuthMode().mode, 'unclaimed');

  const execClaim = claimExecutiveAdmin('ceo@blordholdings.com', 'CeoSecret2026!', 'Chief Linus');
  assert.equal(execClaim.ok, true);
  if (execClaim.ok) {
    const tokenPayload = verifyStaffToken(`Bearer ${execClaim.token}`);
    assert.ok(tokenPayload);
    assert.equal(tokenPayload.role, 'executive');
  }

  // Second Executive claim must lock with 409
  const execClaim2 = claimExecutiveAdmin('intruder@blordholdings.com', 'Hijack2026!');
  assert.equal(execClaim2.ok, false);
  if (!execClaim2.ok) {
    assert.equal(execClaim2.status, 409);
  }

  // Password change requires correct current password and updates hash cleanly
  const badPwdChange = changeExecutivePassword('WrongCurrent', 'NewCeoPass2026!');
  assert.equal(badPwdChange.ok, false);

  const goodPwdChange = changeExecutivePassword('CeoSecret2026!', 'NewCeoPass2026!');
  assert.equal(goodPwdChange.ok, true);

  assert.equal(authenticateExecutive('ceo@blordholdings.com', 'CeoSecret2026!').ok, false);
  assert.equal(authenticateExecutive('ceo@blordholdings.com', 'NewCeoPass2026!').ok, true);

  // Executive creates a role-scoped Staff member
  const staffCreate = createStaffAccount({
    name: 'Ugochi Inventory',
    email: 'ugochi@blordholdings.com',
    password: 'StaffPassword1!',
    department: 'inventory',
    title: 'EV Stock Officer',
  });
  assert.equal(staffCreate.ok, true);
  assert.ok(listStaffAccounts().some((u) => u.email === 'ugochi@blordholdings.com'));

  const staffLogin = authenticateStaff('ugochi@blordholdings.com', 'StaffPassword1!');
  assert.equal(staffLogin.ok, true);
  if (staffLogin.ok) {
    assert.equal(staffLogin.department, 'inventory');
    assert.equal(staffLogin.role, 'staff');
  }

  // Staff member can rotate their own password
  const staffPwdChange = changeStaffMemberPassword(
    'ugochi@blordholdings.com',
    'StaffPassword1!',
    'StaffPassword2!'
  );
  assert.equal(staffPwdChange.ok, true);
  assert.equal(authenticateStaff('ugochi@blordholdings.com', 'StaffPassword2!').ok, true);

  // Deactivating a staff account blocks login
  if (staffCreate.ok) {
    updateStaffAccountRole(staffCreate.staff.id, { active: false });
    assert.equal(authenticateStaff('ugochi@blordholdings.com', 'StaffPassword2!').ok, false);
  }
});

test('image upload validates magic bytes and blocks path traversal', () => {
  const invalidUpload = saveUploadedImageBuffer(Buffer.from('not a valid image payload'));
  assert.equal(invalidUpload.ok, false);

  // Valid PNG header signature + minimal bytes
  const pngHeader = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
  ]);
  const validUpload = saveUploadedImageBuffer(pngHeader);
  assert.equal(validUpload.ok, true);
  if (validUpload.ok) {
    assert.ok(validUpload.url.startsWith('/api/media/'));
    const readBack = readUploadedMediaFile(validUpload.filename);
    assert.ok(readBack);
    assert.equal(readBack.mime, 'image/png');
  }

  assert.equal(readUploadedMediaFile('../../etc/passwd'), null);
  assert.equal(readUploadedMediaFile('bad/path.png'), null);
});

test('CMS content saves, reloads, resets, and records inquiries', () => {
  const initial = getSiteContent();
  assert.equal(initial.content.brandName, 'Blord Group');

  const updated = structuredClone(initial.content);
  updated.heroTitle = 'Updated Hero Headline';
  saveSiteContent(updated);

  const reloaded = getSiteContent();
  assert.equal(reloaded.content.heroTitle, 'Updated Hero Headline');

  resetSiteContent();
  const afterReset = getSiteContent();
  assert.equal(afterReset.content.heroTitle, 'Building Simple Solutions for Complex Problems.');

  addContactInquiry({
    name: 'Chidi Okafor',
    email: 'chidi@example.com',
    subject: 'B Cars Import',
    message: 'Interested in importing a sedan via Guangzhou.',
  });
  addNewsletterSubscriber('subscriber@example.com');
  const inbox = getStaffInbox();
  assert.equal(inbox.inquiries.length, 1);
  assert.equal(inbox.subscribers.length, 1);
});

test('multi-staff claim, non-expiring sessions, branch assignment, and resume lastTab work end-to-end', () => {
  const claimSales = claimStaffMemberAccount({
    name: 'Chisom Sales',
    email: 'chisom@blordholdings.com',
    password: 'SalesPassword2026!',
    department: 'sales',
    branchId: 'abuja',
  });
  assert.equal(claimSales.ok, true);
  if (claimSales.ok) {
    assert.equal(claimSales.department, 'sales');
    assert.equal(claimSales.branchId, 'abuja');
    const verified = verifySessionToken(claimSales.token);
    assert.ok(verified);
    assert.equal(verified.noExpiry, true);
    assert.equal(verified.department, 'sales');

    // Update lastTab and branchId, then verify resume profile and re-login return saved state
    const prefs = updateUserPreferences('chisom@blordholdings.com', 'staff', {
      lastTab: 'directory',
      branchId: 'lagos',
    });
    assert.equal(prefs.lastTab, 'directory');
    assert.equal(prefs.branchId, 'lagos');

    const profile = getSessionUserProfile(verified);
    assert.ok(profile);
    assert.equal(profile.lastTab, 'directory');
    assert.equal(profile.branchId, 'lagos');
  }

  // Duplicate email claim returns 409
  const duplicateClaim = claimStaffMemberAccount({
    name: 'Chisom Duplicate',
    email: 'chisom@blordholdings.com',
    password: 'AnotherPassword2026!',
    department: 'marketing',
    branchId: 'lagos',
  });
  assert.equal(duplicateClaim.ok, false);
  if (!duplicateClaim.ok) {
    assert.equal(duplicateClaim.status, 409);
  }

  // Second distinct staff member (ICT & Tech) can claim their own access cleanly
  const claimIct = claimStaffMemberAccount({
    name: 'Tunde Tech',
    email: 'tunde@blordholdings.com',
    password: 'TechPassword2026!',
    department: 'ict-tech',
    branchId: 'port-harcourt',
  });
  assert.equal(claimIct.ok, true);

  // Re-login preserves lastTab
  const relogin = authenticateStaff('chisom@blordholdings.com', 'SalesPassword2026!');
  assert.equal(relogin.ok, true);
  if (relogin.ok) {
    assert.equal(relogin.lastTab, 'directory');
    assert.equal(relogin.branchId, 'lagos');
  }

  fs.rmSync(tempDir, { recursive: true, force: true });
});
