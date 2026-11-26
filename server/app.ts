import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import express, { type Request, type Response } from 'express';
import multer from 'multer';
import type { BlordSiteContent, StaffDepartment } from '../lib/blord-types';
import {
  buildGoogleMapsDirectionsUrl,
  enforceStaffWriteScope,
  formatNaira,
  validateContentUpdate,
  validateInquiryInput,
  validateNewsletterEmail,
} from '../lib/blord-utils';
import {
  addContactInquiry,
  addNewsletterSubscriber,
  authenticateExecutive,
  authenticateStaff,
  changeExecutivePassword,
  changeStaffMemberPassword,
  claimExecutiveAdmin,
  claimStaffMemberAccount,
  createStaffAccount,
  deleteStaffAccount,
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
  type TokenPayload,
  updateStaffAccountRole,
  updateUserPreferences,
  verifySessionToken,
  verifyStaffToken,
} from '../lib/server-store';

const SESSION_COOKIE_NAME = 'blord_session';
const SESSION_COOKIE_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 400; // 400 days (browser maximum, refreshed on use)

function parseCookieHeader(header: string | undefined): Record<string, string> {
  const result: Record<string, string> = {};
  if (!header) return result;
  for (const part of header.split(';')) {
    const eqIdx = part.indexOf('=');
    if (eqIdx === -1) continue;
    const key = part.slice(0, eqIdx).trim();
    const val = part.slice(eqIdx + 1).trim();
    if (key) {
      try {
        result[key] = decodeURIComponent(val);
      } catch {
        result[key] = val;
      }
    }
  }
  return result;
}

function isHttpsRequest(req: Request): boolean {
  const xfProto = req.headers['x-forwarded-proto'];
  const protoStr = Array.isArray(xfProto) ? xfProto[0] : xfProto;
  return Boolean(req.secure || (protoStr && protoStr.toLowerCase().includes('https')));
}

function setSessionCookie(req: Request, res: Response, token: string): void {
  const https = isHttpsRequest(req);
  if (https) {
    res.cookie(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'none',
      secure: true,
      partitioned: true,
      path: '/',
      maxAge: SESSION_COOKIE_MAX_AGE_MS,
    } as express.CookieOptions);
  } else {
    res.cookie(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      path: '/',
      maxAge: SESSION_COOKIE_MAX_AGE_MS,
    });
  }
}

function clearSessionCookie(req: Request, res: Response): void {
  const https = isHttpsRequest(req);
  res.clearCookie(SESSION_COOKIE_NAME, {
    httpOnly: true,
    sameSite: https ? 'none' : 'lax',
    secure: https,
    partitioned: https,
    path: '/',
  } as express.CookieOptions);
}

function hasValidCsrfGuard(req: Request): boolean {
  const xrw = req.headers['x-requested-with'];
  if (typeof xrw === 'string' && xrw.toLowerCase() === 'xmlhttprequest') {
    return true;
  }
  const host =
    (typeof req.headers['x-forwarded-host'] === 'string' && req.headers['x-forwarded-host']) ||
    req.headers.host;
  const origin = req.headers.origin;
  if (origin && host) {
    try {
      const originHost = new URL(origin).host;
      return originHost.toLowerCase() === host.toLowerCase();
    } catch {
      return false;
    }
  }
  return false;
}

function authenticateRequest(req: Request, requireCsrfOnMutation = false): TokenPayload | null {
  const bearerPayload = verifyStaffToken(req.headers.authorization);
  if (bearerPayload) {
    return bearerPayload;
  }
  const cookies = parseCookieHeader(req.headers.cookie);
  const cookieToken = cookies[SESSION_COOKIE_NAME];
  if (!cookieToken) {
    return null;
  }
  const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method.toUpperCase());
  if (requireCsrfOnMutation && isMutation && !hasValidCsrfGuard(req)) {
    return null;
  }
  return verifySessionToken(cookieToken);
}

interface ChatTurn {
  role: 'user' | 'assistant';
  text: string;
}

