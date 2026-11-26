import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Car,
  CheckCircle2,
  ExternalLink,
  ImagePlus,
  KeyRound,
  Lock,
  LogIn,
  LogOut,
  MapPin,
  Package,
  Plus,
  RotateCcw,
  Save,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  UserPlus,
  Users,
  Zap,
} from 'lucide-react';
import type {
  BlordSiteContent,
  ProductItem,
  StaffAccountPublic,
  StaffDepartment,
} from '@/lib/blord-types';
import {
  buildGoogleMapsDirectionsUrl,
  formatNaira,
  getStaffRoleLabel,
  slugifyProductName,
} from '@/lib/blord-utils';

type AuthMode = 'unclaimed' | 'claimed' | 'env';
type ExecTab = 'cars' | 'tanks' | 'products' | 'staff' | 'security' | 'site';

const VALID_EXEC_TABS: ExecTab[] = ['cars', 'tanks', 'products', 'staff', 'security', 'site'];

const STAFF_DEPARTMENTS: Array<{ value: StaffDepartment; label: string; scope: string }> = [
  {
    value: 'sales',
    label: 'Sales Department',
    scope: 'Client Inquiries, Vehicle/Power Tank Stock & Branches (No pricing/uploads)',
  },
  {
    value: 'marketing',
    label: 'Marketing & Growth',
    scope: 'Homepage Copy, Product Descriptions, Team & Client Inbox (No pricing/uploads)',
  },
  {
    value: 'ict-tech',
    label: 'ICT & Tech Department',
    scope: 'Branch Maps Coordinates, App Links & Technical Specs (No pricing/uploads)',
  },
  {
    value: 'maintenance',
    label: 'Maintenance & Technical Support',
    scope: 'Power Tanks, Vehicles & Branch Unit Status (No pricing/uploads)',
  },
  {
    value: 'operations',
    label: 'Operations Manager',
    scope: 'Home, Stock Status, Team, Branches & Client Inbox (No pricing/uploads)',
  },
  {
    value: 'inventory',
    label: 'Fleet & Energy Stock Coordinator',
    scope: 'Vehicle, Power Tank & Product descriptions/stock status (No pricing/uploads)',
  },
  {
    value: 'branches',
    label: 'Branch & Logistics Coordinator',
    scope: '10 Global Branches, Maps Coordinates & Client Inbox',
  },
  {
    value: 'inbox',
    label: 'Customer Relations & Support',
    scope: 'Client Inquiries, Newsletter Subscribers & Branch Contact View',
  },
  {
    value: 'editorial',
    label: 'Corporate Media & Board Directory',
    scope: 'Homepage Copy, Metrics, Awards & Leadership Directory',
  },
];

