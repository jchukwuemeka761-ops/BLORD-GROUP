import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { DEFAULT_BLORD_CONTENT } from './blord-default-data';
import type {
  AuthRole,
  BlordSiteContent,
  ContactInquiry,
  NewsletterSubscriber,
  StaffAccountPublic,
  StaffDepartment,
} from './blord-types';

interface CmsStoreFile {
  content: BlordSiteContent;
  inquiries: ContactInquiry[];
  subscribers: NewsletterSubscriber[];
  updatedAt: string;
}

interface StaffAuthRecord {
  email: string;
  salt: string;
  passwordHash: string;
  claimedAt: string;
}

interface ExecutiveAuthRecord {
  email: string;
  name: string;
  salt: string;
  passwordHash: string;
  claimedAt: string;
  passwordUpdatedAt: string;
  lastTab?: string;
}

interface StaffUserRecord {
  id: string;
  name: string;
  email: string;
  department: StaffDepartment;
  branchId?: string;
  title: string;
  salt: string;
  passwordHash: string;
  active: boolean;
  lastTab?: string;
  createdAt: string;
}

export interface TokenPayload {
  email: string;
  role: AuthRole;
  department?: StaffDepartment;
  branchId?: string;
  name?: string;
  iat: number;
  exp: number;
  noExpiry?: boolean;
}

const VALID_DEPARTMENTS: StaffDepartment[] = [
  'sales',
  'marketing',
  'ict-tech',
  'maintenance',
  'operations',
  'inventory',
  'branches',
  'inbox',
  'editorial',
];

const NON_EXPIRING_SESSION_SECONDS = 60 * 60 * 24 * 365 * 20; // 20 years (until explicit Sign Out)
const globalForSession = globalThis as unknown as { __blordSessionSecret?: string };

function getSessionSecret(): string {
  const configured = process.env.SESSION_SECRET?.trim();
  if (configured && configured.length >= 16) {
    return configured;
  }
  if (globalForSession.__blordSessionSecret) {
    return globalForSession.__blordSessionSecret;
  }
  try {
    const secretFile = path.join(getDataDir(), 'session-secret.key');
    if (fs.existsSync(secretFile)) {
      const stored = fs.readFileSync(secretFile, 'utf8').trim();
      if (stored.length >= 32) {
        globalForSession.__blordSessionSecret = stored;
        return stored;
      }
    }
    const generated = crypto.randomBytes(32).toString('hex');
    fs.writeFileSync(secretFile, generated, { encoding: 'utf8', mode: 0o600 });
    globalForSession.__blordSessionSecret = generated;
    return generated;
  } catch {
    globalForSession.__blordSessionSecret = crypto.randomBytes(32).toString('hex');
    return globalForSession.__blordSessionSecret;
  }
}

function getDataDir(): string {
  const override = process.env.BLORD_DATA_DIR?.trim();
  if (override) {
    fs.mkdirSync(override, { recursive: true });
    return override;
  }
  const projectData = path.join(process.cwd(), 'data');
  try {
    fs.mkdirSync(projectData, { recursive: true });
    fs.accessSync(projectData, fs.constants.W_OK);
    return projectData;
  } catch {
    const tmpData = path.join('/tmp', 'blordgroup-data');
    fs.mkdirSync(tmpData, { recursive: true });
    return tmpData;
  }
}

function getCmsFilePath(): string {
  return path.join(getDataDir(), 'cms-store.json');
}

function getAuthFilePath(): string {
  return path.join(getDataDir(), 'staff-auth.json');
}

function getExecutiveAuthFilePath(): string {
  return path.join(getDataDir(), 'executive-auth.json');
}

function getStaffUsersFilePath(): string {
  return path.join(getDataDir(), 'staff-users.json');
}

function getUploadsDir(): string {
  const dir = path.resolve(getDataDir(), 'uploads');
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function atomicWriteJson(filePath: string, data: unknown): void {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
  const tmpPath = path.join(dir, `.${path.basename(filePath)}.${process.pid}.${Date.now()}.tmp`);
  fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), { encoding: 'utf8', mode: 0o600 });
  fs.renameSync(tmpPath, filePath);
}