function buildBlordSystemPrompt(currentPath: string): string {
  const { content } = getSiteContent();

  const carsSummary = (content.cars ?? [])
    .map(
      (car) =>
        `- ${car.name} (${car.category}): Price ${formatNaira(car.priceNgn)} | Size/Dimensions: ${car.sizeClass} | Battery: ${car.batteryCapacity} | Range: ${car.rangeKm} | Status: ${car.status} | Highlights: ${car.highlights.join(', ')}`
    )
    .join('\n');

  const tanksSummary = (content.powerTanks ?? [])
    .map(
      (tank) =>
        `- ${tank.name}: Capacity ${tank.capacityWatt} (${tank.storageSpec}) | Size: ${tank.sizeDimensions} | Price ${formatNaira(tank.priceNgn)} | Status: ${tank.status} | Supports: ${tank.appliances}`
    )
    .join('\n');

  const productsSummary = content.products
    .map(
      (p) =>
        `- ${p.name} (${p.category}${p.priceLabel ? ` · Price: ${p.priceLabel}` : ''}): ${p.tagline} ${p.description} Links: ${
          [p.links.webAppUrl, p.links.websiteUrl, p.links.appStoreUrl, p.links.playStoreUrl]
            .filter(Boolean)
            .join(', ') || 'Direct inquiry via Contact Us'
        }`
    )
    .join('\n');

  const branchesSummary = content.contact.branches
    .map(
      (b) =>
        `- ${b.name} (${b.region}): ${b.address} | Landmark: ${b.landmarkHint} | Phone: ${b.phone} | Email: ${b.email} | Directions: ${buildGoogleMapsDirectionsUrl(b)}`
    )
    .join('\n');

  const teamSummary = content.about.boardMembers
    .map(
      (m) =>
        `- ${m.name} — ${m.role}${m.email ? ` | ${m.email}` : ''}${m.phone ? ` | ${m.phone}` : ''}`
    )
    .join('\n');

  return `You are Blord AI, the official intelligent digital concierge for ${content.brandName} (founded 2019 by Chief Linus Williams Ifejirika, "Blord").
Current visitor page route: ${currentPath || '/'}

Answer every customer question clearly, warmly, concisely, and accurately using ONLY verified Blord Group company data below (and general automotive/solar/fintech expertise where helpful). When quoting prices, use the exact live Naira prices below and note that B Cars & China Procurement also accept Naira, USDT, or BTC. Never fabricate branch addresses, fake phone numbers, or imaginary staff. Keep answers well-structured with short bullet points when comparing models or prices.

=== BLORD GROUP OVERVIEW ===
Tagline: ${content.tagline}
Hero: ${content.heroTitle} — ${content.heroSubtitle}
Scale Metrics: ${content.heroStats.map((s) => `${s.value} ${s.label}`).join('; ')}; ${content.trustMetrics.map((m) => `${m.value} ${m.label}`).join('; ')}
Support Helpline: ${content.contact.supportPhone} | Support Email: ${content.contact.supportEmail} | China Procurement: ${content.contact.procurementEmail}

=== BLORD CARS (B CARS ELECTRIC & CHINA IMPORT FLEET — /cars) ===
${carsSummary}

=== BLORD POWER TANKS & BLUNT SOLAR GENERATORS (/power-tank) ===
${tanksSummary}

=== CORE SUBSIDIARY PRODUCTS ===
${productsSummary}

=== GLOBAL CHINA PROCUREMENT STEPS ===
${content.chinaSteps.map((s) => `${s.step}. ${s.title}: ${s.description}`).join('\n')}

=== ALL 10 OFFICIAL OFFICES & GOOGLE MAPS DIRECTIONS (/contact-us) ===
${branchesSummary}

=== LEADERSHIP & 16-MEMBER BOARD (/about-us) ===
${teamSummary}

If someone asks how to visit an office, provide the exact branch address, landmark, phone number, and Google Maps link. If someone asks how prices, product launches, or photos are updated, explain that the authorized Executive Admin signs in at /executive-admin to update vehicle/tank prices, upload photos, launch new products, manage staff roles, and change passwords, while department staff sign in at /admin according to their assigned operational role.`;
}

const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 6 * 1024 * 1024 },
});

