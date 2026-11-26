import type {
  AuthRole,
  BlordSiteContent,
  BoardMember,
  BranchLocation,
  StaffDepartment,
} from './blord-types';

export function buildGoogleMapsDirectionsUrl(branch: Pick<BranchLocation, 'mapQuery' | 'address' | 'region'>): string {
  const destination = (branch.mapQuery || `${branch.address}, ${branch.region}`).trim();
  const params = new URLSearchParams({
    api: '1',
    destination,
    travelmode: 'driving',
  });
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

export function buildGoogleMapsSearchUrl(branch: Pick<BranchLocation, 'mapQuery' | 'address' | 'region'>): string {
  const query = (branch.mapQuery || `${branch.address}, ${branch.region}`).trim();
  const params = new URLSearchParams({
    api: '1',
    query,
  });
  return `https://www.google.com/maps/search/?${params.toString()}`;
}

export function buildGoogleMapsEmbedUrl(branch: Pick<BranchLocation, 'mapQuery' | 'address' | 'region'>): string {
  const q = (branch.mapQuery || `${branch.address}, ${branch.region}`).trim();
  const params = new URLSearchParams({
    q,
    t: '',
    z: '16',
    ie: 'UTF8',
    iwloc: '',
    output: 'embed',
  });
  return `https://maps.google.com/maps?${params.toString()}`;
}

export function formatPhoneHref(phone: string): string {
  const cleaned = phone.replace(/[^\d+]/g, '');
  return `tel:${cleaned}`;
}

export function isSafeHttpOrRelativeUrl(url: string | undefined): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  if (trimmed.startsWith('/')) return !trimmed.startsWith('//');
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export function filterBranches(branches: BranchLocation[], query: string): BranchLocation[] {
  const q = query.trim().toLowerCase();
  if (!q) return branches;
  return branches.filter(
    (b) =>
      b.name.toLowerCase().includes(q) ||
      b.region.toLowerCase().includes(q) ||
      b.address.toLowerCase().includes(q) ||
      b.landmarkHint.toLowerCase().includes(q)
  );
}

export function filterBoardMembers(members: BoardMember[], query: string): BoardMember[] {
  const q = query.trim().toLowerCase();
  if (!q) return members;
  return members.filter(
    (m) =>
      m.name.toLowerCase().includes(q) ||
      m.role.toLowerCase().includes(q) ||
      (m.email && m.email.toLowerCase().includes(q))
  );
}

export function formatNaira(amount: number): string {
  if (!Number.isFinite(amount)) return '₦0';
  return `₦${Math.round(amount).toLocaleString('en-NG')}`;
}

export function slugifyProductName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

export function getStaffRoleLabel(department: StaffDepartment): string {
  switch (department) {
    case 'sales':
      return 'Sales Department';
    case 'marketing':
      return 'Marketing & Growth';
    case 'ict-tech':
      return 'ICT & Tech Department';
    case 'maintenance':
      return 'Maintenance & Technical Support';
    case 'operations':
      return 'Operations Manager';
    case 'inventory':
      return 'Fleet & Energy Stock Coordinator';
    case 'branches':
      return 'Branch & Logistics Coordinator';
    case 'inbox':
      return 'Customer Relations & Support';
    case 'editorial':
      return 'Corporate Media & Board Directory';
  }
}

export type StaffWorkspaceTab =
  | 'home'
  | 'products'
  | 'cars'
  | 'tanks'
  | 'team'
  | 'branches'
  | 'inbox'
  | 'directory';

export function getStaffAllowedSections(department: StaffDepartment): StaffWorkspaceTab[] {
  switch (department) {
    case 'sales':
      return ['inbox', 'cars', 'tanks', 'products', 'branches', 'directory'];
    case 'marketing':
      return ['home', 'products', 'team', 'inbox', 'directory'];
    case 'ict-tech':
      return ['branches', 'products', 'cars', 'tanks', 'directory'];
    case 'maintenance':
      return ['tanks', 'cars', 'branches', 'directory'];
    case 'operations':
      return ['home', 'products', 'cars', 'tanks', 'team', 'branches', 'inbox', 'directory'];
    case 'inventory':
      return ['cars', 'tanks', 'products', 'directory'];
    case 'branches':
      return ['branches', 'inbox', 'directory'];
    case 'inbox':
      return ['inbox', 'branches', 'directory'];
    case 'editorial':
      return ['home', 'team', 'directory'];
  }
}

/**
 * Enforces Executive vs Staff role permissions server-side before saving CMS changes.
 * Only `executive` role can change prices, upload/swap item photos, or add/remove catalog items.
 */
export function enforceStaffWriteScope(
  role: AuthRole,
  department: StaffDepartment | undefined,
  existing: BlordSiteContent,
  candidate: BlordSiteContent
): { ok: true; content: BlordSiteContent } | { ok: false; error: string } {
  if (role === 'executive') {
    return { ok: true, content: candidate };
  }

  const dept = department ?? 'operations';
  const merged: BlordSiteContent = structuredClone(existing);

  const canEditHomeAndTeam =
    dept === 'operations' || dept === 'editorial' || dept === 'marketing';
  const canEditBranches =
    dept === 'operations' ||
    dept === 'branches' ||
    dept === 'ict-tech' ||
    dept === 'maintenance' ||
    dept === 'sales';
  const canEditCatalogCopy =
    dept === 'operations' ||
    dept === 'inventory' ||
    dept === 'sales' ||
    dept === 'ict-tech' ||
    dept === 'maintenance' ||
    dept === 'marketing';

  if (canEditHomeAndTeam) {
    merged.brandName = candidate.brandName;
    merged.tagline = candidate.tagline;
    merged.heroTitle = candidate.heroTitle;
    merged.heroSubtitle = candidate.heroSubtitle;
    merged.innovationHeadline = candidate.innovationHeadline;
    merged.trustHeadline = candidate.trustHeadline;
    merged.heroStats = candidate.heroStats;
    merged.trustMetrics = candidate.trustMetrics;
    merged.about = candidate.about;
  }

  if (canEditBranches) {
    merged.contact = candidate.contact;
  }

  if (canEditCatalogCopy) {
    // Staff can update stock status and descriptions on existing vehicles/tanks/products,
    // NEVER prices, item images, or adding/deleting catalog entries.
    if (
      candidate.cars.length !== existing.cars.length ||
      candidate.powerTanks.length !== existing.powerTanks.length ||
      candidate.products.length !== existing.products.length
    ) {
      return {
        ok: false,
        error:
          'Adding or removing products, vehicles, or power tanks requires Executive Admin access (/executive-admin).',
      };
    }

    for (let i = 0; i < existing.cars.length; i += 1) {
      const prev = existing.cars[i];
      const next = candidate.cars[i];
      if (!next || prev.priceNgn !== next.priceNgn || prev.image !== next.image) {
        return {
          ok: false,
          error:
            'Modifying vehicle prices or photos is restricted to Executive Admin access (/executive-admin).',
        };
      }
    }

    for (let i = 0; i < existing.powerTanks.length; i += 1) {
      const prev = existing.powerTanks[i];
      const next = candidate.powerTanks[i];
      if (!next || prev.priceNgn !== next.priceNgn || prev.image !== next.image) {
        return {
          ok: false,
          error:
            'Modifying power tank prices or photos is restricted to Executive Admin access (/executive-admin).',
        };
      }
    }

    for (let i = 0; i < existing.products.length; i += 1) {
      const prev = existing.products[i];
      const next = candidate.products[i];
      if (
        !next ||
        (prev.priceLabel ?? '') !== (next.priceLabel ?? '') ||
        prev.logo !== next.logo
      ) {
        return {
          ok: false,
          error:
            'Modifying product pricing or logos is restricted to Executive Admin access (/executive-admin).',
        };
      }
    }

    if (dept !== 'marketing') {
      merged.cars = candidate.cars;
      merged.powerTanks = candidate.powerTanks;
    }
    if (dept !== 'maintenance') {
      merged.products = candidate.products;
    }
  }

  return { ok: true, content: merged };
}

export function validateInquiryInput(input: {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
}): { valid: boolean; error?: string } {
  const name = (input.name ?? '').trim();
  const email = (input.email ?? '').trim();
  const subject = (input.subject ?? '').trim();
  const message = (input.message ?? '').trim();

  if (name.length < 2) {
    return { valid: false, error: 'Please enter your full name (at least 2 characters).' };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { valid: false, error: 'Please enter a valid email address.' };
  }
  if (subject.length < 2) {
    return { valid: false, error: 'Please provide a brief subject.' };
  }
  if (message.length < 10) {
    return { valid: false, error: 'Please enter a message of at least 10 characters.' };
  }
  return { valid: true };
}

export function validateNewsletterEmail(email: string | undefined): { valid: boolean; error?: string } {
  const trimmed = (email ?? '').trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return { valid: false, error: 'Please enter a valid email address to subscribe.' };
  }
  return { valid: true };
}