function readCmsStore(): CmsStoreFile {
  const filePath = getCmsFilePath();
  if (!fs.existsSync(filePath)) {
    const initial: CmsStoreFile = {
      content: structuredClone(DEFAULT_BLORD_CONTENT),
      inquiries: [],
      subscribers: [],
      updatedAt: new Date().toISOString(),
    };
    atomicWriteJson(filePath, initial);
    return initial;
  }
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(raw) as Partial<CmsStoreFile>;
    const defaults = structuredClone(DEFAULT_BLORD_CONTENT);
    const mergedContent: BlordSiteContent = parsed.content
      ? {
          ...defaults,
          ...parsed.content,
          cars:
            Array.isArray(parsed.content.cars) && parsed.content.cars.length > 0
              ? parsed.content.cars
              : defaults.cars,
          powerTanks:
            Array.isArray(parsed.content.powerTanks) && parsed.content.powerTanks.length > 0
              ? parsed.content.powerTanks
              : defaults.powerTanks,
        }
      : defaults;
    return {
      content: mergedContent,
      inquiries: Array.isArray(parsed.inquiries) ? parsed.inquiries : [],
      subscribers: Array.isArray(parsed.subscribers) ? parsed.subscribers : [],
      updatedAt: parsed.updatedAt ?? new Date().toISOString(),
    };
  } catch {
    return {
      content: structuredClone(DEFAULT_BLORD_CONTENT),
      inquiries: [],
      subscribers: [],
      updatedAt: new Date().toISOString(),
    };
  }
}

export function getSiteContent(): { content: BlordSiteContent; updatedAt: string } {
  const store = readCmsStore();
  return { content: store.content, updatedAt: store.updatedAt };
}

export function saveSiteContent(content: BlordSiteContent): { content: BlordSiteContent; updatedAt: string } {
  const store = readCmsStore();
  const updatedAt = new Date().toISOString();
  const next: CmsStoreFile = {
    ...store,
    content,
    updatedAt,
  };
  atomicWriteJson(getCmsFilePath(), next);
  return { content: next.content, updatedAt };
}

export function resetSiteContent(): { content: BlordSiteContent; updatedAt: string } {
  const store = readCmsStore();
  const updatedAt = new Date().toISOString();
  const fresh = structuredClone(DEFAULT_BLORD_CONTENT);
  const next: CmsStoreFile = {
    ...store,
    content: fresh,
    updatedAt,
  };
  atomicWriteJson(getCmsFilePath(), next);
  return { content: next.content, updatedAt };
}