export function createApiRouter(): express.Router {
  const api = express.Router();
  api.use(express.json({ limit: '4mb' }));

  // CMS Read / Write / Reset
  api.get('/cms', (_req: Request, res: Response) => {
    res.json(getSiteContent());
  });

  api.put('/cms', (req: Request, res: Response) => {
    const staff = authenticateRequest(req, true);
    if (!staff) {
      res.status(401).json({ error: 'Unauthorized session.' });
      return;
    }

    const body = req.body as { content?: unknown } | undefined;
    const candidate = body?.content ?? body;
    const check = validateContentUpdate(candidate);
    if (!check.valid) {
      res.status(400).json({ error: check.error });
      return;
    }

    const current = getSiteContent();
    const scoped = enforceStaffWriteScope(
      staff.role,
      staff.department,
      current.content,
      candidate as BlordSiteContent
    );
    if (!scoped.ok) {
      res.status(403).json({ error: scoped.error });
      return;
    }

    const saved = saveSiteContent(scoped.content);
    res.json({
      ...saved,
      updatedBy: staff.email,
      updatedRole: staff.role,
    });
  });

  api.post('/cms/reset', (req: Request, res: Response) => {
    const staff = authenticateRequest(req, true);
    if (!staff || staff.role !== 'executive') {
      res.status(403).json({ error: 'Only Executive Admin can restore factory defaults.' });
      return;
    }
    const reset = resetSiteContent();
    res.json({ ...reset, resetBy: staff.email });
  });

  // Contact & Inquiries
  api.post('/contact', (req: Request, res: Response) => {
    const body = (req.body ?? {}) as Record<string, unknown>;
    if (body.type === 'newsletter') {
      const email = typeof body.email === 'string' ? body.email : '';
      const check = validateNewsletterEmail(email);
      if (!check.valid) {
        res.status(400).json({ error: check.error });
        return;
      }
      const result = addNewsletterSubscriber(email);
      res.status(201).json({ ok: true, ...result });
      return;
    }

    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const phone = typeof body.phone === 'string' ? body.phone.trim() : undefined;
    const branchId = typeof body.branchId === 'string' ? body.branchId.trim() : undefined;
    const subject = typeof body.subject === 'string' ? body.subject.trim() : '';
    const message = typeof body.message === 'string' ? body.message.trim() : '';

    const check = validateInquiryInput({ name, email, subject, message });
    if (!check.valid) {
      res.status(400).json({ error: check.error });
      return;
    }

    const record = addContactInquiry({ name, email, phone, branchId, subject, message });
    res.status(201).json({ ok: true, inquiry: record });
  });

  api.get('/inquiries', (req: Request, res: Response) => {
    const staff = authenticateRequest(req, false);
    if (!staff) {
      res.status(401).json({ error: 'Unauthorized staff session.' });
      return;
    }
    res.json(getStaffInbox());
  });

  // Persistent Session Hydrate, Logout, Preferences & Staff Directory
  api.get('/auth/session', (req: Request, res: Response) => {
    const payload = authenticateRequest(req, false);
    if (!payload) {
      res.json({ authenticated: false });
      return;
    }
    const profile = getSessionUserProfile(payload);
    if (!profile) {
      clearSessionCookie(req, res);
      res.json({ authenticated: false });
      return;
    }
    res.json({
      authenticated: true,
      email: profile.email,
      role: profile.role,
      name: profile.name,
      department: profile.department,
      branchId: profile.branchId,
      lastTab: profile.lastTab,
    });
  });

  api.post('/auth/logout', (req: Request, res: Response) => {
    clearSessionCookie(req, res);
    res.json({ ok: true });
  });

  api.post('/auth/preferences', (req: Request, res: Response) => {
    const session = authenticateRequest(req, true);
    if (!session) {
      res.status(401).json({ error: 'Sign-in is required to save workspace state.' });
      return;
    }
    const body = (req.body ?? {}) as { lastTab?: string; branchId?: string };
    const updated = updateUserPreferences(session.email, session.role, {
      lastTab: typeof body.lastTab === 'string' ? body.lastTab : undefined,
      branchId: typeof body.branchId === 'string' ? body.branchId : undefined,
    });
    res.json({ ok: true, ...updated });
  });

  api.get('/auth/directory', (req: Request, res: Response) => {
    const session = authenticateRequest(req, false);
    if (!session) {
      res.status(401).json({ error: 'Unauthorized staff session.' });
      return;
    }
    res.json({ staff: listStaffAccounts() });
  });

  // Staff Portal Auth
  api.get('/auth/status', (_req: Request, res: Response) => {
    res.json(getAuthMode());
  });

  api.post('/auth/claim', (req: Request, res: Response) => {
    const body = (req.body ?? {}) as {
      email?: string;
      password?: string;
      name?: string;
      department?: StaffDepartment;
      branchId?: string;
      title?: string;
    };
    const result = claimStaffMemberAccount({
      email: typeof body.email === 'string' ? body.email : '',
      password: typeof body.password === 'string' ? body.password : '',
      name: typeof body.name === 'string' ? body.name : '',
      department: (body.department ?? 'sales') as StaffDepartment,
      branchId: typeof body.branchId === 'string' ? body.branchId : 'awka-hq',
      title: typeof body.title === 'string' ? body.title : undefined,
    });
    if (!result.ok) {
      res.status(result.status).json({ error: result.error });
      return;
    }
    setSessionCookie(req, res, result.token);
    res.status(201).json({
      token: result.token,
      email: result.email,
      name: result.name,
      department: result.department,
      branchId: result.branchId,
      role: result.role,
      lastTab: result.lastTab,
    });
  });

  api.post('/auth/login', (req: Request, res: Response) => {
    const body = (req.body ?? {}) as { email?: string; password?: string };
    const result = authenticateStaff(
      typeof body.email === 'string' ? body.email : '',
      typeof body.password === 'string' ? body.password : ''
    );
    if (!result.ok) {
      res.status(result.status).json({ error: result.error });
      return;
    }
    setSessionCookie(req, res, result.token);
    res.json({
      token: result.token,
      email: result.email,
      name: result.name,
      department: result.department,
      branchId: result.branchId,
      lastTab: result.lastTab,
      role: result.role,
    });
  });

  api.get('/auth/me', (req: Request, res: Response) => {
    const payload = authenticateRequest(req, false);
    if (!payload) {
      res.status(401).json({ authenticated: false });
      return;
    }
    const profile = getSessionUserProfile(payload);
    if (!profile) {
      res.status(401).json({ authenticated: false });
      return;
    }
    res.json({
      authenticated: true,
      email: profile.email,
      role: profile.role,
      department: profile.department,
      branchId: profile.branchId,
      lastTab: profile.lastTab,
      name: profile.name,
      exp: payload.exp,
    });
  });

  api.post('/auth/password', (req: Request, res: Response) => {
    const session = authenticateRequest(req, true);
    if (!session) {
      res.status(401).json({ error: 'Staff sign-in is required.' });
      return;
    }
    const body = (req.body ?? {}) as { currentPassword?: string; newPassword?: string };
    const result = changeStaffMemberPassword(
      session.email,
      typeof body.currentPassword === 'string' ? body.currentPassword : '',
      typeof body.newPassword === 'string' ? body.newPassword : ''
    );
    if (!result.ok) {
      res.status(result.status).json({ error: result.error });
      return;
    }
    setSessionCookie(req, res, result.token);
    res.json({ token: result.token, email: result.email });
  });

  // Executive Admin Auth & Staff Directory
  api.get('/executive/status', (_req: Request, res: Response) => {
    res.json(getExecutiveAuthMode());
  });

  api.post('/executive/claim', (req: Request, res: Response) => {
    const body = (req.body ?? {}) as { email?: string; password?: string; name?: string };
    const result = claimExecutiveAdmin(
      typeof body.email === 'string' ? body.email : '',
      typeof body.password === 'string' ? body.password : '',
      typeof body.name === 'string' ? body.name : undefined
    );
    if (!result.ok) {
      res.status(result.status).json({ error: result.error });
      return;
    }
    setSessionCookie(req, res, result.token);
    res.status(201).json({
      token: result.token,
      email: result.email,
      name: result.name,
      role: result.role,
      lastTab: result.lastTab,
    });
  });

  api.post('/executive/login', (req: Request, res: Response) => {
    const body = (req.body ?? {}) as { email?: string; password?: string };
    const result = authenticateExecutive(
      typeof body.email === 'string' ? body.email : '',
      typeof body.password === 'string' ? body.password : ''
    );
    if (!result.ok) {
      res.status(result.status).json({ error: result.error });
      return;
    }
    setSessionCookie(req, res, result.token);
    res.json({
      token: result.token,
      email: result.email,
      name: result.name,
      role: result.role,
      lastTab: result.lastTab,
    });
  });

  api.post('/executive/password', (req: Request, res: Response) => {
    const session = authenticateRequest(req, true);
    if (!session || session.role !== 'executive') {
      res
        .status(401)
        .json({ error: 'Executive Admin sign-in is required to change this password.' });
      return;
    }
    const body = (req.body ?? {}) as { currentPassword?: string; newPassword?: string };
    const result = changeExecutivePassword(
      typeof body.currentPassword === 'string' ? body.currentPassword : '',
      typeof body.newPassword === 'string' ? body.newPassword : ''
    );
    if (!result.ok) {
      res.status(result.status).json({ error: result.error });
      return;
    }
    setSessionCookie(req, res, result.token);
    res.json({
      token: result.token,
      email: result.email,
      name: result.name,
      updatedAt: result.updatedAt,
    });
  });

  api.get('/executive/staff', (req: Request, res: Response) => {
    const session = authenticateRequest(req, false);
    if (!session || session.role !== 'executive') {
      res.status(401).json({ error: 'Executive Admin access required.' });
      return;
    }
    res.json({ staff: listStaffAccounts() });
  });

  api.post('/executive/staff', (req: Request, res: Response) => {
    const session = authenticateRequest(req, true);
    if (!session || session.role !== 'executive') {
      res.status(401).json({ error: 'Executive Admin access required.' });
      return;
    }
    const body = (req.body ?? {}) as {
      name?: string;
      email?: string;
      password?: string;
      department?: StaffDepartment;
      branchId?: string;
      title?: string;
    };
    const result = createStaffAccount({
      name: typeof body.name === 'string' ? body.name : '',
      email: typeof body.email === 'string' ? body.email : '',
      password: typeof body.password === 'string' ? body.password : '',
      department: (body.department ?? 'operations') as StaffDepartment,
      branchId: typeof body.branchId === 'string' ? body.branchId : 'awka-hq',
      title: typeof body.title === 'string' ? body.title : undefined,
    });
    if (!result.ok) {
      res.status(result.status).json({ error: result.error });
      return;
    }
    res.status(201).json({ staff: result.staff });
  });

  api.patch('/executive/staff', (req: Request, res: Response) => {
    const session = authenticateRequest(req, true);
    if (!session || session.role !== 'executive') {
      res.status(401).json({ error: 'Executive Admin access required.' });
      return;
    }
    const body = (req.body ?? {}) as {
      id?: string;
      department?: StaffDepartment;
      branchId?: string;
      title?: string;
      active?: boolean;
      newPassword?: string;
    };
    const id = typeof body.id === 'string' ? body.id : '';
    if (!id) {
      res.status(400).json({ error: 'Staff account id is required.' });
      return;
    }
    const result = updateStaffAccountRole(id, {
      department: body.department,
      branchId: typeof body.branchId === 'string' ? body.branchId : undefined,
      title: body.title,
      active: body.active,
      newPassword: body.newPassword,
    });
    if (!result.ok) {
      res.status(result.status).json({ error: result.error });
      return;
    }
    res.json({ staff: result.staff });
  });

  api.delete('/executive/staff', (req: Request, res: Response) => {
    const session = authenticateRequest(req, true);
    if (!session || session.role !== 'executive') {
      res.status(401).json({ error: 'Executive Admin access required.' });
      return;
    }
    const body = (req.body ?? {}) as { id?: string };
    const id = typeof body.id === 'string' ? body.id : '';
    if (!id) {
      res.status(400).json({ error: 'Staff account id is required.' });
      return;
    }
    const result = deleteStaffAccount(id);
    if (!result.ok) {
      res.status(result.status).json({ error: result.error });
      return;
    }
    res.json({ deleted: true });
  });

  // Safe Image Upload & Serving
  api.post('/upload', (req: Request, res: Response) => {
    const session = authenticateRequest(req, true);
    if (!session || session.role !== 'executive') {
      res.status(401).json({
        error: 'Only authorized Executive Admin users can upload new product or vehicle photos.',
      });
      return;
    }

    uploadMiddleware.single('file')(req, res, (err: unknown) => {
      if (err) {
        res.status(413).json({
          error: err instanceof Error ? err.message : 'Uploaded image exceeds 6MB limit.',
        });
        return;
      }
      if (!req.file?.buffer) {
        res.status(400).json({ error: 'No image file provided.' });
        return;
      }
      const saved = saveUploadedImageBuffer(req.file.buffer);
      if (!saved.ok) {
        res.status(saved.status).json({ error: saved.error });
        return;
      }
      res.status(201).json({ url: saved.url, filename: saved.filename });
    });
  });

  api.get('/media/:filename', (req: Request, res: Response) => {
    const filename = Array.isArray(req.params.filename)
      ? req.params.filename[0]
      : req.params.filename;
    const media = readUploadedMediaFile(filename);
    if (!media) {
      res.status(404).json({ error: 'Image not found.' });
      return;
    }
    res.setHeader('Content-Type', media.mime);
    res.setHeader('Content-Length', String(media.buffer.length));
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.status(200).send(media.buffer);
  });

  // Blord AI Concierge Chat (Server-side Gemini)
  api.post('/chat', async (req: Request, res: Response) => {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      res.status(503).json({
        error:
          'Blord AI service is missing GEMINI_API_KEY configuration. Please add GEMINI_API_KEY in Settings > Secrets.',
      });
      return;
    }

    const body = (req.body ?? {}) as {
      message?: string;
      history?: ChatTurn[];
      currentPath?: string;
    };
    const userMessage = (body.message ?? '').trim();
    if (!userMessage) {
      res.status(400).json({ error: 'Message cannot be empty.' });
      return;
    }

    const history = Array.isArray(body.history) ? body.history.slice(-10) : [];
    const currentPath = typeof body.currentPath === 'string' ? body.currentPath : '/';

    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const contents = [
        ...history
          .filter((h) => h && typeof h.text === 'string' && h.text.trim())
          .map((h) => ({
            role: h.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: h.text.trim() }],
          })),
        {
          role: 'user',
          parts: [{ text: userMessage }],
        },
      ];

      const modelsToTry: Array<{ model: string; level?: ThinkingLevel; waitMs: number }> = [
        { model: 'gemini-3.8-flash', waitMs: 500 },
        { model: 'gemini-3.1-flash-lite', waitMs: 700 },
        { model: 'gemini-4-hydrogen', level: ThinkingLevel.LOW, waitMs: 900 },
        { model: 'gemini-3.8-flash', waitMs: 0 },
      ];

      let replyText = '';
      let lastError: unknown = null;

      for (let i = 0; i < modelsToTry.length; i += 1) {
        const candidate = modelsToTry[i];
        try {
          const config: {
            systemInstruction: string;
            thinkingConfig?: { thinkingLevel: ThinkingLevel };
          } = {
            systemInstruction: buildBlordSystemPrompt(currentPath),
          };
          if (candidate.level) {
            config.thinkingConfig = { thinkingLevel: candidate.level };
          }
          const response = await ai.models.generateContent({
            model: candidate.model,
            contents,
            config,
          });
          const text = response.text?.trim();
          if (text) {
            replyText = text;
            break;
          }
        } catch (err) {
          lastError = err;
          const rawMsg = err instanceof Error ? err.message : String(err);
          console.error(`[Blord AI] Attempt ${i + 1} (${candidate.model}) failed:`, rawMsg);
          const isTransient =
            rawMsg.includes('503') ||
            rawMsg.includes('UNAVAILABLE') ||
            rawMsg.includes('429') ||
            rawMsg.includes('RESOURCE_EXHAUSTED') ||
            rawMsg.includes('404') ||
            rawMsg.includes('NOT_FOUND') ||
            rawMsg.includes('500') ||
            rawMsg.includes('INTERNAL');
          if (!isTransient || i === modelsToTry.length - 1) {
            throw err;
          }
          if (candidate.waitMs > 0) {
            await new Promise((r) => setTimeout(r, candidate.waitMs));
          }
        }
      }

      if (!replyText) {
        throw lastError instanceof Error
          ? lastError
          : new Error('The assistant returned an empty response. Please try again.');
      }

      res.json({ reply: replyText });
    } catch (err) {
      const raw = err instanceof Error ? err.message : 'Unable to reach Gemini API.';
      let friendly = 'Unable to reach Blord AI right now. Please try again in a moment.';
      let status = 502;

      if (raw.includes('429') || raw.includes('RESOURCE_EXHAUSTED') || raw.includes('quota')) {
        friendly =
          'Blord AI free-tier quota limit reached for now. You can add a billing-enabled key in Settings > Secrets or retry shortly.';
        status = 429;
      } else if (raw.includes('503') || raw.includes('UNAVAILABLE')) {
        friendly = 'AI servers are briefly busy right now. Please tap Retry in a moment.';
        status = 503;
      } else if (raw.includes('API_KEY_INVALID') || raw.includes('PERMISSION_DENIED')) {
        friendly = 'Invalid or missing Gemini API key. Check Settings > Secrets.';
        status = 403;
      }
      res.status(status).json({ error: friendly });
    }
  });

  return api;
}