export function ExecutiveAdminView({
  initialAuthMode,
  initialClaimedEmail,
  initialContent,
  initialUpdatedAt,
  onContentChange,
}: {
  initialAuthMode: AuthMode;
  initialClaimedEmail?: string;
  initialContent: BlordSiteContent;
  initialUpdatedAt: string;
  onContentChange?: (nextContent: BlordSiteContent, nextUpdatedAt: string) => void;
}) {
  const [authMode, setAuthMode] = useState<AuthMode>(initialAuthMode);
  const [claimedEmailHint, setClaimedEmailHint] = useState<string | undefined>(initialClaimedEmail);
  const [execAuthView, setExecAuthView] = useState<'create' | 'login'>(
    initialAuthMode === 'unclaimed' ? 'create' : 'login'
  );
  const [sessionChecking, setSessionChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [execEmail, setExecEmail] = useState('');
  const [execName, setExecName] = useState('Chief Executive Admin');

  // Auth gate state
  const [nameInput, setNameInput] = useState('Chief Linus Williams (CEO)');
  const [emailInput, setEmailInput] = useState(initialClaimedEmail ?? '');
  const [passwordInput, setPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [authBusy, setAuthBusy] = useState(false);

  // Workspace state
  const [activeTab, setActiveTab] = useState<ExecTab>('cars');
  const [content, setContent] = useState<BlordSiteContent>(initialContent);
  const [updatedAt, setUpdatedAt] = useState(initialUpdatedAt);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveMessage, setSaveMessage] = useState('');
  const [uploadingTarget, setUploadingTarget] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  // Change Executive Password state
  const [currentExecPw, setCurrentExecPw] = useState('');
  const [newExecPw, setNewExecPw] = useState('');
  const [confirmExecPw, setConfirmExecPw] = useState('');
  const [pwBusy, setPwBusy] = useState(false);

  // New Product creation state
  const [newProdName, setNewProdName] = useState('');
  const [newProdCategory, setNewProdCategory] = useState('Energy & Power Tanks');
  const [newProdPriceLabel, setNewProdPriceLabel] = useState('');
  const [newProdTagline, setNewProdTagline] = useState('');
  const [newProdSummary, setNewProdSummary] = useState('');
  const [newProdDescription, setNewProdDescription] = useState('');
  const [newProdImage, setNewProdImage] = useState('/assets/logo/blunt-logo-s.png');

  // Staff provisioning & directory state
  const [staffList, setStaffList] = useState<StaffAccountPublic[]>([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffPassword, setNewStaffPassword] = useState('');
  const [newStaffDept, setNewStaffDept] = useState<StaffDepartment>('sales');
  const [newStaffBranch, setNewStaffBranch] = useState<string>(
    initialContent.contact.branches[0]?.id ?? 'awka-hq'
  );
  const [newStaffTitle, setNewStaffTitle] = useState('');
  const [resetPwDrafts, setResetPwDrafts] = useState<Record<string, string>>({});

  function buildAuthHeaders(bearerToken?: string | null, includeJson = false): Record<string, string> {
    const headers: Record<string, string> = {
      'X-Requested-With': 'XMLHttpRequest',
    };
    if (includeJson) {
      headers['Content-Type'] = 'application/json';
    }
    if (bearerToken) {
      headers.Authorization = `Bearer ${bearerToken}`;
    }
    return headers;
  }

  async function persistPreferences(lastTab: ExecTab, bearerToken?: string | null) {
    try {
      await fetch('/api/auth/preferences', {
        method: 'POST',
        credentials: 'same-origin',
        headers: buildAuthHeaders(bearerToken ?? token, true),
        body: JSON.stringify({ lastTab }),
      });
    } catch {
      // Non-blocking preference sync
    }
  }

  async function loadStaffDirectory(bearerToken?: string | null) {
    setStaffLoading(true);
    try {
      const res = await fetch('/api/executive/staff', {
        credentials: 'same-origin',
        headers: buildAuthHeaders(bearerToken),
      });
      if (res.ok) {
        const data = await res.json();
        setStaffList(data.staff ?? []);
      }
    } catch {
      // Transient fetch issue
    } finally {
      setStaffLoading(false);
    }
  }

  // Auto-restore persistent Executive session cookie on mount
  useEffect(() => {
    let cancelled = false;
    fetch('/api/auth/session', { credentials: 'same-origin' })
      .then((res) => (res.ok ? res.json() : { authenticated: false }))
      .then((data) => {
        if (!cancelled && data?.authenticated && data.role === 'executive') {
          setIsAuthenticated(true);
          setExecEmail(data.email);
          setExecName(data.name || 'Chief Executive Admin');
          const restoredTab = data.lastTab as ExecTab | undefined;
          if (restoredTab && VALID_EXEC_TABS.includes(restoredTab)) {
            setActiveTab(restoredTab);
          }
          void loadStaffDirectory(null);
        }
      })
      .catch(() => {
        // Ignore network error during session check
      })
      .finally(() => {
        if (!cancelled) {
          setSessionChecking(false);
        }
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleClaimSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAuthError('');
    if (passwordInput !== confirmPasswordInput) {
      setAuthError('Passwords do not match.');
      return;
    }
    setAuthBusy(true);
    try {
      const res = await fetch('/api/executive/claim', {
        method: 'POST',
        credentials: 'same-origin',
        headers: buildAuthHeaders(null, true),
        body: JSON.stringify({
          name: nameInput,
          email: emailInput,
          password: passwordInput,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error ?? 'Unable to create Executive Admin account.');
        return;
      }
      setIsAuthenticated(true);
      setToken(data.token);
      setExecEmail(data.email);
      setExecName(data.name || 'Chief Executive Admin');
      setClaimedEmailHint(data.email);
      setAuthMode('claimed');
      setExecAuthView('login');
      const restoredTab = data.lastTab as ExecTab | undefined;
      if (restoredTab && VALID_EXEC_TABS.includes(restoredTab)) {
        setActiveTab(restoredTab);
      }
      setPasswordInput('');
      setConfirmPasswordInput('');
      await loadStaffDirectory(data.token);
    } catch {
      setAuthError('Network error during Executive Admin setup.');
    } finally {
      setAuthBusy(false);
    }
  }

  async function handleLoginSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAuthError('');
    setAuthBusy(true);
    try {
      const res = await fetch('/api/executive/login', {
        method: 'POST',
        credentials: 'same-origin',
        headers: buildAuthHeaders(null, true),
        body: JSON.stringify({ email: emailInput, password: passwordInput }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error ?? 'Invalid Executive credentials.');
        return;
      }
      setIsAuthenticated(true);
      setToken(data.token);
      setExecEmail(data.email);
      setExecName(data.name || 'Chief Executive Admin');
      const restoredTab = data.lastTab as ExecTab | undefined;
      if (restoredTab && VALID_EXEC_TABS.includes(restoredTab)) {
        setActiveTab(restoredTab);
      }
      setPasswordInput('');
      await loadStaffDirectory(data.token);
    } catch {
      setAuthError('Network error while signing in.');
    } finally {
      setAuthBusy(false);
    }
  }

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'same-origin',
        headers: buildAuthHeaders(token, true),
      });
    } catch {
      // Ignore network hiccup during logout
    }
    setIsAuthenticated(false);
    setToken(null);
    setExecEmail('');
    setStaffList([]);
    setExecAuthView(authMode === 'unclaimed' ? 'create' : 'login');
  }

  async function persistContent(nextContent: BlordSiteContent, customSuccessMessage?: string) {
    if (!isAuthenticated) return;
    setSaveStatus('saving');
    setSaveMessage('');
    try {
      const res = await fetch('/api/cms', {
        method: 'PUT',
        credentials: 'same-origin',
        headers: buildAuthHeaders(token, true),
        body: JSON.stringify({ content: nextContent }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSaveStatus('error');
        setSaveMessage(data.error ?? 'Failed to save changes.');
        return;
      }
      setContent(data.content);
      setUpdatedAt(data.updatedAt ?? '');
      onContentChange?.(data.content, data.updatedAt ?? '');
      setSaveStatus('saved');
      setSaveMessage(customSuccessMessage ?? 'Prices, photos, and catalog saved live.');
    } catch {
      setSaveStatus('error');
      setSaveMessage('Network error while saving catalog changes.');
    }
  }

  async function handleUploadImage(
    targetKey: string,
    file: File | undefined,
    onSuccess: (uploadedUrl: string) => void
  ) {
    if (!file || !isAuthenticated) return;
    setUploadingTarget(targetKey);
    setSaveMessage('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        credentials: 'same-origin',
        headers: buildAuthHeaders(token, false),
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setSaveStatus('error');
        setSaveMessage(data.error ?? 'Photo upload failed.');
        return;
      }
      onSuccess(data.url);
      setSaveStatus('saved');
      setSaveMessage('Photo uploaded. Click "Save All Changes" to publish updates live.');
    } catch {
      setSaveStatus('error');
      setSaveMessage('Network error while uploading image.');
    } finally {
      setUploadingTarget(null);
    }
  }

  async function handleChangeExecutivePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!isAuthenticated) return;
    if (newExecPw !== confirmExecPw) {
      setSaveStatus('error');
      setSaveMessage('New password and confirmation password do not match.');
      return;
    }
    setPwBusy(true);
    setSaveMessage('');
    try {
      const res = await fetch('/api/executive/password', {
        method: 'POST',
        credentials: 'same-origin',
        headers: buildAuthHeaders(token, true),
        body: JSON.stringify({
          currentPassword: currentExecPw,
          newPassword: newExecPw,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSaveStatus('error');
        setSaveMessage(data.error ?? 'Could not update password.');
        return;
      }
      setToken(data.token);
      setCurrentExecPw('');
      setNewExecPw('');
      setConfirmExecPw('');
      setSaveStatus('saved');
      setSaveMessage(
        'Executive Admin password updated successfully. Your next sign-in will require the new password.'
      );
    } catch {
      setSaveStatus('error');
      setSaveMessage('Network error while updating password.');
    } finally {
      setPwBusy(false);
    }
  }

  async function handleCreateNewProduct(e: React.FormEvent) {
    e.preventDefault();
    const trimmedName = newProdName.trim();
    const slug = slugifyProductName(trimmedName);
    if (!trimmedName || !slug) {
      setSaveStatus('error');
      setSaveMessage('Enter a valid product name.');
      return;
    }
    if (content.products.some((p) => p.slug === slug)) {
      setSaveStatus('error');
      setSaveMessage(`A product with URL /products/${slug} already exists.`);
      return;
    }

    const newProduct: ProductItem = {
      slug,
      name: trimmedName,
      category: newProdCategory.trim() || 'Blord Commerce',
      logo: newProdImage || '/assets/logo/blunt-logo-s.png',
      priceLabel: newProdPriceLabel.trim() || undefined,
      tagline: newProdTagline.trim() || `${trimmedName} — Official Blord Group Release.`,
      summary: newProdSummary.trim() || `Direct access to ${trimmedName} across Nigeria and global channels.`,
      description:
        newProdDescription.trim() ||
        `${trimmedName} is backed by Blord Group fulfillment, support, and branch inspection nationwide.`,
      featuresTitle: `Why choose ${trimmedName}`,
      features: [
        {
          title: 'Verified Blord Group Quality',
          description: 'Backed by Awka headquarters and nationwide branch verification.',
        },
        {
          title: 'Flexible Settlement',
          description: 'Pay seamlessly via Naira, USDT, or direct branch invoice.',
        },
      ],
      links: {},
    };

    const nextContent: BlordSiteContent = {
      ...content,
      products: [...content.products, newProduct],
    };
    setContent(nextContent);
    setNewProdName('');
    setNewProdPriceLabel('');
    setNewProdTagline('');
    setNewProdSummary('');
    setNewProdDescription('');
    setNewProdImage('/assets/logo/blunt-logo-s.png');
    await persistContent(
      nextContent,
      `Launched "${trimmedName}" live at /products/${slug}.`
    );
  }

  async function handleCreateStaff(e: React.FormEvent) {
    e.preventDefault();
    if (!isAuthenticated) return;
    setSaveMessage('');
    try {
      const res = await fetch('/api/executive/staff', {
        method: 'POST',
        credentials: 'same-origin',
        headers: buildAuthHeaders(token, true),
        body: JSON.stringify({
          name: newStaffName,
          email: newStaffEmail,
          password: newStaffPassword,
          department: newStaffDept,
          branchId: newStaffBranch,
          title: newStaffTitle || getStaffRoleLabel(newStaffDept),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSaveStatus('error');
        setSaveMessage(data.error ?? 'Could not create staff account.');
        return;
      }
      setStaffList((prev) => [...prev, data.staff]);
      setNewStaffName('');
      setNewStaffEmail('');
      setNewStaffPassword('');
      setNewStaffTitle('');
      setSaveStatus('saved');
      setSaveMessage(
        `Created Staff Portal account for ${data.staff.name} (${getStaffRoleLabel(data.staff.department)}).`
      );
    } catch {
      setSaveStatus('error');
      setSaveMessage('Network error while creating staff account.');
    }
  }

  async function handleUpdateStaff(
    id: string,
    patch: { department?: StaffDepartment; branchId?: string; active?: boolean; newPassword?: string }
  ) {
    if (!isAuthenticated) return;
    try {
      const res = await fetch('/api/executive/staff', {
        method: 'PATCH',
        credentials: 'same-origin',
        headers: buildAuthHeaders(token, true),
        body: JSON.stringify({ id, ...patch }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSaveStatus('error');
        setSaveMessage(data.error ?? 'Could not update staff account.');
        return;
      }
      setStaffList((prev) => prev.map((s) => (s.id === id ? data.staff : s)));
      if (patch.newPassword) {
        setResetPwDrafts((prev) => {
          const copy = { ...prev };
          delete copy[id];
          return copy;
        });
      }
      setSaveStatus('saved');
      setSaveMessage(`Updated ${data.staff.name} role & branch assignment.`);
    } catch {
      setSaveStatus('error');
      setSaveMessage('Network error while updating staff account.');
    }
  }

  async function handleDeleteStaff(id: string, staffMemberName: string) {
    if (!isAuthenticated) return;
    try {
      const res = await fetch('/api/executive/staff', {
        method: 'DELETE',
        credentials: 'same-origin',
        headers: buildAuthHeaders(token, true),
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSaveStatus('error');
        setSaveMessage(data.error ?? 'Could not delete staff member.');
        return;
      }
      setStaffList((prev) => prev.filter((s) => s.id !== id));
      setSaveStatus('saved');
      setSaveMessage(`Removed staff access for ${staffMemberName}.`);
    } catch {
      setSaveStatus('error');
      setSaveMessage('Network error while deleting staff account.');
    }
  }

  async function handleResetCms() {
    if (!isAuthenticated) return;
    setSaveStatus('saving');
    try {
      const res = await fetch('/api/cms/reset', {
        method: 'POST',
        credentials: 'same-origin',
        headers: buildAuthHeaders(token, true),
      });
      const data = await res.json();
      if (!res.ok) {
        setSaveStatus('error');
        setSaveMessage(data.error ?? 'Could not restore defaults.');
        return;
      }
      setContent(data.content);
      setUpdatedAt(data.updatedAt ?? '');
      onContentChange?.(data.content, data.updatedAt ?? '');
      setConfirmReset(false);
      setSaveStatus('saved');
      setSaveMessage('Restored official Blord Group catalog, vehicles, tanks, and branch defaults.');
    } catch {
      setSaveStatus('error');
      setSaveMessage('Network error while restoring defaults.');
    }
  }

  if (sessionChecking) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-140px)] max-w-xl items-center justify-center px-4 py-14">
        <div className="w-full rounded-3xl border border-[#fe6d2c]/35 bg-[#07090e]/65 p-8 text-center backdrop-blur-xl">
          <p className="text-sm font-medium text-slate-200">Restoring Executive Admin session...</p>
        </div>
      </div>
    );
  }

  // EXECUTIVE AUTH GATE: Dual "Create Authorized Account" (1 person only) + "Admin Login"
  if (!isAuthenticated) {
    const accountAlreadyLocked = authMode === 'claimed' || authMode === 'env';
    return (
      <div className="mx-auto flex min-h-[calc(100vh-140px)] max-w-xl items-center px-4 py-14 sm:px-6">
        <div className="w-full rounded-3xl border border-[#fe6d2c]/35 bg-[#07090e]/65 p-8 shadow-2xl backdrop-blur-xl sm:p-10">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#fe6d2c]/40 bg-[#fe6d2c]/20 text-[#fe6d2c]">
              {execAuthView === 'create' ? (
                <KeyRound className="h-6 w-6" />
              ) : (
                <ShieldCheck className="h-6 w-6" />
              )}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#fe6d2c]">
                Single-Personnel Executive Admin Backend
              </p>
              <h1 className="font-display text-2xl font-bold text-white">
                {execAuthView === 'create' ? 'Create Authorized Account' : 'Admin Backend Login'}
              </h1>
            </div>
          </div>

          {/* Two-Option Auth Mode Switcher */}
          <div
            className="mt-6 grid grid-cols-2 gap-2 rounded-2xl border border-white/15 bg-black/35 p-1.5"
            role="tablist"
            aria-label="Executive Admin Authentication Mode"
          >
            <button
              type="button"
              role="tab"
              aria-selected={execAuthView === 'create'}
              onClick={() => {
                setExecAuthView('create');
                setAuthError('');
              }}
              className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold transition-colors ${
                execAuthView === 'create'
                  ? 'bg-[#fe6d2c] text-white'
                  : 'text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>Create Account</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={execAuthView === 'login'}
              onClick={() => {
                setExecAuthView('login');
                setAuthError('');
              }}
              className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold transition-colors ${
                execAuthView === 'login'
                  ? 'bg-[#fe6d2c] text-white'
                  : 'text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <LogIn className="h-3.5 w-3.5" />
              <span>Admin Login</span>
            </button>
          </div>

          {execAuthView === 'create' && accountAlreadyLocked ? (
            <div className="mt-6 space-y-4 rounded-2xl border border-amber-400/40 bg-amber-950/45 p-5">
              <div className="flex items-start gap-3">
                <Lock className="mt-0.5 h-5 w-5 shrink-0 text-[#fe6d2c]" />
                <div>
                  <h2 className="font-display text-base font-bold text-white">
                    Single Authorized Personnel Account Active
                  </h2>
                  <p className="mt-1 text-xs leading-relaxed text-amber-100/90">
                    Admin Backend access is strictly locked to <strong>only one authorized person</strong>
                    {claimedEmailHint ? ` (${claimedEmailHint})` : ''}. No additional Admin
                    Backend accounts can be registered.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setExecAuthView('login')}
                className="w-full rounded-xl bg-[#fe6d2c] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#ff7f44]"
              >
                Switch to Admin Login →
              </button>
            </div>
          ) : (
            <>
              <p className="mt-4 text-sm leading-relaxed text-slate-200">
                {execAuthView === 'create'
                  ? 'Create the single authorized Executive Admin account below. Once claimed, nobody else can create an Admin Backend account — only this single representative can log in, modify prices, upload photos, and manage goods.'
                  : authMode === 'env'
                    ? 'Sign in with your executive email and server-configured executive passcode.'
                    : `Sign in with the authorized Executive Admin account${
                        claimedEmailHint ? ` (${claimedEmailHint})` : ''
                      } to customize vehicles, BLUETTI/Blunt Power Tanks, power banks, photos, and staff roles.`}
              </p>

              <form
                onSubmit={execAuthView === 'create' ? handleClaimSubmit : handleLoginSubmit}
                className="mt-6 space-y-4"
              >
                {execAuthView === 'create' && (
                  <div>
                    <label htmlFor="exec-name" className="block text-xs font-medium text-slate-300">
                      Authorized Personnel Full Name
                    </label>
                    <input
                      id="exec-name"
                      type="text"
                      required
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-white/20 bg-[#07090e]/70 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-400 focus:border-[#fe6d2c] focus:outline-none"
                    />
                  </div>
                )}

                <div>
                  <label htmlFor="exec-email" className="block text-xs font-medium text-slate-300">
                    Authorized Email
                  </label>
                  <input
                    id="exec-email"
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="ceo@blordholdings.com"
                    className="mt-1.5 w-full rounded-xl border border-white/20 bg-[#07090e]/70 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-400 focus:border-[#fe6d2c] focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="exec-password" className="block text-xs font-medium text-slate-300">
                    {authMode === 'env' && execAuthView === 'login'
                      ? 'Executive Passcode'
                      : 'Password'}
                  </label>
                  <input
                    id="exec-password"
                    type="password"
                    required
                    minLength={execAuthView === 'create' ? 8 : 1}
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder={
                      execAuthView === 'create' ? 'Minimum 8 characters' : 'Enter password'
                    }
                    className="mt-1.5 w-full rounded-xl border border-white/20 bg-[#07090e]/70 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-400 focus:border-[#fe6d2c] focus:outline-none"
                  />
                </div>

                {execAuthView === 'create' && (
                  <div>
                    <label htmlFor="exec-confirm" className="block text-xs font-medium text-slate-300">
                      Confirm Password
                    </label>
                    <input
                      id="exec-confirm"
                      type="password"
                      required
                      minLength={8}
                      value={confirmPasswordInput}
                      onChange={(e) => setConfirmPasswordInput(e.target.value)}
                      placeholder="Re-enter password"
                      className="mt-1.5 w-full rounded-xl border border-white/20 bg-[#07090e]/70 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-400 focus:border-[#fe6d2c] focus:outline-none"
                    />
                  </div>
                )}

                {authError && (
                  <p
                    role="alert"
                    className="rounded-xl border border-red-500/45 bg-red-950/75 px-3.5 py-2.5 text-xs text-red-100"
                  >
                    {authError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={authBusy}
                  className="w-full rounded-xl bg-[#fe6d2c] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#ff7f44] disabled:opacity-60"
                >
                  {authBusy
                    ? 'Verifying...'
                    : execAuthView === 'create'
                      ? 'Create Authorized Account & Enter'
                      : 'Log In to Admin Backend'}
                </button>
              </form>
            </>
          )}

          <div className="mt-6 flex items-center justify-between border-t border-white/15 pt-4 text-xs text-slate-300">
            <span>Department staff member?</span>
            <Link to="/admin" className="font-semibold text-[#fe6d2c] hover:underline">
              Open Staff Portal (/admin) →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const navItems: Array<{
    id: ExecTab;
    label: string;
    meta: string;
    icon: typeof Car;
  }> = [
    { id: 'cars', label: 'Vehicles & Prices', meta: `${content.cars?.length ?? 0} EVs`, icon: Car },
    {
      id: 'tanks',
      label: 'Power Tanks',
      meta: `${content.powerTanks?.length ?? 0} models`,
      icon: Zap,
    },
    {
      id: 'products',
      label: 'Products',
      meta: `${content.products.length} live`,
      icon: Package,
    },
    {
      id: 'staff',
      label: 'Staff Roles',
      meta: `${staffList.length} staff`,
      icon: Users,
    },
    {
      id: 'security',
      label: 'Change Password',
      meta: 'Auth',
      icon: KeyRound,
    },
    {
      id: 'site',
      label: 'Site & Branches',
      meta: `${content.contact.branches.length} offices`,
      icon: Building2,
    },
  ];

  // AUTHENTICATED EXECUTIVE WORKSPACE (Sidebar + Topbar + Canvas per 3_saas_dashboard.md)
  return (
    <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8">
      {/* Top Executive Workspace Bar */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-white/20 bg-[#07090e]/60 px-6 py-4 backdrop-blur-xl xl:flex-row xl:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
            <span className="font-semibold text-[#fe6d2c]">Executive Admin Backend</span>
            <span>·</span>
            <span>{execName}</span>
            <span>·</span>
            <span className="font-mono">{execEmail}</span>
          </div>
          <h1 className="mt-1 font-display text-xl font-bold text-white sm:text-2xl">
            Pricing, Photo Uploads & Staff Role Command
          </h1>
          {updatedAt && (
            <p className="mt-0.5 font-mono text-[11px] text-slate-300 tabular-nums">
              Last published: {new Date(updatedAt).toLocaleString()}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              setActiveTab('security');
              void persistPreferences('security');
            }}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
              activeTab === 'security'
                ? 'border-[#fe6d2c] bg-[#fe6d2c]/20 text-white'
                : 'border-white/20 bg-white/[0.06] text-slate-100 hover:bg-white/15'
            }`}
          >
            <KeyRound className="h-3.5 w-3.5 text-[#fe6d2c]" />
            <span>Change Password</span>
          </button>

          <Link
            to="/"
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/[0.06] px-3.5 py-2 text-xs font-medium text-slate-100 whitespace-nowrap shrink-0 hover:bg-white/15"
          >
            <span>View Live Site</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>

          <button
            type="button"
            onClick={() => persistContent(content)}
            disabled={saveStatus === 'saving'}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#fe6d2c] px-4 py-2 text-xs font-semibold text-white whitespace-nowrap shrink-0 hover:bg-[#ff7f44] disabled:opacity-60"
          >
            <Save className="h-3.5 w-3.5" />
            <span>{saveStatus === 'saving' ? 'Saving...' : 'Save All Changes'}</span>
          </button>

          <button
            type="button"
            onClick={() => void handleLogout()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/[0.04] px-3.5 py-2 text-xs font-medium text-slate-200 whitespace-nowrap shrink-0 hover:bg-white/15"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {saveMessage && (
        <div
          role="status"
          className={`mt-4 flex items-center gap-2 rounded-xl border px-4 py-3 text-xs font-medium backdrop-blur-xl ${
            saveStatus === 'error'
              ? 'border-red-400/60 bg-red-950/80 text-red-100'
              : 'border-emerald-400/60 bg-emerald-950/80 text-emerald-100'
          }`}
        >
          {saveStatus !== 'error' && <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-300" />}
          <span>{saveMessage}</span>
        </div>
      )}

      <div className="mt-6 flex flex-col gap-6 lg:flex-row">
        {/* Left Navigation Sidebar (288px desktop) */}
        <aside className="w-full shrink-0 lg:w-72">
          <div className="rounded-2xl border border-white/20 bg-[#07090e]/60 p-3 backdrop-blur-xl">
            <nav aria-label="Executive Backend Sections" className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(item.id);
                      void persistPreferences(item.id);
                      if (item.id === 'staff') {
                        void loadStaffDirectory(token);
                      }
                    }}
                    className={`flex items-center justify-between gap-2 rounded-xl px-3.5 py-2.5 text-left transition-colors ${
                      active
                        ? 'bg-[#fe6d2c] text-white'
                        : 'text-slate-200 hover:bg-white/10'
                    }`}
                  >
                    <span className="flex items-center gap-2.5 min-w-0">
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="truncate text-xs font-semibold">{item.label}</span>
                    </span>
                    <span
                      className={`font-mono text-[10px] shrink-0 tabular-nums ${
                        active ? 'text-white/90' : 'text-slate-400'
                      }`}
                    >
                      {item.meta}
                    </span>
                  </button>
                );
              })}
            </nav>

            <div className="mt-4 border-t border-white/15 px-2 pt-3 text-[11px] leading-relaxed text-slate-300">
              <p className="font-semibold text-white">Executive Safeguard</p>
              <p className="mt-1">
                Prices, uploaded item photos, and new catalog launches are locked exclusively to
                this portal. Operational team members sign in at{' '}
                <Link to="/admin" className="text-[#fe6d2c] underline">
                  /admin
                </Link>
                .
              </p>
            </div>
          </div>
        </aside>

        {/* Main Workspace Canvas */}
        <div className="min-w-0 flex-1 space-y-6">
          {/* TAB 1: VEHICLES & PRICES */}
          {activeTab === 'cars' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/20 bg-[#07090e]/60 p-6 backdrop-blur-xl">
                <div>
                  <h2 className="font-display text-xl font-bold text-white">
                    Blord Electric Cars & Vehicle Pricing
                  </h2>
                  <p className="mt-1 text-xs text-slate-300">
                    Update exact Naira prices, upload vehicle photos directly, or add new models to{' '}
                    <Link to="/cars" className="text-[#fe6d2c] underline">
                      /cars
                    </Link>
                    .
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setContent({
                      ...content,
                      cars: [
                        ...(content.cars ?? []),
                        {
                          id: `car-${Date.now()}`,
                          name: 'New Blord Electric SUV',
                          category: 'Electric SUV',
                          sizeClass: 'Mid-Size · 4,550 × 1,860 × 1,620 mm',
                          batteryCapacity: '65 kWh LFP Battery',
                          rangeKm: '480 km',
                          priceNgn: 38000000,
                          status: 'Available',
                          image: '/assets/cars/byd-atto3.jpg',
                          highlights: ['Pay in Naira, USDT, or BTC', 'Direct China-to-Nigeria import'],
                        },
                      ],
                    })
                  }
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#fe6d2c] px-4 py-2 text-xs font-semibold text-white whitespace-nowrap shrink-0 hover:bg-[#ff7f44]"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add New Vehicle</span>
                </button>
              </div>

              <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                {(content.cars ?? []).map((car, idx) => (
                  <div
                    key={car.id}
                    className="space-y-4 rounded-2xl border border-white/20 bg-[#07090e]/60 p-6 backdrop-blur-xl"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3.5">
                        <img
                          src={car.image}
                          alt={car.name}
                          className="h-16 w-24 rounded-xl border border-white/15 object-cover bg-black/40"
                        />
                        <div>
                          <p className="font-mono text-base font-bold text-[#fe6d2c] tabular-nums">
                            {formatNaira(car.priceNgn)}
                          </p>
                          <p className="text-xs text-slate-300">{car.category}</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        aria-label={`Remove ${car.name}`}
                        onClick={() => {
                          const next = (content.cars ?? []).filter((c) => c.id !== car.id);
                          setContent({ ...content, cars: next });
                        }}
                        className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-red-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Remove</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs text-slate-300">Vehicle Name</label>
                        <input
                          type="text"
                          value={car.name}
                          onChange={(e) => {
                            const next = [...(content.cars ?? [])];
                            next[idx] = { ...car, name: e.target.value };
                            setContent({ ...content, cars: next });
                          }}
                          className="mt-1 w-full rounded-lg border border-white/20 bg-[#07090e]/70 px-3 py-2 text-sm text-white focus:border-[#fe6d2c] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-300">Vehicle Price (₦ NGN)</label>
                        <input
                          type="number"
                          min={0}
                          step={50000}
                          value={car.priceNgn}
                          onChange={(e) => {
                            const next = [...(content.cars ?? [])];
                            next[idx] = { ...car, priceNgn: Number(e.target.value) || 0 };
                            setContent({ ...content, cars: next });
                          }}
                          className="mt-1 w-full rounded-lg border border-[#fe6d2c]/45 bg-[#07090e]/70 px-3 py-2 font-mono text-sm font-semibold text-white tabular-nums focus:border-[#fe6d2c] focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div>
                        <label className="block text-xs text-slate-300">Category</label>
                        <input
                          type="text"
                          value={car.category}
                          onChange={(e) => {
                            const next = [...(content.cars ?? [])];
                            next[idx] = { ...car, category: e.target.value };
                            setContent({ ...content, cars: next });
                          }}
                          className="mt-1 w-full rounded-lg border border-white/20 bg-[#07090e]/70 px-3 py-2 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-300">Battery</label>
                        <input
                          type="text"
                          value={car.batteryCapacity}
                          onChange={(e) => {
                            const next = [...(content.cars ?? [])];
                            next[idx] = { ...car, batteryCapacity: e.target.value };
                            setContent({ ...content, cars: next });
                          }}
                          className="mt-1 w-full rounded-lg border border-white/20 bg-[#07090e]/70 px-3 py-2 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-300">Status</label>
                        <select
                          value={car.status}
                          onChange={(e) => {
                            const next = [...(content.cars ?? [])];
                            next[idx] = {
                              ...car,
                              status: e.target.value as
                                | 'Available'
                                | 'Low Stock'
                                | 'Pre-Order'
                                | 'Sold Out',
                            };
                            setContent({ ...content, cars: next });
                          }}
                          className="mt-1 w-full rounded-lg border border-white/20 bg-[#07090e]/85 px-2.5 py-2 text-xs text-white"
                        >
                          <option value="Available">Available</option>
                          <option value="Low Stock">Low Stock</option>
                          <option value="Pre-Order">Pre-Order</option>
                          <option value="Sold Out">Sold Out</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs text-slate-300">Size / Dimensions</label>
                        <input
                          type="text"
                          value={car.sizeClass}
                          onChange={(e) => {
                            const next = [...(content.cars ?? [])];
                            next[idx] = { ...car, sizeClass: e.target.value };
                            setContent({ ...content, cars: next });
                          }}
                          className="mt-1 w-full rounded-lg border border-white/20 bg-[#07090e]/70 px-3 py-2 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-300">Driving Range</label>
                        <input
                          type="text"
                          value={car.rangeKm}
                          onChange={(e) => {
                            const next = [...(content.cars ?? [])];
                            next[idx] = { ...car, rangeKm: e.target.value };
                            setContent({ ...content, cars: next });
                          }}
                          className="mt-1 w-full rounded-lg border border-white/20 bg-[#07090e]/70 px-3 py-2 text-xs text-white"
                        />
                      </div>
                    </div>

                    {/* Photo Upload Control */}
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/15 bg-white/[0.03] p-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-medium text-slate-300">Vehicle Photo</p>
                        <p className="truncate font-mono text-[11px] text-slate-400">{car.image}</p>
                      </div>
                      <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[#fe6d2c]/50 bg-[#fe6d2c]/15 px-3 py-2 text-xs font-semibold text-white whitespace-nowrap shrink-0 hover:bg-[#fe6d2c]/30">
                        <Upload className="h-3.5 w-3.5 text-[#fe6d2c]" />
                        <span>
                          {uploadingTarget === `car-${car.id}` ? 'Uploading...' : 'Upload Photo'}
                        </span>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp,image/gif"
                          className="sr-only"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            void handleUploadImage(`car-${car.id}`, file, (url) => {
                              const next = [...(content.cars ?? [])];
                              next[idx] = { ...car, image: url };
                              setContent({ ...content, cars: next });
                            });
                            e.target.value = '';
                          }}
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: POWER TANKS & PRICES */}
          {activeTab === 'tanks' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/20 bg-[#07090e]/60 p-6 backdrop-blur-xl">
                <div>
                  <h2 className="font-display text-xl font-bold text-white">
                    Blord / BLUETTI & Blunt Power Tanks & Power Banks
                  </h2>
                  <p className="mt-1 text-xs text-slate-300">
                    Customize wattage sizes, BLUETTI / Blunt Solar Power Tanks, Power Banks, prices,
                    and upload official product photos for{' '}
                    <Link to="/power-tank" className="text-[#fe6d2c] underline">
                      /power-tank
                    </Link>
                    .
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setContent({
                        ...content,
                        powerTanks: [
                          ...(content.powerTanks ?? []),
                          {
                            id: `tank-${Date.now()}`,
                            name: 'BLUETTI / Blunt Power Tank 2500W',
                            capacityWatt: '2,500W',
                            storageSpec: '2.56 kWh LiFePO4 Solar Power Tank',
                            sizeDimensions: 'Compact Tower · 440 × 290 × 260 mm',
                            priceNgn: 1750000,
                            status: 'Available',
                            image: '/assets/power-tanks/tank-1500w.jpg',
                            appliances: 'Freezer, Smart TV, Starlink, Fans & Laptops',
                          },
                        ],
                      })
                    }
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#fe6d2c] px-4 py-2 text-xs font-semibold text-white whitespace-nowrap shrink-0 hover:bg-[#ff7f44]"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Power Tank / BLUETTI</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setContent({
                        ...content,
                        powerTanks: [
                          ...(content.powerTanks ?? []),
                          {
                            id: `powerbank-${Date.now()}`,
                            name: 'Blunt Fast-Charge Power Bank 30,000mAh',
                            capacityWatt: '30,000mAh',
                            storageSpec: '111 Wh USB-C PD Portable Power Bank',
                            sizeDimensions: 'Pocket Brick · 155 × 76 × 38 mm',
                            priceNgn: 32000,
                            status: 'Available',
                            image: '/assets/power-tanks/powerbank-50000mah.png',
                            appliances: 'Smartphones, iPads, Routers & USB-C Laptops',
                          },
                        ],
                      })
                    }
                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/25 bg-white/[0.06] px-3.5 py-2 text-xs font-semibold text-white whitespace-nowrap shrink-0 hover:bg-white/15"
                  >
                    <Plus className="h-4 w-4 text-[#fe6d2c]" />
                    <span>Add Power Bank</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                {(content.powerTanks ?? []).map((tank, idx) => (
                  <div
                    key={tank.id}
                    className="space-y-4 rounded-2xl border border-white/20 bg-[#07090e]/60 p-6 backdrop-blur-xl"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3.5">
                        <img
                          src={tank.image}
                          alt={tank.name}
                          className="h-16 w-20 rounded-xl border border-white/15 object-cover bg-black/40"
                        />
                        <div>
                          <p className="font-mono text-base font-bold text-[#fe6d2c] tabular-nums">
                            {formatNaira(tank.priceNgn)}
                          </p>
                          <p className="font-mono text-xs text-slate-300">{tank.capacityWatt}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        aria-label={`Remove ${tank.name}`}
                        onClick={() => {
                          const next = (content.powerTanks ?? []).filter((t) => t.id !== tank.id);
                          setContent({ ...content, powerTanks: next });
                        }}
                        className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-red-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Remove</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs text-slate-300">Model Name</label>
                        <input
                          type="text"
                          value={tank.name}
                          onChange={(e) => {
                            const next = [...(content.powerTanks ?? [])];
                            next[idx] = { ...tank, name: e.target.value };
                            setContent({ ...content, powerTanks: next });
                          }}
                          className="mt-1 w-full rounded-lg border border-white/20 bg-[#07090e]/70 px-3 py-2 text-sm text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-300">Tank Price (₦ NGN)</label>
                        <input
                          type="number"
                          min={0}
                          step={5000}
                          value={tank.priceNgn}
                          onChange={(e) => {
                            const next = [...(content.powerTanks ?? [])];
                            next[idx] = { ...tank, priceNgn: Number(e.target.value) || 0 };
                            setContent({ ...content, powerTanks: next });
                          }}
                          className="mt-1 w-full rounded-lg border border-[#fe6d2c]/45 bg-[#07090e]/70 px-3 py-2 font-mono text-sm font-semibold text-white tabular-nums"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div>
                        <label className="block text-xs text-slate-300">Capacity Rating</label>
                        <input
                          type="text"
                          value={tank.capacityWatt}
                          onChange={(e) => {
                            const next = [...(content.powerTanks ?? [])];
                            next[idx] = { ...tank, capacityWatt: e.target.value };
                            setContent({ ...content, powerTanks: next });
                          }}
                          className="mt-1 w-full rounded-lg border border-white/20 bg-[#07090e]/70 px-3 py-2 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-300">Battery Storage</label>
                        <input
                          type="text"
                          value={tank.storageSpec}
                          onChange={(e) => {
                            const next = [...(content.powerTanks ?? [])];
                            next[idx] = { ...tank, storageSpec: e.target.value };
                            setContent({ ...content, powerTanks: next });
                          }}
                          className="mt-1 w-full rounded-lg border border-white/20 bg-[#07090e]/70 px-3 py-2 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-300">Stock Status</label>
                        <select
                          value={tank.status}
                          onChange={(e) => {
                            const next = [...(content.powerTanks ?? [])];
                            next[idx] = {
                              ...tank,
                              status: e.target.value as
                                | 'Available'
                                | 'Low Stock'
                                | 'Sold Out'
                                | 'Coming Soon',
                            };
                            setContent({ ...content, powerTanks: next });
                          }}
                          className="mt-1 w-full rounded-lg border border-white/20 bg-[#07090e]/85 px-2.5 py-2 text-xs text-white"
                        >
                          <option value="Available">Available</option>
                          <option value="Low Stock">Low Stock</option>
                          <option value="Sold Out">Sold Out</option>
                          <option value="Coming Soon">Coming Soon</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs text-slate-300">Size / Dimensions</label>
                        <input
                          type="text"
                          value={tank.sizeDimensions}
                          onChange={(e) => {
                            const next = [...(content.powerTanks ?? [])];
                            next[idx] = { ...tank, sizeDimensions: e.target.value };
                            setContent({ ...content, powerTanks: next });
                          }}
                          className="mt-1 w-full rounded-lg border border-white/20 bg-[#07090e]/70 px-3 py-2 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-300">Appliances Supported</label>
                        <input
                          type="text"
                          value={tank.appliances}
                          onChange={(e) => {
                            const next = [...(content.powerTanks ?? [])];
                            next[idx] = { ...tank, appliances: e.target.value };
                            setContent({ ...content, powerTanks: next });
                          }}
                          className="mt-1 w-full rounded-lg border border-white/20 bg-[#07090e]/70 px-3 py-2 text-xs text-white"
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/15 bg-white/[0.03] p-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-medium text-slate-300">Power Tank Photo</p>
                        <p className="truncate font-mono text-[11px] text-slate-400">
                          {tank.image}
                        </p>
                      </div>
                      <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[#fe6d2c]/50 bg-[#fe6d2c]/15 px-3 py-2 text-xs font-semibold text-white whitespace-nowrap shrink-0 hover:bg-[#fe6d2c]/30">
                        <Upload className="h-3.5 w-3.5 text-[#fe6d2c]" />
                        <span>
                          {uploadingTarget === `tank-${tank.id}` ? 'Uploading...' : 'Upload Photo'}
                        </span>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp,image/gif"
                          className="sr-only"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            void handleUploadImage(`tank-${tank.id}`, file, (url) => {
                              const next = [...(content.powerTanks ?? [])];
                              next[idx] = { ...tank, image: url };
                              setContent({ ...content, powerTanks: next });
                            });
                            e.target.value = '';
                          }}
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: PRODUCTS & NEW PRODUCT LAUNCHES */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              {/* Launch New Product Form */}
              <form
                onSubmit={handleCreateNewProduct}
                className="rounded-2xl border border-[#fe6d2c]/40 bg-[#07090e]/65 p-6 backdrop-blur-xl"
              >
                <div className="flex items-center gap-2.5">
                  <Sparkles className="h-5 w-5 text-[#fe6d2c]" />
                  <div>
                    <h2 className="font-display text-lg font-bold text-white">
                      Launch New Product & Upload Photo
                    </h2>
                    <p className="text-xs text-slate-300">
                      Creates a new live Blord Group product page (/products/slug), Home card, and
                      Footer entry immediately.
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label htmlFor="new-prod-name" className="block text-xs text-slate-300">
                      Product Name
                    </label>
                    <input
                      id="new-prod-name"
                      type="text"
                      required
                      value={newProdName}
                      onChange={(e) => setNewProdName(e.target.value)}
                      placeholder="e.g. Blord Solar Inverter 8kVA"
                      className="mt-1 w-full rounded-lg border border-white/20 bg-[#07090e]/70 px-3 py-2 text-sm text-white"
                    />
                    {newProdName.trim() && (
                      <p className="mt-1 font-mono text-[10px] text-[#fe6d2c]">
                        /products/{slugifyProductName(newProdName)}
                      </p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="new-prod-category" className="block text-xs text-slate-300">
                      Category
                    </label>
                    <input
                      id="new-prod-category"
                      type="text"
                      value={newProdCategory}
                      onChange={(e) => setNewProdCategory(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-white/20 bg-[#07090e]/70 px-3 py-2 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label htmlFor="new-prod-price" className="block text-xs text-slate-300">
                      Price Label (Optional)
                    </label>
                    <input
                      id="new-prod-price"
                      type="text"
                      value={newProdPriceLabel}
                      onChange={(e) => setNewProdPriceLabel(e.target.value)}
                      placeholder="e.g. ₦3,850,000"
                      className="mt-1 w-full rounded-lg border border-[#fe6d2c]/45 bg-[#07090e]/70 px-3 py-2 font-mono text-sm text-white"
                    />
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="new-prod-tagline" className="block text-xs text-slate-300">
                      Headline Tagline
                    </label>
                    <input
                      id="new-prod-tagline"
                      type="text"
                      value={newProdTagline}
                      onChange={(e) => setNewProdTagline(e.target.value)}
                      placeholder="Key selling proposition"
                      className="mt-1 w-full rounded-lg border border-white/20 bg-[#07090e]/70 px-3 py-2 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label htmlFor="new-prod-summary" className="block text-xs text-slate-300">
                      Short Summary
                    </label>
                    <input
                      id="new-prod-summary"
                      type="text"
                      value={newProdSummary}
                      onChange={(e) => setNewProdSummary(e.target.value)}
                      placeholder="One-sentence summary for cards"
                      className="mt-1 w-full rounded-lg border border-white/20 bg-[#07090e]/70 px-3 py-2 text-sm text-white"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label htmlFor="new-prod-desc" className="block text-xs text-slate-300">
                    Detailed Description
                  </label>
                  <textarea
                    id="new-prod-desc"
                    rows={2}
                    value={newProdDescription}
                    onChange={(e) => setNewProdDescription(e.target.value)}
                    placeholder="Specs, inclusions, and branch availability..."
                    className="mt-1 w-full rounded-lg border border-white/20 bg-[#07090e]/70 px-3 py-2 text-sm text-white"
                  />
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={newProdImage}
                      alt="New product preview"
                      className="h-12 w-12 rounded-xl border border-white/20 object-cover"
                    />
                    <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-white/25 bg-white/[0.06] px-3.5 py-2 text-xs font-semibold text-white hover:bg-white/15">
                      <ImagePlus className="h-4 w-4 text-[#fe6d2c]" />
                      <span>
                        {uploadingTarget === 'new-product'
                          ? 'Uploading...'
                          : 'Upload New Product Photo'}
                      </span>
                      <input
                        id="new-prod-photo-input"
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        className="sr-only"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          void handleUploadImage('new-product', file, (url) => setNewProdImage(url));
                          e.target.value = '';
                        }}
                      />
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#fe6d2c] px-5 py-2.5 text-xs font-semibold text-white whitespace-nowrap shrink-0 hover:bg-[#ff7f44]"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add & Publish Product</span>
                  </button>
                </div>
              </form>

              {/* Existing Products Grid */}
              <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                {content.products.map((product, idx) => (
                  <div
                    key={product.slug}
                    className="space-y-3 rounded-2xl border border-white/20 bg-[#07090e]/60 p-6 backdrop-blur-xl"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={product.logo}
                          alt={product.name}
                          className="h-12 w-12 rounded-xl border border-white/15 object-cover"
                        />
                        <div>
                          <h3 className="font-display text-base font-bold text-white">
                            {product.name}
                          </h3>
                          <Link
                            to={`/products/${product.slug}`}
                            className="font-mono text-[11px] text-[#fe6d2c] hover:underline"
                          >
                            /products/{product.slug}
                          </Link>
                        </div>
                      </div>

                      {content.products.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const next = content.products.filter((p) => p.slug !== product.slug);
                            setContent({ ...content, products: next });
                          }}
                          className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-red-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div>
                        <label className="block text-xs text-slate-300">Product Name</label>
                        <input
                          type="text"
                          value={product.name}
                          onChange={(e) => {
                            const next = [...content.products];
                            next[idx] = { ...product, name: e.target.value };
                            setContent({ ...content, products: next });
                          }}
                          className="mt-1 w-full rounded-lg border border-white/20 bg-[#07090e]/70 px-3 py-2 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-300">Category</label>
                        <input
                          type="text"
                          value={product.category}
                          onChange={(e) => {
                            const next = [...content.products];
                            next[idx] = { ...product, category: e.target.value };
                            setContent({ ...content, products: next });
                          }}
                          className="mt-1 w-full rounded-lg border border-white/20 bg-[#07090e]/70 px-3 py-2 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-300">Price Label</label>
                        <input
                          type="text"
                          value={product.priceLabel ?? ''}
                          placeholder="Optional price"
                          onChange={(e) => {
                            const next = [...content.products];
                            next[idx] = {
                              ...product,
                              priceLabel: e.target.value || undefined,
                            };
                            setContent({ ...content, products: next });
                          }}
                          className="mt-1 w-full rounded-lg border border-[#fe6d2c]/45 bg-[#07090e]/70 px-3 py-2 font-mono text-xs text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-slate-300">Tagline</label>
                      <input
                        type="text"
                        value={product.tagline}
                        onChange={(e) => {
                          const next = [...content.products];
                          next[idx] = { ...product, tagline: e.target.value };
                          setContent({ ...content, products: next });
                        }}
                        className="mt-1 w-full rounded-lg border border-white/20 bg-[#07090e]/70 px-3 py-2 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-slate-300">Description</label>
                      <textarea
                        rows={2}
                        value={product.description}
                        onChange={(e) => {
                          const next = [...content.products];
                          next[idx] = { ...product, description: e.target.value };
                          setContent({ ...content, products: next });
                        }}
                        className="mt-1 w-full rounded-lg border border-white/20 bg-[#07090e]/70 px-3 py-2 text-xs text-white"
                      />
                    </div>

                    <div className="flex items-center justify-between gap-3 rounded-xl border border-white/15 bg-white/[0.03] p-2.5">
                      <span className="truncate font-mono text-[11px] text-slate-400">
                        {product.logo}
                      </span>
                      <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[#fe6d2c]/50 bg-[#fe6d2c]/15 px-3 py-1.5 text-xs font-semibold text-white whitespace-nowrap shrink-0 hover:bg-[#fe6d2c]/30">
                        <Upload className="h-3.5 w-3.5 text-[#fe6d2c]" />
                        <span>
                          {uploadingTarget === `prod-${product.slug}`
                            ? 'Uploading...'
                            : 'Upload Logo / Photo'}
                        </span>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp,image/gif"
                          className="sr-only"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            void handleUploadImage(`prod-${product.slug}`, file, (url) => {
                              const next = [...content.products];
                              next[idx] = { ...product, logo: url };
                              setContent({ ...content, products: next });
                            });
                            e.target.value = '';
                          }}
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: COMPANY STAFF ROLES */}
          {activeTab === 'staff' && (
            <div className="space-y-6">
              <form
                onSubmit={handleCreateStaff}
                className="rounded-2xl border border-white/20 bg-[#07090e]/65 p-6 backdrop-blur-xl"
              >
                <div className="flex items-center gap-2.5">
                  <UserPlus className="h-5 w-5 text-[#fe6d2c]" />
                  <div>
                    <h2 className="font-display text-lg font-bold text-white">
                      Provision Staff Portal Account
                    </h2>
                    <p className="text-xs text-slate-300">
                      Assign role-specific login access for Blord Group employees on{' '}
                      <Link to="/admin" className="text-[#fe6d2c] underline">
                        /admin
                      </Link>
                      . Staff cannot alter prices or upload product photos.
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                  <div>
                    <label htmlFor="staff-create-name" className="block text-xs text-slate-300">
                      Staff Full Name
                    </label>
                    <input
                      id="staff-create-name"
                      type="text"
                      required
                      value={newStaffName}
                      onChange={(e) => setNewStaffName(e.target.value)}
                      placeholder="e.g. Chinedu Okeke"
                      className="mt-1 w-full rounded-lg border border-white/20 bg-[#07090e]/70 px-3 py-2 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label htmlFor="staff-create-email" className="block text-xs text-slate-300">
                      Staff Email
                    </label>
                    <input
                      id="staff-create-email"
                      type="email"
                      required
                      value={newStaffEmail}
                      onChange={(e) => setNewStaffEmail(e.target.value)}
                      placeholder="staff@blordholdings.com"
                      className="mt-1 w-full rounded-lg border border-white/20 bg-[#07090e]/70 px-3 py-2 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label htmlFor="staff-create-pw" className="block text-xs text-slate-300">
                      Initial Password
                    </label>
                    <input
                      id="staff-create-pw"
                      type="password"
                      required
                      minLength={8}
                      value={newStaffPassword}
                      onChange={(e) => setNewStaffPassword(e.target.value)}
                      placeholder="Min 8 characters"
                      className="mt-1 w-full rounded-lg border border-white/20 bg-[#07090e]/70 px-3 py-2 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label htmlFor="staff-create-dept" className="block text-xs text-slate-300">
                      Department Role
                    </label>
                    <select
                      id="staff-create-dept"
                      value={newStaffDept}
                      onChange={(e) => setNewStaffDept(e.target.value as StaffDepartment)}
                      className="mt-1 w-full rounded-lg border border-white/20 bg-[#07090e]/85 px-3 py-2 text-sm text-white"
                    >
                      {STAFF_DEPARTMENTS.map((dept) => (
                        <option key={dept.value} value={dept.value}>
                          {dept.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="staff-create-branch" className="block text-xs text-slate-300">
                      Assigned Branch
                    </label>
                    <select
                      id="staff-create-branch"
                      value={newStaffBranch}
                      onChange={(e) => setNewStaffBranch(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-white/20 bg-[#07090e]/85 px-3 py-2 text-sm text-white"
                    >
                      {content.contact.branches.map((branch) => (
                        <option key={branch.id} value={branch.id}>
                          {branch.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                  <p className="text-xs text-slate-300">
                    Selected scope:{' '}
                    <span className="text-white">
                      {STAFF_DEPARTMENTS.find((d) => d.value === newStaffDept)?.scope}
                    </span>
                  </p>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#fe6d2c] px-5 py-2.5 text-xs font-semibold text-white whitespace-nowrap shrink-0 hover:bg-[#ff7f44]"
                  >
                    <UserPlus className="h-4 w-4" />
                    <span>Create Staff Login</span>
                  </button>
                </div>
              </form>

              <div className="rounded-2xl border border-white/20 bg-[#07090e]/60 p-6 backdrop-blur-xl">
                <h3 className="font-display text-lg font-bold text-white">
                  Active Blord Group Staff Accounts ({staffList.length})
                </h3>
                {staffLoading ? (
                  <p className="mt-4 text-xs text-slate-300">Loading staff directory...</p>
                ) : staffList.length === 0 ? (
                  <p className="mt-4 text-xs text-slate-300">
                    No operational staff logins have been provisioned yet. Create a staff account
                    above or have staff claim their access on /admin.
                  </p>
                ) : (
                  <div className="mt-4 space-y-3">
                    {staffList.map((member) => {
                      const branchObj = content.contact.branches.find((b) => b.id === member.branchId);
                      return (
                      <div
                        key={member.id}
                        className="flex flex-col justify-between gap-4 rounded-xl border border-white/15 bg-white/[0.03] p-4 lg:flex-row lg:items-center"
                      >
                        <div>
                          <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-white">
                            <span>{member.name}</span>
                            <span className="text-slate-500">·</span>
                            <span className="font-mono text-xs text-[#fe6d2c]">{member.email}</span>
                            <span className="text-slate-500">·</span>
                            <span
                              className={`text-xs ${
                                member.active ? 'text-emerald-300' : 'text-red-300'
                              }`}
                            >
                              {member.active ? 'Active' : 'Suspended'}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-slate-300">
                            {getStaffRoleLabel(member.department)} ·{' '}
                            {branchObj ? `${branchObj.name} (${branchObj.region})` : 'Awka Head Office'} · Created{' '}
                            <span className="font-mono tabular-nums">
                              {new Date(member.createdAt).toLocaleDateString()}
                            </span>
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <select
                            aria-label={`Role for ${member.name}`}
                            value={member.department}
                            onChange={(e) =>
                              void handleUpdateStaff(member.id, {
                                department: e.target.value as StaffDepartment,
                              })
                            }
                            className="rounded-lg border border-white/20 bg-[#07090e]/85 px-2.5 py-1.5 text-xs text-white"
                          >
                            {STAFF_DEPARTMENTS.map((dept) => (
                              <option key={dept.value} value={dept.value}>
                                {dept.label}
                              </option>
                            ))}
                          </select>

                          <select
                            aria-label={`Branch for ${member.name}`}
                            value={member.branchId ?? 'awka-hq'}
                            onChange={(e) =>
                              void handleUpdateStaff(member.id, {
                                branchId: e.target.value,
                              })
                            }
                            className="rounded-lg border border-white/20 bg-[#07090e]/85 px-2.5 py-1.5 text-xs text-white"
                          >
                            {content.contact.branches.map((branch) => (
                              <option key={branch.id} value={branch.id}>
                                {branch.name}
                              </option>
                            ))}
                          </select>

                          <button
                            type="button"
                            onClick={() =>
                              void handleUpdateStaff(member.id, { active: !member.active })
                            }
                            className="rounded-lg border border-white/20 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-white/10"
                          >
                            {member.active ? 'Suspend' : 'Reactivate'}
                          </button>

                          <div className="flex items-center gap-1">
                            <input
                              type="password"
                              placeholder="New pw (8+)"
                              value={resetPwDrafts[member.id] ?? ''}
                              onChange={(e) =>
                                setResetPwDrafts((prev) => ({
                                  ...prev,
                                  [member.id]: e.target.value,
                                }))
                              }
                              className="w-28 rounded-lg border border-white/20 bg-[#07090e]/70 px-2 py-1.5 text-xs text-white"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const draft = resetPwDrafts[member.id];
                                if (draft) {
                                  void handleUpdateStaff(member.id, { newPassword: draft });
                                }
                              }}
                              className="rounded-lg bg-white/10 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-white/20"
                            >
                              Set PW
                            </button>
                          </div>

                          <button
                            type="button"
                            aria-label={`Delete ${member.name}`}
                            onClick={() => void handleDeleteStaff(member.id, member.name)}
                            className="inline-flex items-center gap-1 rounded-lg border border-red-500/30 px-2.5 py-1.5 text-xs text-red-300 hover:bg-red-500/20"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Remove</span>
                          </button>
                        </div>
                      </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: CHANGE EXECUTIVE PASSWORD & SECURITY */}
          {activeTab === 'security' && (
            <div className="max-w-2xl rounded-2xl border border-white/20 bg-[#07090e]/65 p-6 backdrop-blur-xl sm:p-8">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#fe6d2c]/40 bg-[#fe6d2c]/15 text-[#fe6d2c]">
                  <Lock className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-bold text-white">
                    Change Executive Admin Password
                  </h2>
                  <p className="text-xs text-slate-300">
                    Rotate your primary Executive Admin password whenever required. Your session
                    token refreshes automatically.
                  </p>
                </div>
              </div>

              {authMode === 'env' ? (
                <div className="mt-6 rounded-xl border border-amber-400/40 bg-amber-950/50 p-4 text-xs leading-relaxed text-amber-100">
                  Executive authentication is currently governed by the server environment variable{' '}
                  <code className="font-mono">EXECUTIVE_ADMIN_PASSCODE</code>. Update that secret
                  in your deployment Secrets panel to rotate the passcode.
                </div>
              ) : (
                <form onSubmit={handleChangeExecutivePassword} className="mt-6 space-y-4">
                  <div>
                    <label htmlFor="exec-curr-pw" className="block text-xs font-medium text-slate-300">
                      Current Password
                    </label>
                    <input
                      id="exec-curr-pw"
                      type="password"
                      required
                      value={currentExecPw}
                      onChange={(e) => setCurrentExecPw(e.target.value)}
                      placeholder="Enter current Executive password"
                      className="mt-1.5 w-full rounded-xl border border-white/20 bg-[#07090e]/70 px-3.5 py-2.5 text-sm text-white focus:border-[#fe6d2c] focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="exec-new-pw" className="block text-xs font-medium text-slate-300">
                        New Password (8+ characters)
                      </label>
                      <input
                        id="exec-new-pw"
                        type="password"
                        required
                        minLength={8}
                        value={newExecPw}
                        onChange={(e) => setNewExecPw(e.target.value)}
                        placeholder="Enter new strong password"
                        className="mt-1.5 w-full rounded-xl border border-white/20 bg-[#07090e]/70 px-3.5 py-2.5 text-sm text-white focus:border-[#fe6d2c] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label htmlFor="exec-confirm-new-pw" className="block text-xs font-medium text-slate-300">
                        Confirm New Password
                      </label>
                      <input
                        id="exec-confirm-new-pw"
                        type="password"
                        required
                        minLength={8}
                        value={confirmExecPw}
                        onChange={(e) => setConfirmExecPw(e.target.value)}
                        placeholder="Confirm new password"
                        className="mt-1.5 w-full rounded-xl border border-white/20 bg-[#07090e]/70 px-3.5 py-2.5 text-sm text-white focus:border-[#fe6d2c] focus:outline-none"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={pwBusy}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#fe6d2c] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#ff7f44] disabled:opacity-60"
                  >
                    <KeyRound className="h-4 w-4" />
                    <span>{pwBusy ? 'Updating Password...' : 'Update Executive Password'}</span>
                  </button>
                </form>
              )}
            </div>
          )}

          {/* TAB 6: SITE, BOARD & BRANCHES */}
          {activeTab === 'site' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <div className="space-y-4 rounded-2xl border border-white/20 bg-[#07090e]/60 p-6 backdrop-blur-xl">
                  <h2 className="font-display text-lg font-bold text-white">Homepage Copy</h2>
                  <div>
                    <label className="block text-xs text-slate-300">Brand Name</label>
                    <input
                      type="text"
                      value={content.brandName}
                      onChange={(e) => setContent({ ...content, brandName: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-white/20 bg-[#07090e]/70 px-3 py-2 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-300">Hero Headline</label>
                    <input
                      type="text"
                      value={content.heroTitle}
                      onChange={(e) => setContent({ ...content, heroTitle: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-white/20 bg-[#07090e]/70 px-3 py-2 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-300">Hero Subtitle</label>
                    <textarea
                      rows={3}
                      value={content.heroSubtitle}
                      onChange={(e) => setContent({ ...content, heroSubtitle: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-white/20 bg-[#07090e]/70 px-3 py-2 text-sm text-white"
                    />
                  </div>
                </div>

                <div className="space-y-4 rounded-2xl border border-white/20 bg-[#07090e]/60 p-6 backdrop-blur-xl">
                  <div className="flex items-center justify-between">
                    <h2 className="font-display text-lg font-bold text-white">
                      System Reset & Defaults
                    </h2>
                  </div>
                  <p className="text-xs leading-relaxed text-slate-300">
                    Restore official Blord Group homepage copy, 6 Electric Cars, 7 Power Tanks, 16
                    board members, and 10 branch addresses back to initial baseline defaults.
                  </p>
                  {!confirmReset ? (
                    <button
                      type="button"
                      onClick={() => setConfirmReset(true)}
                      className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/[0.06] px-4 py-2 text-xs font-semibold text-white hover:bg-white/15"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Restore Official Defaults</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleResetCms}
                        className="rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-500"
                      >
                        Confirm Full Reset
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmReset(false)}
                        className="rounded-lg border border-white/20 px-4 py-2 text-xs text-slate-200"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-white/20 bg-[#07090e]/60 p-6 backdrop-blur-xl">
                <h2 className="font-display text-lg font-bold text-white">
                  Official Branches ({content.contact.branches.length})
                </h2>
                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                  {content.contact.branches.map((branch, idx) => (
                    <div
                      key={branch.id}
                      className="space-y-2.5 rounded-xl border border-white/15 bg-white/[0.03] p-4"
                    >
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-white">
                          <MapPin className="h-3.5 w-3.5 text-[#fe6d2c]" />
                          <span>{branch.name}</span>
                        </span>
                        <a
                          href={buildGoogleMapsDirectionsUrl(branch)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-[#fe6d2c] hover:underline"
                        >
                          Maps Route →
                        </a>
                      </div>
                      <input
                        type="text"
                        value={branch.address}
                        onChange={(e) => {
                          const next = [...content.contact.branches];
                          next[idx] = { ...branch, address: e.target.value };
                          setContent({
                            ...content,
                            contact: { ...content.contact, branches: next },
                          });
                        }}
                        className="w-full rounded-lg border border-white/15 bg-[#07090e]/70 px-3 py-1.5 text-xs text-white"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