export function addContactInquiry(
  inquiry: Omit<ContactInquiry, 'id' | 'createdAt'>
): ContactInquiry {
  const store = readCmsStore();
  const record: ContactInquiry = {
    ...inquiry,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  const next: CmsStoreFile = {
    ...store,
    inquiries: [record, ...store.inquiries].slice(0, 200),
  };
  atomicWriteJson(getCmsFilePath(), next);
  return record;
}

export function addNewsletterSubscriber(email: string): {
  subscriber: NewsletterSubscriber;
  alreadySubscribed: boolean;
} {
  const normalized = email.trim().toLowerCase();
  const store = readCmsStore();
  const existing = store.subscribers.find((s) => s.email.toLowerCase() === normalized);
  if (existing) {
    return { subscriber: existing, alreadySubscribed: true };
  }
  const subscriber: NewsletterSubscriber = {
    id: crypto.randomUUID(),
    email: normalized,
    createdAt: new Date().toISOString(),
  };
  const next: CmsStoreFile = {
    ...store,
    subscribers: [subscriber, ...store.subscribers].slice(0, 1000),
  };
  atomicWriteJson(getCmsFilePath(), next);
  return { subscriber, alreadySubscribed: false };
}

export function getStaffInbox(): {
  inquiries: ContactInquiry[];
  subscribers: NewsletterSubscriber[];
} {
  const store = readCmsStore();
  return {
    inquiries: store.inquiries,
    subscribers: store.subscribers,
  };
}

function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function safeEqualHex(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'hex');
  const bufB = Buffer.from(b, 'hex');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function safeEqualStrings(a: string, b: string): boolean {
  const digestA = crypto.createHash('sha256').update(a).digest();
  const digestB = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(digestA, digestB);
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// === EXECUTIVE ADMIN AUTH (Single Authorized CEO / Executive Account) ===

function readExecutiveAuthRecord(): ExecutiveAuthRecord | null {
  const filePath = getExecutiveAuthFilePath();
  if (!fs.existsSync(filePath)) return null;
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(raw) as ExecutiveAuthRecord;
    if (parsed.email && parsed.salt && parsed.passwordHash) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function getExecutiveAuthMode(): {
  mode: 'env' | 'claimed' | 'unclaimed';
  claimedEmail?: string;
  claimedName?: string;
  passwordUpdatedAt?: string;
} {
  const envPass = process.env.EXECUTIVE_ADMIN_PASSCODE?.trim();
  if (envPass) {
    return { mode: 'env' };
  }
  const record = readExecutiveAuthRecord();
  if (record) {
    return {
      mode: 'claimed',
      claimedEmail: record.email,
      claimedName: record.name,
      passwordUpdatedAt: record.passwordUpdatedAt,
    };
  }
  return { mode: 'unclaimed' };
}

export function claimExecutiveAdmin(
  email: string,
  password: string,
  name = 'Chief Executive Admin'
):
  | { ok: true; token: string; email: string; name: string; role: 'executive'; lastTab?: string }
  | { ok: false; error: string; status: number } {
  const status = getExecutiveAuthMode();
  if (status.mode === 'env') {
    return {
      ok: false,
      error: 'Executive passcode is already managed via server environment configuration.',
      status: 409,
    };
  }
  if (status.mode === 'claimed') {
    return {
      ok: false,
      error: 'The single Executive Admin account has already been claimed.',
      status: 409,
    };
  }

  const normalizedEmail = email.trim().toLowerCase();
  const cleanName = (name ?? '').trim() || 'Chief Executive Admin';
  if (!isValidEmail(normalizedEmail)) {
    return { ok: false, error: 'Please provide a valid executive email address.', status: 400 };
  }
  if (password.length < 8) {
    return { ok: false, error: 'Password must be at least 8 characters long.', status: 400 };
  }

  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = hashPassword(password, salt);
  const now = new Date().toISOString();
  const record: ExecutiveAuthRecord = {
    email: normalizedEmail,
    name: cleanName,
    salt,
    passwordHash,
    claimedAt: now,
    passwordUpdatedAt: now,
    lastTab: 'cars',
  };

  const authPath = getExecutiveAuthFilePath();
  fs.mkdirSync(path.dirname(authPath), { recursive: true });
  try {
    fs.writeFileSync(authPath, JSON.stringify(record, null, 2), {
      encoding: 'utf8',
      mode: 0o600,
      flag: 'wx',
    });
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'EEXIST') {
      return {
        ok: false,
        error: 'The single Executive Admin account has already been claimed.',
        status: 409,
      };
    }
    throw err;
  }

  return {
    ok: true,
    token: issueAuthToken({ email: normalizedEmail, role: 'executive', name: cleanName }),
    email: normalizedEmail,
    name: cleanName,
    role: 'executive',
    lastTab: 'cars',
  };
}

export function authenticateExecutive(
  email: string,
  password: string
):
  | { ok: true; token: string; email: string; name: string; role: 'executive'; lastTab?: string }
  | { ok: false; error: string; status: number } {
  const normalizedEmail = email.trim().toLowerCase();
  if (!isValidEmail(normalizedEmail) || !password) {
    return { ok: false, error: 'Valid email and password are required.', status: 400 };
  }

  const envPass = process.env.EXECUTIVE_ADMIN_PASSCODE?.trim();
  if (envPass) {
    if (!safeEqualStrings(password, envPass)) {
      return { ok: false, error: 'Invalid executive admin credentials.', status: 401 };
    }
    return {
      ok: true,
      token: issueAuthToken({
        email: normalizedEmail,
        role: 'executive',
        name: 'Executive Admin',
      }),
      email: normalizedEmail,
      name: 'Executive Admin',
      role: 'executive',
      lastTab: 'cars',
    };
  }

  const record = readExecutiveAuthRecord();
  if (!record) {
    return {
      ok: false,
      error: 'No Executive Admin account has been created yet. Use Create Authorized Account.',
      status: 403,
    };
  }

  if (!safeEqualStrings(normalizedEmail, record.email.toLowerCase())) {
    return { ok: false, error: 'Invalid executive admin credentials.', status: 401 };
  }
  const candidateHash = hashPassword(password, record.salt);
  if (!safeEqualHex(candidateHash, record.passwordHash)) {
    return { ok: false, error: 'Invalid executive admin credentials.', status: 401 };
  }

  return {
    ok: true,
    token: issueAuthToken({ email: record.email, role: 'executive', name: record.name }),
    email: record.email,
    name: record.name,
    role: 'executive',
    lastTab: record.lastTab ?? 'cars',
  };
}

export function changeExecutivePassword(
  currentPassword: string,
  newPassword: string
):
  | { ok: true; token: string; email: string; name: string; updatedAt: string }
  | { ok: false; error: string; status: number } {
  if (process.env.EXECUTIVE_ADMIN_PASSCODE?.trim()) {
    return {
      ok: false,
      error:
        'Executive passcode is controlled via EXECUTIVE_ADMIN_PASSCODE in Settings > Secrets. Unset that secret or update it there.',
      status: 409,
    };
  }

  const record = readExecutiveAuthRecord();
  if (!record) {
    return { ok: false, error: 'Executive Admin account has not been claimed yet.', status: 404 };
  }

  if (!currentPassword || !newPassword) {
    return { ok: false, error: 'Current password and new password are required.', status: 400 };
  }
  if (newPassword.length < 8) {
    return {
      ok: false,
      error: 'New password must be at least 8 characters long.',
      status: 400,
    };
  }

  const currentHash = hashPassword(currentPassword, record.salt);
  if (!safeEqualHex(currentHash, record.passwordHash)) {
    return { ok: false, error: 'Current password is incorrect.', status: 401 };
  }

  const nextSalt = crypto.randomBytes(16).toString('hex');
  const nextHash = hashPassword(newPassword, nextSalt);
  const updatedAt = new Date().toISOString();
  const updated: ExecutiveAuthRecord = {
    ...record,
    salt: nextSalt,
    passwordHash: nextHash,
    passwordUpdatedAt: updatedAt,
  };
  atomicWriteJson(getExecutiveAuthFilePath(), updated);

  return {
    ok: true,
    token: issueAuthToken({ email: updated.email, role: 'executive', name: updated.name }),
    email: updated.email,
    name: updated.name,
    updatedAt,
  };
}

// === MULTI-STAFF ROLE ACCOUNTS (Staff Portal /admin) ===

function readAuthRecord(): StaffAuthRecord | null {
  const filePath = getAuthFilePath();
  if (!fs.existsSync(filePath)) return null;
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(raw) as StaffAuthRecord;
    if (parsed.email && parsed.salt && parsed.passwordHash) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

function readStaffUsers(): StaffUserRecord[] {
  const filePath = getStaffUsersFilePath();
  if (!fs.existsSync(filePath)) return [];
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as StaffUserRecord[]) : [];
  } catch {
    return [];
  }
}

function sanitizeStaffUser(u: StaffUserRecord): StaffAccountPublic {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    department: u.department,
    branchId: u.branchId,
    title: u.title,
    active: u.active,
    lastTab: u.lastTab,
    createdAt: u.createdAt,
  };
}