export function validateContentUpdate(payload: unknown): { valid: boolean; error?: string } {
  if (!payload || typeof payload !== 'object') {
    return { valid: false, error: 'Content payload must be an object.' };
  }
  const c = payload as Partial<BlordSiteContent>;
  if (typeof c.brandName !== 'string' || !c.brandName.trim()) {
    return { valid: false, error: 'Brand name is required.' };
  }
  if (typeof c.heroTitle !== 'string' || !c.heroTitle.trim()) {
    return { valid: false, error: 'Hero title is required.' };
  }
  if (!Array.isArray(c.products) || c.products.length === 0) {
    return { valid: false, error: 'At least one product must be present.' };
  }
  for (const product of c.products) {
    if (!product.name?.trim() || !product.slug?.trim()) {
      return { valid: false, error: 'Every product must include a name and URL slug.' };
    }
  }
  if (Array.isArray(c.cars)) {
    for (const car of c.cars) {
      if (!car.name?.trim() || typeof car.priceNgn !== 'number' || car.priceNgn < 0) {
        return { valid: false, error: 'Every vehicle must include a name and non-negative price.' };
      }
    }
  }
  if (Array.isArray(c.powerTanks)) {
    for (const tank of c.powerTanks) {
      if (!tank.name?.trim() || typeof tank.priceNgn !== 'number' || tank.priceNgn < 0) {
        return { valid: false, error: 'Every power tank must include a name and non-negative price.' };
      }
    }
  }
  if (!c.about || !Array.isArray(c.about.boardMembers) || c.about.boardMembers.length === 0) {
    return { valid: false, error: 'Board members list cannot be empty.' };
  }
  if (!c.contact || !Array.isArray(c.contact.branches) || c.contact.branches.length === 0) {
    return { valid: false, error: 'Branch locations list cannot be empty.' };
  }
  for (const branch of c.contact.branches) {
    if (!branch.name?.trim() || !branch.address?.trim() || !branch.region?.trim()) {
      return { valid: false, error: 'Every branch must include name, region, and address.' };
    }
  }
  return { valid: true };
}