export function listStaffAccounts(): StaffAccountPublic[] {
  return readStaffUsers().map(sanitizeStaffUser);
}

export function getAuthMode(): {
  mode: 'env' | 'claimed' | 'unclaimed';
  claimedEmail?: string;
  staffCount: number;
} {
  const envPass = process.env.STAFF_ADMIN_PASSCODE?.trim();
  const users = readStaffUsers();
  if (envPass) {
    return { mode: 'env', staffCount: users.length };
  }
  const record = readAuthRecord();
  if (users.length > 0) {
    return { mode: 'claimed', claimedEmail: users[0].email, staffCount: users.length };
  }
  if (record) {
    return { mode: 'claimed', claimedEmail: record.email, staffCount: 1 };
  }
  return { mode: 'unclaimed', staffCount: 0 };
}

export function claimInitialStaffAdmin(
  email: string,
  password: string,
  name = 'Lead Operations Staff',
  department: StaffDepartment = 'operations',
  branchId = 'awka-hq'
):
  | {
      ok: true;
      token: string;
      email: string;
      name: string;
      department: StaffDepartment;
      branchId: string;
      role: 'staff';
    }
  | { ok: false; error: string; status: number } {
  const status = getAuthMode();
  if (status.mode === 'env') {
    return {
      ok: false,
      error: 'Admin passcode is already managed via environment configuration.',
      status: 409,
    };
  }
  if (status.mode === 'claimed') {
    return {
      ok: false,
      error: 'An authorized staff admin account has already been claimed.',
      status: 409,
    };
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (!isValidEmail(normalizedEmail)) {
    return { ok: false, error: 'Please provide a valid staff email address.', status: 400 };
  }
  if (password.length < 8) {
    return {
      ok: false,
      error: 'Password must be at least 8 characters long.',
      status: 400,
    };
  }

  const validDept = VALID_DEPARTMENTS.includes(department) ? department : 'operations';
  const cleanName = name.trim() || 'Lead Operations Staff';
  const cleanBranch = (branchId ?? '').trim() || 'awka-hq';
  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = hashPassword(password, salt);
  const now = new Date().toISOString();

  const legacyRecord: StaffAuthRecord = {
    email: normalizedEmail,
    salt,
    passwordHash,
    claimedAt: now,
  };

  const authPath = getAuthFilePath();
  fs.mkdirSync(path.dirname(authPath), { recursive: true });
  try {
    fs.writeFileSync(authPath, JSON.stringify(legacyRecord, null, 2), {
      encoding: 'utf8',
      mode: 0o600,
      flag: 'wx',
    });
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'EEXIST') {
      return {
        ok: false,
        error: 'An authorized staff admin account has already been claimed.',
        status: 409,
      };
    }
    throw err;
  }

  const users = readStaffUsers();
  if (!users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
    const firstUser: StaffUserRecord = {
      id: crypto.randomUUID(),
      name: cleanName,
      email: normalizedEmail,
      department: validDept,
      branchId: cleanBranch,
      title: 'Operations Lead',
      salt,
      passwordHash,
      active: true,
      createdAt: now,
    };
    atomicWriteJson(getStaffUsersFilePath(), [firstUser, ...users]);
  }

  return {
    ok: true,
    token: issueAuthToken({
      email: normalizedEmail,
      role: 'staff',
      department: validDept,
      branchId: cleanBranch,
      name: cleanName,
    }),
    email: normalizedEmail,
    name: cleanName,
    department: validDept,
    branchId: cleanBranch,
    role: 'staff',
  };
}

/**
 * Allows any Blord Group staff member (Sales, Marketing, ICT & Tech, Maintenance, etc.)
 * across all branches to claim their personal Staff Portal access.
 */
export function claimStaffMemberAccount(input: {
  name: string;
  email: string;
  password: string;
  department: StaffDepartment;
  branchId?: string;
  title?: string;
}):
  | {
      ok: true;
      token: string;
      email: string;
      name: string;
      department: StaffDepartment;
      branchId: string;
      role: 'staff';
      lastTab?: string;
    }
  | { ok: false; error: string; status: number } {
  const cleanName = (input.name ?? '').trim();
  const normalizedEmail = (input.email ?? '').trim().toLowerCase();
  const cleanBranch = (input.branchId ?? '').trim() || 'awka-hq';

  if (cleanName.length < 2) {
    return { ok: false, error: 'Please enter your full name (at least 2 characters).', status: 400 };
  }
  if (!isValidEmail(normalizedEmail)) {
    return { ok: false, error: 'Please enter a valid company email address.', status: 400 };
  }
  if (!input.password || input.password.length < 8) {
    return { ok: false, error: 'Password must be at least 8 characters long.', status: 400 };
  }
  if (!VALID_DEPARTMENTS.includes(input.department)) {
    return { ok: false, error: 'Please select your assigned department.', status: 400 };
  }

  const users = readStaffUsers();
  if (users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
    return {
      ok: false,
      error: 'A Staff Portal account with this email already exists. Please use Sign In below.',
      status: 409,
    };
  }

  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = hashPassword(input.password, salt);
  const now = new Date().toISOString();

  // Keep legacy single-file marker in sync on very first staff claim
  const authPath = getAuthFilePath();
  if (!fs.existsSync(authPath)) {
    atomicWriteJson(authPath, {
      email: normalizedEmail,
      salt,
      passwordHash,
      claimedAt: now,
    } satisfies StaffAuthRecord);
  }

  const newStaff: StaffUserRecord = {
    id: crypto.randomUUID(),
    name: cleanName,
    email: normalizedEmail,
    department: input.department,
    branchId: cleanBranch,
    title: (input.title ?? '').trim() || 'Staff Member',
    salt,
    passwordHash,
    active: true,
    createdAt: now,
  };

  atomicWriteJson(getStaffUsersFilePath(), [newStaff, ...users]);

  return {
    ok: true,
    token: issueAuthToken({
      email: newStaff.email,
      role: 'staff',
      department: newStaff.department,
      branchId: newStaff.branchId,
      name: newStaff.name,
    }),
    email: newStaff.email,
    name: newStaff.name,
    department: newStaff.department,
    branchId: cleanBranch,
    role: 'staff',
  };
}

export function createStaffAccount(input: {
  name: string;
  email: string;
  password: string;
  department: StaffDepartment;
  branchId?: string;
  title?: string;
}):
  | { ok: true; staff: StaffAccountPublic }
  | { ok: false; error: string; status: number } {
  const cleanName = (input.name ?? '').trim();
  const normalizedEmail = (input.email ?? '').trim().toLowerCase();
  const cleanTitle = (input.title ?? '').trim() || 'Authorized Staff';
  const cleanBranch = (input.branchId ?? '').trim() || 'awka-hq';

  if (cleanName.length < 2) {
    return { ok: false, error: 'Staff name must be at least 2 characters.', status: 400 };
  }
  if (!isValidEmail(normalizedEmail)) {
    return { ok: false, error: 'Please enter a valid company email address.', status: 400 };
  }
  if (!input.password || input.password.length < 8) {
    return { ok: false, error: 'Password must be at least 8 characters long.', status: 400 };
  }
  if (!VALID_DEPARTMENTS.includes(input.department)) {
    return { ok: false, error: 'Please select a valid staff operational role.', status: 400 };
  }

  const users = readStaffUsers();
  if (users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
    return { ok: false, error: 'A staff account with this email already exists.', status: 409 };
  }

  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = hashPassword(input.password, salt);
  const newStaff: StaffUserRecord = {
    id: crypto.randomUUID(),
    name: cleanName,
    email: normalizedEmail,
    department: input.department,
    branchId: cleanBranch,
    title: cleanTitle,
    salt,
    passwordHash,
    active: true,
    createdAt: new Date().toISOString(),
  };

  atomicWriteJson(getStaffUsersFilePath(), [newStaff, ...users]);
  return { ok: true, staff: sanitizeStaffUser(newStaff) };
}

export function updateStaffAccountRole(
  id: string,
  updates: {
    department?: StaffDepartment;
    branchId?: string;
    title?: string;
    active?: boolean;
    newPassword?: string;
  }
):
  | { ok: true; staff: StaffAccountPublic }
  | { ok: false; error: string; status: number } {
  const users = readStaffUsers();
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) {
    return { ok: false, error: 'Staff account not found.', status: 404 };
  }

  const current = users[idx];
  const nextDept =
    updates.department && VALID_DEPARTMENTS.includes(updates.department)
      ? updates.department
      : current.department;

  let nextSalt = current.salt;
  let nextHash = current.passwordHash;
  if (typeof updates.newPassword === 'string' && updates.newPassword.length > 0) {
    if (updates.newPassword.length < 8) {
      return { ok: false, error: 'Reset password must be at least 8 characters.', status: 400 };
    }
    nextSalt = crypto.randomBytes(16).toString('hex');
    nextHash = hashPassword(updates.newPassword, nextSalt);
  }

  const updated: StaffUserRecord = {
    ...current,
    department: nextDept,
    branchId:
      typeof updates.branchId === 'string' && updates.branchId.trim()
        ? updates.branchId.trim()
        : current.branchId,
    title: typeof updates.title === 'string' && updates.title.trim() ? updates.title.trim() : current.title,
    active: typeof updates.active === 'boolean' ? updates.active : current.active,
    salt: nextSalt,
    passwordHash: nextHash,
  };

  users[idx] = updated;
  atomicWriteJson(getStaffUsersFilePath(), users);
  return { ok: true, staff: sanitizeStaffUser(updated) };
}

export function deleteStaffAccount(id: string): { ok: true } | { ok: false; error: string; status: number } {
  const users = readStaffUsers();
  const next = users.filter((u) => u.id !== id);
  if (next.length === users.length) {
    return { ok: false, error: 'Staff account not found.', status: 404 };
  }
  atomicWriteJson(getStaffUsersFilePath(), next);
  return { ok: true };
}

export function authenticateStaff(
  email: string,
  password: string
):
  | {
      ok: true;
      token: string;
      email: string;
      name: string;
      department: StaffDepartment;
      branchId?: string;
      lastTab?: string;
      role: 'staff';
    }
  | { ok: false; error: string; status: number } {
  const normalizedEmail = email.trim().toLowerCase();
  if (!isValidEmail(normalizedEmail) || !password) {
    return { ok: false, error: 'Valid email and password are required.', status: 400 };
  }

  const users = readStaffUsers();
  const matchedUser = users.find((u) => u.email.toLowerCase() === normalizedEmail);
  if (matchedUser) {
    if (!matchedUser.active) {
      return {
        ok: false,
        error: 'This staff account has been deactivated by Executive Admin.',
        status: 403,
      };
    }
    const candidateHash = hashPassword(password, matchedUser.salt);
    if (!safeEqualHex(candidateHash, matchedUser.passwordHash)) {
      return { ok: false, error: 'Invalid staff credentials.', status: 401 };
    }
    return {
      ok: true,
      token: issueAuthToken({
        email: matchedUser.email,
        role: 'staff',
        department: matchedUser.department,
        branchId: matchedUser.branchId,
        name: matchedUser.name,
      }),
      email: matchedUser.email,
      name: matchedUser.name,
      department: matchedUser.department,
      branchId: matchedUser.branchId,
      lastTab: matchedUser.lastTab,
      role: 'staff',
    };
  }

  const envPass = process.env.STAFF_ADMIN_PASSCODE?.trim();
  if (envPass) {
    if (!safeEqualStrings(password, envPass)) {
      return { ok: false, error: 'Invalid staff credentials.', status: 401 };
    }
    return {
      ok: true,
      token: issueAuthToken({
        email: normalizedEmail,
        role: 'staff',
        department: 'operations',
        branchId: 'awka-hq',
        name: normalizedEmail.split('@')[0] || 'Blord Staff',
      }),
      email: normalizedEmail,
      name: normalizedEmail.split('@')[0] || 'Blord Staff',
      department: 'operations',
      branchId: 'awka-hq',
      role: 'staff',
    };
  }

  const record = readAuthRecord();
  if (!record) {
    return {
      ok: false,
      error: 'No Staff Portal accounts have been set up yet. Claim your staff portal access above first.',
      status: 403,
    };
  }

  if (!safeEqualStrings(normalizedEmail, record.email.toLowerCase())) {
    return { ok: false, error: 'Invalid staff credentials.', status: 401 };
  }
  const candidateHash = hashPassword(password, record.salt);
  if (!safeEqualHex(candidateHash, record.passwordHash)) {
    return { ok: false, error: 'Invalid staff credentials.', status: 401 };
  }

  return {
    ok: true,
    token: issueAuthToken({
      email: record.email,
      role: 'staff',
      department: 'operations',
      branchId: 'awka-hq',
      name: 'Operations Lead',
    }),
    email: record.email,
    name: 'Operations Lead',
    department: 'operations',
    branchId: 'awka-hq',
    role: 'staff',
  };
}

export function changeStaffMemberPassword(
  email: string,
  currentPassword: string,
  newPassword: string
):
  | { ok: true; token: string; email: string }
  | { ok: false; error: string; status: number } {
  const normalizedEmail = email.trim().toLowerCase();
  if (!currentPassword || !newPassword || newPassword.length < 8) {
    return {
      ok: false,
      error: 'Current password and a new password of at least 8 characters are required.',
      status: 400,
    };
  }

  const users = readStaffUsers();
  const idx = users.findIndex((u) => u.email.toLowerCase() === normalizedEmail);
  if (idx !== -1) {
    const user = users[idx];
    if (!safeEqualHex(hashPassword(currentPassword, user.salt), user.passwordHash)) {
      return { ok: false, error: 'Current password is incorrect.', status: 401 };
    }
    const nextSalt = crypto.randomBytes(16).toString('hex');
    const nextHash = hashPassword(newPassword, nextSalt);
    users[idx] = { ...user, salt: nextSalt, passwordHash: nextHash };
    atomicWriteJson(getStaffUsersFilePath(), users);
    return {
      ok: true,
      token: issueAuthToken({
        email: user.email,
        role: 'staff',
        department: user.department,
        name: user.name,
      }),
      email: user.email,
    };
  }

  const record = readAuthRecord();
  if (record && safeEqualStrings(normalizedEmail, record.email.toLowerCase())) {
    if (!safeEqualHex(hashPassword(currentPassword, record.salt), record.passwordHash)) {
      return { ok: false, error: 'Current password is incorrect.', status: 401 };
    }
    const nextSalt = crypto.randomBytes(16).toString('hex');
    const nextHash = hashPassword(newPassword, nextSalt);
    atomicWriteJson(getAuthFilePath(), { ...record, salt: nextSalt, passwordHash: nextHash });
    return {
      ok: true,
      token: issueAuthToken({
        email: record.email,
        role: 'staff',
        department: 'operations',
        name: 'Operations Lead',
      }),
      email: record.email,
    };
  }

  return {
    ok: false,
    error: 'Password changes for environment-managed sessions must be made in Secrets.',
    status: 409,
  };
}

// === SESSION PROFILE & PREFERENCES ===

export function getSessionUserProfile(payload: TokenPayload): {
  email: string;
  role: AuthRole;
  name: string;
  department?: StaffDepartment;
  branchId?: string;
  lastTab?: string;
} | null {
  if (payload.role === 'executive') {
    const execRecord = readExecutiveAuthRecord();
    return {
      email: execRecord?.email ?? payload.email,
      role: 'executive',
      name: execRecord?.name ?? payload.name ?? 'Executive Admin',
      lastTab: execRecord?.lastTab ?? 'cars',
    };
  }

  const users = readStaffUsers();
  const matched = users.find((u) => u.email.toLowerCase() === payload.email.toLowerCase());
  if (matched) {
    if (!matched.active) {
      return null;
    }
    return {
      email: matched.email,
      role: 'staff',
      name: matched.name,
      department: matched.department,
      branchId: matched.branchId,
      lastTab: matched.lastTab,
    };
  }

  return {
    email: payload.email,
    role: 'staff',
    name: payload.name ?? payload.email,
    department: payload.department ?? 'operations',
    branchId: payload.branchId,
  };
}

export function updateUserPreferences(
  email: string,
  role: AuthRole,
  updates: { lastTab?: string; branchId?: string }
): { lastTab?: string; branchId?: string } {
  const cleanTab =
    typeof updates.lastTab === 'string' && updates.lastTab.trim()
      ? updates.lastTab.trim().slice(0, 40)
      : undefined;
  const cleanBranch =
    typeof updates.branchId === 'string' && updates.branchId.trim()
      ? updates.branchId.trim().slice(0, 60)
      : undefined;

  if (role === 'executive') {
    const record = readExecutiveAuthRecord();
    if (record) {
      const next: ExecutiveAuthRecord = {
        ...record,
        lastTab: cleanTab ?? record.lastTab,
      };
      atomicWriteJson(getExecutiveAuthFilePath(), next);
      return { lastTab: next.lastTab };
    }
    return { lastTab: cleanTab };
  }

  const users = readStaffUsers();
  const idx = users.findIndex((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  if (idx !== -1) {
    const current = users[idx];
    const next: StaffUserRecord = {
      ...current,
      lastTab: cleanTab ?? current.lastTab,
      branchId: cleanBranch ?? current.branchId,
    };
    users[idx] = next;
    atomicWriteJson(getStaffUsersFilePath(), users);
    return { lastTab: next.lastTab, branchId: next.branchId };
  }
  return { lastTab: cleanTab, branchId: cleanBranch };
}

// === TOKEN ISSUANCE & VERIFICATION (NON-EXPIRING UNTIL LOGOUT) ===

export function issueAuthToken(input: {
  email: string;
  role: AuthRole;
  department?: StaffDepartment;
  branchId?: string;
  name?: string;
}): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: TokenPayload = {
    email: input.email,
    role: input.role,
    department: input.department,
    branchId: input.branchId,
    name: input.name,
    iat: now,
    exp: now + NON_EXPIRING_SESSION_SECONDS,
    noExpiry: true,
  };
  const encoded = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = crypto
    .createHmac('sha256', getSessionSecret())
    .update(encoded)
    .digest('base64url');
  return `${encoded}.${sig}`;
}

export function issueStaffToken(email: string): string {
  return issueAuthToken({ email, role: 'staff', department: 'operations' });
}

export function verifySessionToken(rawToken?: string | null): TokenPayload | null {
  if (!rawToken) return null;
  const token = rawToken.trim();
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [encoded, sig] = parts;
  if (!encoded || !sig) return null;

  const expectedSig = crypto
    .createHmac('sha256', getSessionSecret())
    .update(encoded)
    .digest('base64url');

  if (!safeEqualStrings(sig, expectedSig)) return null;

  try {
    const raw = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as Partial<TokenPayload>;
    const now = Math.floor(Date.now() / 1000);
    if (!raw.email) {
      return null;
    }
    if (!raw.noExpiry && (typeof raw.exp !== 'number' || raw.exp < now)) {
      return null;
    }
    const role: AuthRole = raw.role === 'executive' ? 'executive' : 'staff';
    return {
      email: raw.email,
      role,
      department: raw.department,
      branchId: raw.branchId,
      name: raw.name,
      iat: typeof raw.iat === 'number' ? raw.iat : now,
      exp: typeof raw.exp === 'number' ? raw.exp : now + NON_EXPIRING_SESSION_SECONDS,
      noExpiry: raw.noExpiry ?? true,
    };
  } catch {
    return null;
  }
}

export function verifyStaffToken(authHeader?: string | null): TokenPayload | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  return verifySessionToken(authHeader.slice('Bearer '.length));
}

// === SAFE MEDIA UPLOAD & CONFINED SERVING ===

function detectImageExtension(buffer: Buffer): { ext: string; mime: string } | null {
  if (buffer.length < 12) return null;
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return { ext: 'png', mime: 'image/png' };
  }
  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { ext: 'jpg', mime: 'image/jpeg' };
  }
  // GIF: GIF87a / GIF89a
  if (
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x38
  ) {
    return { ext: 'gif', mime: 'image/gif' };
  }
  // WEBP: RIFF....WEBP
  if (
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return { ext: 'webp', mime: 'image/webp' };
  }
  return null;
}

export function saveUploadedImageBuffer(
  buffer: Buffer
): { ok: true; url: string; filename: string } | { ok: false; error: string; status: number } {
  const MAX_BYTES = 6 * 1024 * 1024;
  if (buffer.length === 0) {
    return { ok: false, error: 'Uploaded file is empty.', status: 400 };
  }
  if (buffer.length > MAX_BYTES) {
    return { ok: false, error: 'Image size must be 6MB or smaller.', status: 413 };
  }

  const detected = detectImageExtension(buffer);
  if (!detected) {
    return {
      ok: false,
      error: 'Unsupported file format. Please upload a valid PNG, JPG, WEBP, or GIF image.',
      status: 400,
    };
  }

  const uploadsDir = getUploadsDir();
  const filename = `${crypto.randomUUID()}.${detected.ext}`;
  const targetPath = path.resolve(uploadsDir, filename);
  if (!targetPath.startsWith(uploadsDir + path.sep)) {
    return { ok: false, error: 'Invalid upload destination.', status: 400 };
  }

  fs.writeFileSync(targetPath, buffer, { mode: 0o644 });
  return {
    ok: true,
    url: `/api/media/${filename}`,
    filename,
  };
}

export function readUploadedMediaFile(
  filename: string
): { buffer: Buffer; mime: string } | null {
  if (!/^[a-f0-9-]+\.(png|jpg|jpeg|webp|gif)$/i.test(filename)) {
    return null;
  }
  const uploadsDir = getUploadsDir();
  const targetPath = path.resolve(uploadsDir, filename);
  if (!targetPath.startsWith(uploadsDir + path.sep)) {
    return null;
  }
  if (!fs.existsSync(targetPath)) {
    return null;
  }

  const ext = path.extname(filename).toLowerCase();
  const mime =
    ext === '.png'
      ? 'image/png'
      : ext === '.webp'
        ? 'image/webp'
        : ext === '.gif'
          ? 'image/gif'
          : 'image/jpeg';

  return {
    buffer: fs.readFileSync(targetPath),
    mime,
  };
}
