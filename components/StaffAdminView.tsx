import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  Building2,
  Car,
  CheckCircle2,
  ExternalLink,
  Inbox,
  KeyRound,
  Lock,
  LogIn,
  LogOut,
  MapPin,
  Package,
  Plus,
  RotateCcw,
  Save,
  Search,
  Trash2,
  Users,
  Zap,
} from 'lucide-react';
import type {
  AuthRole,
  BlordSiteContent,
  ContactInquiry,
  NewsletterSubscriber,
  StaffAccountPublic,
  StaffDepartment,
} from '@/lib/blord-types';
import {
  buildGoogleMapsDirectionsUrl,
  formatNaira,
  getStaffAllowedSections,
  getStaffRoleLabel,
  type StaffWorkspaceTab,
} from '@/lib/blord-utils';

type AuthMode = 'unclaimed' | 'claimed' | 'env';
type AdminTab = StaffWorkspaceTab;

const STAFF_DEPARTMENT_OPTIONS: Array<{
  value: StaffDepartment;
  label: string;
  description: string;
}> = [
  {
    value: 'sales',
    label: 'Sales Department',
    description: 'Client leads & inquiries, vehicle/tank stock availability & branches',
  },
  {
    value: 'marketing',
    label: 'Marketing & Growth',
    description: 'Homepage messaging, product copy, campaigns & awards',
  },
  {
    value: 'ict-tech',
    label: 'ICT & Tech Department',
    description: 'Branch coordinates, app links, vehicle & power tank technical specs',
  },
  {
    value: 'maintenance',
    label: 'Maintenance & Technical Support',
    description: 'EV & Power Tank unit status, appliance specs & branch servicing',
  },
  {
    value: 'operations',
    label: 'Operations Manager',
    description: 'Cross-department operational coordination across all branches',
  },
  {
    value: 'inventory',
    label: 'Fleet & Energy Stock Coordinator',
    description: 'Blord Cars, Power Tanks & Product stock status and descriptions',
  },
  {
    value: 'branches',
    label: 'Branch & Logistics Coordinator',
    description: '10 Global Branches, Google Maps routing & logistics inbox',
  },
  {
    value: 'inbox',
    label: 'Customer Relations & Support',
    description: 'Customer inquiries, newsletter subscribers & branch contacts',
  },
  {
    value: 'editorial',
    label: 'Corporate Media & Board Directory',
    description: 'Homepage copy, metrics, awards & leadership directory',
  },
];

export function StaffAdminView({
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
  const [sessionChecking, setSessionChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [staffEmail, setStaffEmail] = useState('');
  const [staffName, setStaffName] = useState('');
  const [staffRole, setStaffRole] = useState<AuthRole>('staff');
  const [staffDepartment, setStaffDepartment] = useState<StaffDepartment>('sales');
  const [staffBranchId, setStaffBranchId] = useState<string>(
    initialContent.contact.branches[0]?.id ?? 'awka-hq'
  );

  // Claim Staff Portal Access form state
  const [claimNameInput, setClaimNameInput] = useState('');
  const [claimEmailInput, setClaimEmailInput] = useState('');
  const [claimDepartmentInput, setClaimDepartmentInput] = useState<StaffDepartment>('sales');
  const [claimBranchInput, setClaimBranchInput] = useState<string>(
    initialContent.contact.branches[0]?.id ?? 'awka-hq'
  );
  const [claimPasswordInput, setClaimPasswordInput] = useState('');
  const [claimConfirmInput, setClaimConfirmInput] = useState('');
  const [claimError, setClaimError] = useState('');
  const [claimBusy, setClaimBusy] = useState(false);

  // Existing Staff Sign In (Bottom Card) form state
  const [loginEmailInput, setLoginEmailInput] = useState(initialClaimedEmail ?? '');
  const [loginPasswordInput, setLoginPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginBusy, setLoginBusy] = useState(false);

  // Staff password change panel
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentStaffPw, setCurrentStaffPw] = useState('');
  const [newStaffPw, setNewStaffPw] = useState('');
  const [confirmStaffPw, setConfirmStaffPw] = useState('');
  const [pwBusy, setPwBusy] = useState(false);

  // CMS state
  const [activeTab, setActiveTab] = useState<AdminTab>('inbox');
  const [content, setContent] = useState<BlordSiteContent>(initialContent);
  const [updatedAt, setUpdatedAt] = useState(initialUpdatedAt);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveMessage, setSaveMessage] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);

  // Inbox & Team Directory state
  const [inquiries, setInquiries] = useState<ContactInquiry[]>([]);
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [directoryStaff, setDirectoryStaff] = useState<StaffAccountPublic[]>([]);
  const [directorySearch, setDirectorySearch] = useState('');
  const [directoryDeptFilter, setDirectoryDeptFilter] = useState<'all' | StaffDepartment>('all');
  const [directoryBranchFilter, setDirectoryBranchFilter] = useState<string>('all');

  const isExecutive = staffRole === 'executive';
  const allowedSections: AdminTab[] = isExecutive
    ? ['home', 'products', 'cars', 'tanks', 'team', 'branches', 'inbox', 'directory']
    : getStaffAllowedSections(staffDepartment);

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

  async function loadInbox(bearerToken?: string | null) {
    try {
      const res = await fetch('/api/inquiries', {
        credentials: 'same-origin',
        headers: buildAuthHeaders(bearerToken),
      });
      if (res.ok) {
        const data = await res.json();
        setInquiries(data.inquiries ?? []);
        setSubscribers(data.subscribers ?? []);
      }
    } catch {
      // Ignore transient load error
    }
  }

  async function loadDirectory(bearerToken?: string | null) {
    try {
      const res = await fetch('/api/auth/directory', {
        credentials: 'same-origin',
        headers: buildAuthHeaders(bearerToken),
      });
      if (res.ok) {
        const data = await res.json();
        setDirectoryStaff(data.staff ?? []);
      }
    } catch {
      // Ignore transient load error
    }
  }

  async function persistPreferences(
    patch: { lastTab?: AdminTab; branchId?: string },
    bearerToken?: string | null
  ) {
    try {
      await fetch('/api/auth/preferences', {
        method: 'POST',
        credentials: 'same-origin',
        headers: buildAuthHeaders(bearerToken ?? token, true),
        body: JSON.stringify(patch),
      });
    } catch {
      // Non-blocking preference save
    }
  }

  function applyAuthenticatedSession(data: {
    token?: string | null;
    email: string;
    name?: string;
    department?: StaffDepartment;
    branchId?: string;
    lastTab?: string;
    role?: AuthRole;
  }) {
    const resolvedRole: AuthRole = data.role === 'executive' ? 'executive' : 'staff';
    const resolvedDept: StaffDepartment = data.department ?? 'operations';
    const resolvedBranch = data.branchId ?? content.contact.branches[0]?.id ?? 'awka-hq';
    const nextToken = data.token ?? null;
    setIsAuthenticated(true);
    setToken(nextToken);
    setStaffEmail(data.email);
    setStaffName(data.name ?? data.email);
    setStaffRole(resolvedRole);
    setStaffDepartment(resolvedDept);
    setStaffBranchId(resolvedBranch);

    const allowed: AdminTab[] =
      resolvedRole === 'executive'
        ? ['home', 'products', 'cars', 'tanks', 'team', 'branches', 'inbox', 'directory']
        : getStaffAllowedSections(resolvedDept);

    const candidateTab = data.lastTab as AdminTab | undefined;
    const resolvedTab = candidateTab && allowed.includes(candidateTab) ? candidateTab : (allowed[0] ?? 'directory');
    setActiveTab(resolvedTab);

    if (allowed.includes('inbox')) {
      void loadInbox(nextToken);
    }
    void loadDirectory(nextToken);
  }

  // Auto-restore non-expiring session cookie on mount so staff stay signed in until explicit Sign Out
  useEffect(() => {
    let cancelled = false;
    fetch('/api/auth/session', { credentials: 'same-origin' })
      .then((res) => (res.ok ? res.json() : { authenticated: false }))
      .then((data) => {
        if (!cancelled && data?.authenticated) {
          applyAuthenticatedSession({
            email: data.email,
            name: data.name,
            department: data.department,
            branchId: data.branchId,
            lastTab: data.lastTab,
            role: data.role,
          });
        }
      })
      .catch(() => {
        // Ignore network error during session probe
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
    setClaimError('');
    if (claimPasswordInput !== claimConfirmInput) {
      setClaimError('Passwords do not match.');
      return;
    }
    setClaimBusy(true);
    try {
      const res = await fetch('/api/auth/claim', {
        method: 'POST',
        credentials: 'same-origin',
        headers: buildAuthHeaders(null, true),
        body: JSON.stringify({
          name: claimNameInput,
          email: claimEmailInput,
          password: claimPasswordInput,
          department: claimDepartmentInput,
          branchId: claimBranchInput,
          title: getStaffRoleLabel(claimDepartmentInput),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setClaimError(data.error ?? 'Could not claim staff portal access.');
        return;
      }
      applyAuthenticatedSession(data);
      setAuthMode('claimed');
      setClaimPasswordInput('');
      setClaimConfirmInput('');
    } catch {
      setClaimError('Network error while setting up staff account.');
    } finally {
      setClaimBusy(false);
    }
  }

  async function handleLoginSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoginError('');
    setLoginBusy(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'same-origin',
        headers: buildAuthHeaders(null, true),
        body: JSON.stringify({ email: loginEmailInput, password: loginPasswordInput }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLoginError(data.error ?? 'Invalid credentials.');
        return;
      }
      applyAuthenticatedSession(data);
      setLoginPasswordInput('');
    } catch {
      setLoginError('Network error while signing in.');
    } finally {
      setLoginBusy(false);
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
      // Ignore network hiccup during sign-out
    }
    setIsAuthenticated(false);
    setToken(null);
    setStaffEmail('');
    setStaffName('');
  }

  async function handleStaffPasswordChange(e: React.FormEvent) {
    e.preventDefault();
    if (!isAuthenticated) return;
    if (newStaffPw !== confirmStaffPw) {
      setSaveStatus('error');
      setSaveMessage('New password and confirmation do not match.');
      return;
    }
    setPwBusy(true);
    setSaveMessage('');
    try {
      const res = await fetch('/api/auth/password', {
        method: 'POST',
        credentials: 'same-origin',
        headers: buildAuthHeaders(token, true),
        body: JSON.stringify({
          currentPassword: currentStaffPw,
          newPassword: newStaffPw,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSaveStatus('error');
        setSaveMessage(data.error ?? 'Could not update your password.');
        return;
      }
      setToken(data.token);
      setCurrentStaffPw('');
      setNewStaffPw('');
      setConfirmStaffPw('');
      setShowChangePassword(false);
      setSaveStatus('saved');
      setSaveMessage('Your Staff Portal password was updated successfully.');
    } catch {
      setSaveStatus('error');
      setSaveMessage('Network error while updating your password.');
    } finally {
      setPwBusy(false);
    }
  }

  async function handleSaveCms() {
    if (!isAuthenticated || !content) return;
    setSaveStatus('saving');
    setSaveMessage('');
    try {
      const res = await fetch('/api/cms', {
        method: 'PUT',
        credentials: 'same-origin',
        headers: buildAuthHeaders(token, true),
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSaveStatus('error');
        setSaveMessage(data.error ?? 'Could not save changes.');
        return;
      }
      setContent(data.content);
      setUpdatedAt(data.updatedAt ?? '');
      onContentChange?.(data.content, data.updatedAt ?? '');
      setSaveStatus('saved');
      setSaveMessage('Role-authorized website updates saved live.');
    } catch {
      setSaveStatus('error');
      setSaveMessage('Network error while saving changes.');
    }
  }

  async function handleResetCms() {
    if (!isAuthenticated) return;
    setSaveStatus('saving');
    setSaveMessage('');
    try {
      const res = await fetch('/api/cms/reset', {
        method: 'POST',
        credentials: 'same-origin',
        headers: buildAuthHeaders(token, true),
      });
      const data = await res.json();
      if (!res.ok) {
        setSaveStatus('error');
        setSaveMessage(data.error ?? 'Could not reset content.');
        return;
      }
      setContent(data.content);
      setUpdatedAt(data.updatedAt ?? '');
      onContentChange?.(data.content, data.updatedAt ?? '');
      setConfirmReset(false);
      setSaveStatus('saved');
      setSaveMessage('Restored all sections to official Blord Group defaults.');
    } catch {
      setSaveStatus('error');
      setSaveMessage('Network error during reset.');
    }
  }

  if (sessionChecking) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-140px)] max-w-lg items-center justify-center px-4 py-16">
        <div className="w-full rounded-3xl border border-white/20 bg-[#07090e]/65 p-8 text-center shadow-2xl backdrop-blur-xl">
          <p className="text-sm font-medium text-slate-200">Restoring your Staff Portal workspace...</p>
        </div>
      </div>
    );
  }

  // AUTH GATE: Claim Staff Portal Access (Top) + Already Have Staff Access Sign In (Bottom)
  if (!isAuthenticated) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-140px)] max-w-3xl flex-col justify-center gap-8 px-4 py-14 sm:px-6">
        {/* SECTION 1: CLAIM STAFF PORTAL ACCESS */}
        <section className="w-full rounded-3xl border border-white/20 bg-[#07090e]/65 p-8 shadow-2xl backdrop-blur-xl sm:p-10">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#fe6d2c]/15 text-[#fe6d2c]">
              <KeyRound className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#fe6d2c]">
                Blord Group Team Onboarding
              </p>
              <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">
                Claim Staff Portal Access
              </h1>
            </div>
          </div>

          <p className="mt-4 text-sm leading-relaxed text-slate-200">
            Select your Blord Group department (Sales, Marketing, ICT & Tech, Maintenance,
            Operations, Inventory, Branches, or Customer Support) and assigned branch office to
            activate your persistent staff desk. Your session stays signed in until you choose to
            Sign Out.
          </p>

          <form onSubmit={handleClaimSubmit} className="mt-6 space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="claim-staff-name" className="block text-xs font-medium text-slate-300">
                  Staff Full Name
                </label>
                <input
                  id="claim-staff-name"
                  type="text"
                  required
                  value={claimNameInput}
                  onChange={(e) => setClaimNameInput(e.target.value)}
                  placeholder="e.g. Chinedu Okonkwo"
                  className="mt-1.5 w-full rounded-lg border border-white/20 bg-[#07090e]/70 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-400 focus:border-[#fe6d2c] focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="claim-staff-email" className="block text-xs font-medium text-slate-300">
                  Company Email
                </label>
                <input
                  id="claim-staff-email"
                  type="email"
                  required
                  value={claimEmailInput}
                  onChange={(e) => setClaimEmailInput(e.target.value)}
                  placeholder="name@blordholdings.com"
                  className="mt-1.5 w-full rounded-lg border border-white/20 bg-[#07090e]/70 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-400 focus:border-[#fe6d2c] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="claim-staff-dept" className="block text-xs font-medium text-slate-300">
                  Assigned Department
                </label>
                <select
                  id="claim-staff-dept"
                  value={claimDepartmentInput}
                  onChange={(e) => setClaimDepartmentInput(e.target.value as StaffDepartment)}
                  className="mt-1.5 w-full rounded-lg border border-white/20 bg-[#07090e]/90 px-3.5 py-2.5 text-sm text-white focus:border-[#fe6d2c] focus:outline-none"
                >
                  {STAFF_DEPARTMENT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] text-slate-300">
                  {STAFF_DEPARTMENT_OPTIONS.find((d) => d.value === claimDepartmentInput)?.description}
                </p>
              </div>

              <div>
                <label htmlFor="claim-staff-branch" className="block text-xs font-medium text-slate-300">
                  Assigned Office / Branch
                </label>
                <select
                  id="claim-staff-branch"
                  value={claimBranchInput}
                  onChange={(e) => setClaimBranchInput(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-white/20 bg-[#07090e]/90 px-3.5 py-2.5 text-sm text-white focus:border-[#fe6d2c] focus:outline-none"
                >
                  {content.contact.branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name} ({branch.region})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="claim-staff-password" className="block text-xs font-medium text-slate-300">
                  Create Password (8+ chars)
                </label>
                <input
                  id="claim-staff-password"
                  type="password"
                  required
                  minLength={8}
                  value={claimPasswordInput}
                  onChange={(e) => setClaimPasswordInput(e.target.value)}
                  placeholder="Minimum 8 characters"
                  className="mt-1.5 w-full rounded-lg border border-white/20 bg-[#07090e]/70 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-400 focus:border-[#fe6d2c] focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="claim-staff-confirm" className="block text-xs font-medium text-slate-300">
                  Confirm Password
                </label>
                <input
                  id="claim-staff-confirm"
                  type="password"
                  required
                  minLength={8}
                  value={claimConfirmInput}
                  onChange={(e) => setClaimConfirmInput(e.target.value)}
                  placeholder="Re-enter password"
                  className="mt-1.5 w-full rounded-lg border border-white/20 bg-[#07090e]/70 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-400 focus:border-[#fe6d2c] focus:outline-none"
                />
              </div>
            </div>

            {claimError && (
              <p
                role="alert"
                className="rounded-lg border border-red-500/40 bg-red-950/75 px-3.5 py-2.5 text-xs text-red-100"
              >
                {claimError}
              </p>
            )}

            <button
              type="submit"
              disabled={claimBusy}
              className="w-full rounded-xl bg-[#fe6d2c] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#ff7f44] disabled:opacity-60"
            >
              {claimBusy ? 'Setting up Staff Desk...' : 'Claim Staff Portal Access & Enter'}
            </button>
          </form>
        </section>

        {/* SECTION 2 (BOTTOM): STAFF LOGIN FOR TEAM MEMBERS WHO ALREADY HAVE ACCESS */}
        <section
          id="staff-existing-login"
          className="w-full rounded-3xl border border-white/20 bg-[#07090e]/75 p-8 shadow-2xl backdrop-blur-xl sm:p-10"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/[0.06] text-[#fe6d2c]">
                <LogIn className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-[#fe6d2c]">Existing Staff Account</p>
                <h2 className="font-display text-xl font-bold text-white">
                  Already Have Staff Portal Access? Sign In
                </h2>
              </div>
            </div>
            {authMode === 'env' && (
              <span className="rounded-lg border border-white/15 bg-white/[0.05] px-3 py-1 text-[11px] text-slate-300">
                Server Passcode Active
              </span>
            )}
          </div>

          <p className="mt-3 text-xs leading-relaxed text-slate-300">
            Log in below to continue right where you left off in your department workspace.
          </p>

          <form onSubmit={handleLoginSubmit} className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-12 sm:items-end">
            <div className="sm:col-span-5">
              <label htmlFor="login-staff-email" className="block text-xs font-medium text-slate-300">
                Staff Email
              </label>
              <input
                id="login-staff-email"
                type="email"
                required
                value={loginEmailInput}
                onChange={(e) => setLoginEmailInput(e.target.value)}
                placeholder="staff@blordholdings.com"
                className="mt-1.5 w-full rounded-lg border border-white/20 bg-[#07090e]/70 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-400 focus:border-[#fe6d2c] focus:outline-none"
              />
            </div>

            <div className="sm:col-span-4">
              <label htmlFor="login-staff-password" className="block text-xs font-medium text-slate-300">
                Password
              </label>
              <input
                id="login-staff-password"
                type="password"
                required
                value={loginPasswordInput}
                onChange={(e) => setLoginPasswordInput(e.target.value)}
                placeholder="Enter password"
                className="mt-1.5 w-full rounded-lg border border-white/20 bg-[#07090e]/70 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-400 focus:border-[#fe6d2c] focus:outline-none"
              />
            </div>

            <div className="sm:col-span-3">
              <button
                type="submit"
                disabled={loginBusy}
                className="w-full rounded-xl border border-[#fe6d2c] bg-[#fe6d2c]/15 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#fe6d2c] disabled:opacity-60"
              >
                {loginBusy ? 'Signing In...' : 'Sign In'}
              </button>
            </div>
          </form>

          {loginError && (
            <p
              role="alert"
              className="mt-4 rounded-lg border border-red-500/40 bg-red-950/75 px-3.5 py-2.5 text-xs text-red-100"
            >
              {loginError}
            </p>
          )}

          <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-white/15 pt-4 text-xs text-slate-300">
            <span>Authorized Executive Admin (Prices, Photo Uploads & New Products)?</span>
            <Link to="/executive-admin" className="font-semibold text-[#fe6d2c] hover:underline">
              Open Admin Backend →
            </Link>
          </div>
        </section>
      </div>
    );
  }

  const allTabs: Array<{ id: AdminTab; label: string; icon: typeof Building2 }> = [
    { id: 'inbox', label: `Client Inbox (${inquiries.length})`, icon: Inbox },
    { id: 'cars', label: `Blord Cars (${content.cars?.length ?? 0})`, icon: Car },
    { id: 'tanks', label: `Power Tanks (${content.powerTanks?.length ?? 0})`, icon: Zap },
    { id: 'products', label: `Products (${content.products.length})`, icon: Package },
    { id: 'branches', label: `Branches & Maps (${content.contact.branches.length})`, icon: MapPin },
    { id: 'home', label: 'Home & Metrics', icon: Building2 },
    { id: 'team', label: `Board & About (${content.about.boardMembers.length})`, icon: Users },
    { id: 'directory', label: 'Team & Branches Directory', icon: Briefcase },
  ];

  const visibleTabs = allTabs.filter((t) => allowedSections.includes(t.id));
  const assignedBranch = content.contact.branches.find((b) => b.id === staffBranchId);

  // AUTHENTICATED ROLE-SCOPED STAFF PORTAL
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Top Toolbar */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-white/20 bg-[#07090e]/60 p-6 backdrop-blur-xl lg:flex-row lg:items-center">
        <div>
          <p className="text-xs font-medium text-[#fe6d2c]">
            {staffName} · {isExecutive ? 'Executive Session' : getStaffRoleLabel(staffDepartment)} ·{' '}
            {assignedBranch ? `${assignedBranch.name} (${assignedBranch.region})` : 'Awka HQ'} ·{' '}
            <span className="font-mono">{staffEmail}</span>
          </p>
          <h1 className="mt-1 font-display text-2xl font-bold text-white">
            Blord Group Role Operations Portal
          </h1>
          <p className="mt-1 text-xs text-slate-300">
            Persistent session active — stays signed in until you click Sign Out.
            {updatedAt ? ` Last saved: ${new Date(updatedAt).toLocaleString()}` : ''}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowChangePassword((prev) => !prev)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/[0.06] px-3.5 py-2 text-xs font-medium text-slate-100 whitespace-nowrap hover:bg-white/15"
          >
            <KeyRound className="h-3.5 w-3.5 text-[#fe6d2c]" />
            <span>Change Password</span>
          </button>

          <Link
            to="/"
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/[0.04] px-3.5 py-2 text-xs font-medium text-slate-200 whitespace-nowrap hover:bg-white/10"
          >
            <span>View Live Site</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>

          {isExecutive && (
            <>
              {!confirmReset ? (
                <button
                  type="button"
                  onClick={() => setConfirmReset(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/[0.04] px-3.5 py-2 text-xs font-medium text-slate-300 whitespace-nowrap hover:bg-white/10"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Restore Defaults</span>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleResetCms}
                    className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-500"
                  >
                    Confirm Reset
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmReset(false)}
                    className="rounded-lg border border-white/15 px-3 py-2 text-xs text-slate-300"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </>
          )}

          {allowedSections.some((s) => s !== 'inbox' && s !== 'directory') && (
            <button
              type="button"
              onClick={handleSaveCms}
              disabled={saveStatus === 'saving'}
              className="inline-flex items-center gap-2 rounded-lg bg-[#fe6d2c] px-5 py-2 text-xs font-semibold text-white whitespace-nowrap hover:bg-[#ff7f44] disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              <span>{saveStatus === 'saving' ? 'Saving...' : 'Save Changes'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => void handleLogout()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-white/10"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Staff Password Change Drawer */}
      {showChangePassword && (
        <form
          onSubmit={handleStaffPasswordChange}
          className="mt-4 rounded-2xl border border-[#fe6d2c]/40 bg-[#07090e]/75 p-5 backdrop-blur-xl"
        >
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-display text-sm font-bold text-white">
              Update Your Staff Portal Password
            </h2>
            <button
              type="button"
              onClick={() => setShowChangePassword(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Close
            </button>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-4">
            <input
              type="password"
              required
              value={currentStaffPw}
              onChange={(e) => setCurrentStaffPw(e.target.value)}
              placeholder="Current password"
              className="rounded-lg border border-white/20 bg-[#07090e]/70 px-3 py-2 text-xs text-white"
            />
            <input
              type="password"
              required
              minLength={8}
              value={newStaffPw}
              onChange={(e) => setNewStaffPw(e.target.value)}
              placeholder="New password (8+ chars)"
              className="rounded-lg border border-white/20 bg-[#07090e]/70 px-3 py-2 text-xs text-white"
            />
            <input
              type="password"
              required
              minLength={8}
              value={confirmStaffPw}
              onChange={(e) => setConfirmStaffPw(e.target.value)}
              placeholder="Confirm new password"
              className="rounded-lg border border-white/20 bg-[#07090e]/70 px-3 py-2 text-xs text-white"
            />
            <button
              type="submit"
              disabled={pwBusy}
              className="rounded-lg bg-[#fe6d2c] px-4 py-2 text-xs font-semibold text-white hover:bg-[#ff7f44] disabled:opacity-60"
            >
              {pwBusy ? 'Updating...' : 'Save New Password'}
            </button>
          </div>
        </form>
      )}

      {saveMessage && (
        <div
          role="status"
          className={`mt-4 flex items-center gap-2 rounded-xl border px-4 py-3 text-xs font-medium backdrop-blur-md ${
            saveStatus === 'saved'
              ? 'border-emerald-400/50 bg-emerald-950/85 text-emerald-100'
              : 'border-red-400/50 bg-red-950/85 text-red-100'
          }`}
        >
          {saveStatus === 'saved' && <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-300" />}
          <span>{saveMessage}</span>
        </div>
      )}

      {/* Role-Filtered Navigation Tabs */}
      <div className="mt-6 flex flex-wrap gap-2 border-b border-white/10 pb-4" role="tablist">
        {visibleTabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => {
                setActiveTab(tab.id);
                void persistPreferences({ lastTab: tab.id });
                if (tab.id === 'inbox') {
                  void loadInbox(token);
                } else if (tab.id === 'directory') {
                  void loadDirectory(token);
                }
              }}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-semibold whitespace-nowrap transition-colors ${
                active
                  ? 'bg-[#fe6d2c] text-white'
                  : 'border border-white/15 bg-[#07090e]/55 text-slate-200 backdrop-blur-md hover:bg-white/10'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: HOME & METRICS */}
      {activeTab === 'home' && allowedSections.includes('home') && (
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="space-y-4 rounded-2xl border border-white/10 bg-[#07090e]/55 p-6 backdrop-blur-md">
            <h2 className="font-display text-lg font-bold text-white">Hero & Core Messaging</h2>
            <div>
              <label className="block text-xs font-medium text-slate-400">Brand Name</label>
              <input
                type="text"
                value={content.brandName}
                onChange={(e) => setContent({ ...content, brandName: e.target.value })}
                className="mt-1 w-full rounded-lg border border-white/15 bg-[#07090e]/65 px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400">Hero Headline</label>
              <input
                type="text"
                value={content.heroTitle}
                onChange={(e) => setContent({ ...content, heroTitle: e.target.value })}
                className="mt-1 w-full rounded-lg border border-white/15 bg-[#07090e]/65 px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400">Hero Subtitle</label>
              <textarea
                rows={3}
                value={content.heroSubtitle}
                onChange={(e) => setContent({ ...content, heroSubtitle: e.target.value })}
                className="mt-1 w-full rounded-lg border border-white/15 bg-[#07090e]/65 px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400">Innovation Headline</label>
              <input
                type="text"
                value={content.innovationHeadline}
                onChange={(e) => setContent({ ...content, innovationHeadline: e.target.value })}
                className="mt-1 w-full rounded-lg border border-white/15 bg-[#07090e]/65 px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400">Trust Banner Headline</label>
              <input
                type="text"
                value={content.trustHeadline}
                onChange={(e) => setContent({ ...content, trustHeadline: e.target.value })}
                className="mt-1 w-full rounded-lg border border-white/15 bg-[#07090e]/65 px-3 py-2 text-sm text-white"
              />
            </div>
          </div>

          <div className="space-y-4 rounded-2xl border border-white/10 bg-[#07090e]/55 p-6 backdrop-blur-md">
            <h2 className="font-display text-lg font-bold text-white">Headline Metrics</h2>
            {content.heroStats.map((stat, idx) => (
              <div key={stat.id} className="grid grid-cols-3 gap-3 rounded-xl border border-white/10 p-3">
                <div>
                  <label className="block text-xs text-slate-400">Value</label>
                  <input
                    type="text"
                    value={stat.value}
                    onChange={(e) => {
                      const next = [...content.heroStats];
                      next[idx] = { ...stat, value: e.target.value };
                      setContent({ ...content, heroStats: next });
                    }}
                    className="mt-1 w-full rounded-lg border border-white/15 bg-[#07090e]/65 px-3 py-2 font-mono text-sm text-white"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-slate-400">Label</label>
                  <input
                    type="text"
                    value={stat.label}
                    onChange={(e) => {
                      const next = [...content.heroStats];
                      next[idx] = { ...stat, label: e.target.value };
                      setContent({ ...content, heroStats: next });
                    }}
                    className="mt-1 w-full rounded-lg border border-white/15 bg-[#07090e]/65 px-3 py-2 text-sm text-white"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: PRODUCTS */}
      {activeTab === 'products' && allowedSections.includes('products') && (
        <div className="mt-8 space-y-5">
          {!isExecutive && (
            <div className="flex items-center justify-between gap-4 rounded-2xl border border-amber-400/35 bg-amber-950/50 px-5 py-3.5 text-xs text-amber-100 backdrop-blur-md">
              <span className="flex items-center gap-2">
                <Lock className="h-4 w-4 shrink-0 text-[#fe6d2c]" />
                <span>
                  Staff members can refine product copy. Launching new products, changing prices, or
                  uploading product images is restricted to Executive Admin.
                </span>
              </span>
              <Link
                to="/executive-admin"
                className="font-semibold text-[#fe6d2c] whitespace-nowrap hover:underline"
              >
                Open Executive Admin →
              </Link>
            </div>
          )}

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {content.products.map((product, idx) => (
              <div
                key={product.slug}
                className="space-y-3 rounded-2xl border border-white/10 bg-[#07090e]/55 p-6 backdrop-blur-md"
              >
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-lg font-bold text-white">{product.name}</h2>
                  <span className="font-mono text-xs text-[#fe6d2c]">/products/{product.slug}</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400">Name</label>
                    <input
                      type="text"
                      value={product.name}
                      onChange={(e) => {
                        const next = [...content.products];
                        next[idx] = { ...product, name: e.target.value };
                        setContent({ ...content, products: next });
                      }}
                      className="mt-1 w-full rounded-lg border border-white/15 bg-[#07090e]/65 px-3 py-2 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400">Category</label>
                    <input
                      type="text"
                      value={product.category}
                      onChange={(e) => {
                        const next = [...content.products];
                        next[idx] = { ...product, category: e.target.value };
                        setContent({ ...content, products: next });
                      }}
                      className="mt-1 w-full rounded-lg border border-white/15 bg-[#07090e]/65 px-3 py-2 text-sm text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-slate-400">Tagline</label>
                  <input
                    type="text"
                    value={product.tagline}
                    onChange={(e) => {
                      const next = [...content.products];
                      next[idx] = { ...product, tagline: e.target.value };
                      setContent({ ...content, products: next });
                    }}
                    className="mt-1 w-full rounded-lg border border-white/15 bg-[#07090e]/65 px-3 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400">Summary</label>
                  <input
                    type="text"
                    value={product.summary}
                    onChange={(e) => {
                      const next = [...content.products];
                      next[idx] = { ...product, summary: e.target.value };
                      setContent({ ...content, products: next });
                    }}
                    className="mt-1 w-full rounded-lg border border-white/15 bg-[#07090e]/65 px-3 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400">Full Description</label>
                  <textarea
                    rows={3}
                    value={product.description}
                    onChange={(e) => {
                      const next = [...content.products];
                      next[idx] = { ...product, description: e.target.value };
                      setContent({ ...content, products: next });
                    }}
                    className="mt-1 w-full rounded-lg border border-white/15 bg-[#07090e]/65 px-3 py-2 text-sm text-white"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: BLORD CARS STOCK & SPECS */}
      {activeTab === 'cars' && allowedSections.includes('cars') && (
        <div className="mt-8 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/15 bg-[#07090e]/60 p-5 backdrop-blur-md">
            <div>
              <h2 className="font-display text-xl font-bold text-white">
                Blord Cars Fleet ({content.cars?.length ?? 0})
              </h2>
              <p className="mt-1 text-xs text-slate-200">
                {isExecutive
                  ? 'Full Executive control over vehicle prices and models.'
                  : 'Role access: update vehicle availability status, specs, and driving range. Pricing & photo uploads are managed in Executive Admin (/executive-admin).'}
              </p>
            </div>
            {!isExecutive && (
              <Link
                to="/executive-admin"
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#fe6d2c]/50 bg-[#fe6d2c]/15 px-3.5 py-2 text-xs font-semibold text-white whitespace-nowrap hover:bg-[#fe6d2c]/30"
              >
                <Lock className="h-3.5 w-3.5 text-[#fe6d2c]" />
                <span>Executive Price & Photo Control</span>
              </Link>
            )}
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {(content.cars ?? []).map((car, idx) => (
              <div
                key={car.id}
                className="space-y-3 rounded-2xl border border-white/15 bg-[#07090e]/55 p-6 backdrop-blur-md"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[#fe6d2c]">
                    {formatNaira(car.priceNgn)}
                  </span>
                  {!isExecutive && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                      <Lock className="h-3 w-3" />
                      <span>Price locked to Executive Admin</span>
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs text-slate-400">Vehicle Name</label>
                    <input
                      type="text"
                      value={car.name}
                      onChange={(e) => {
                        const next = [...(content.cars ?? [])];
                        next[idx] = { ...car, name: e.target.value };
                        setContent({ ...content, cars: next });
                      }}
                      className="mt-1 w-full rounded-lg border border-white/15 bg-[#07090e]/65 px-3 py-2 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400">Price (NGN)</label>
                    <input
                      type="number"
                      disabled={!isExecutive}
                      value={car.priceNgn}
                      onChange={(e) => {
                        if (!isExecutive) return;
                        const next = [...(content.cars ?? [])];
                        next[idx] = { ...car, priceNgn: Number(e.target.value) || 0 };
                        setContent({ ...content, cars: next });
                      }}
                      className="mt-1 w-full rounded-lg border border-white/15 bg-[#07090e]/65 px-3 py-2 font-mono text-sm text-white disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs text-slate-400">Stock Status</label>
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
                      className="mt-1 w-full rounded-lg border border-white/15 bg-[#07090e]/85 px-3 py-2 text-sm text-white"
                    >
                      <option value="Available">Available</option>
                      <option value="Low Stock">Low Stock</option>
                      <option value="Pre-Order">Pre-Order</option>
                      <option value="Sold Out">Sold Out</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400">Range & Battery</label>
                    <input
                      type="text"
                      value={car.rangeKm}
                      onChange={(e) => {
                        const next = [...(content.cars ?? [])];
                        next[idx] = { ...car, rangeKm: e.target.value };
                        setContent({ ...content, cars: next });
                      }}
                      className="mt-1 w-full rounded-lg border border-white/15 bg-[#07090e]/65 px-3 py-2 text-sm text-white"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: POWER TANKS STOCK & SPECS */}
      {activeTab === 'tanks' && allowedSections.includes('tanks') && (
        <div className="mt-8 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/15 bg-[#07090e]/60 p-5 backdrop-blur-md">
            <div>
              <h2 className="font-display text-xl font-bold text-white">
                Blord Power Tanks & Blunt Solar Generators ({content.powerTanks?.length ?? 0})
              </h2>
              <p className="mt-1 text-xs text-slate-200">
                {isExecutive
                  ? 'Full Executive control over power tank prices and models.'
                  : 'Role access: update unit stock status and supported appliances. Pricing & photo uploads are managed in Executive Admin (/executive-admin).'}
              </p>
            </div>
            {!isExecutive && (
              <Link
                to="/executive-admin"
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#fe6d2c]/50 bg-[#fe6d2c]/15 px-3.5 py-2 text-xs font-semibold text-white whitespace-nowrap hover:bg-[#fe6d2c]/30"
              >
                <Lock className="h-3.5 w-3.5 text-[#fe6d2c]" />
                <span>Executive Price & Photo Control</span>
              </Link>
            )}
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {(content.powerTanks ?? []).map((tank, idx) => (
              <div
                key={tank.id}
                className="space-y-3 rounded-2xl border border-white/15 bg-[#07090e]/55 p-6 backdrop-blur-md"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[#fe6d2c]">
                    {tank.capacityWatt} · {formatNaira(tank.priceNgn)}
                  </span>
                  {!isExecutive && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                      <Lock className="h-3 w-3" />
                      <span>Price locked to Executive Admin</span>
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs text-slate-400">Model Name</label>
                    <input
                      type="text"
                      value={tank.name}
                      onChange={(e) => {
                        const next = [...(content.powerTanks ?? [])];
                        next[idx] = { ...tank, name: e.target.value };
                        setContent({ ...content, powerTanks: next });
                      }}
                      className="mt-1 w-full rounded-lg border border-white/15 bg-[#07090e]/65 px-3 py-2 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400">Price (NGN)</label>
                    <input
                      type="number"
                      disabled={!isExecutive}
                      value={tank.priceNgn}
                      onChange={(e) => {
                        if (!isExecutive) return;
                        const next = [...(content.powerTanks ?? [])];
                        next[idx] = { ...tank, priceNgn: Number(e.target.value) || 0 };
                        setContent({ ...content, powerTanks: next });
                      }}
                      className="mt-1 w-full rounded-lg border border-white/15 bg-[#07090e]/65 px-3 py-2 font-mono text-sm text-white disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs text-slate-400">Stock Status</label>
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
                      className="mt-1 w-full rounded-lg border border-white/15 bg-[#07090e]/85 px-3 py-2 text-sm text-white"
                    >
                      <option value="Available">Available</option>
                      <option value="Low Stock">Low Stock</option>
                      <option value="Sold Out">Sold Out</option>
                      <option value="Coming Soon">Coming Soon</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400">Appliances Supported</label>
                    <input
                      type="text"
                      value={tank.appliances}
                      onChange={(e) => {
                        const next = [...(content.powerTanks ?? [])];
                        next[idx] = { ...tank, appliances: e.target.value };
                        setContent({ ...content, powerTanks: next });
                      }}
                      className="mt-1 w-full rounded-lg border border-white/15 bg-[#07090e]/65 px-3 py-2 text-sm text-white"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: TEAM & ABOUT */}
      {activeTab === 'team' && allowedSections.includes('team') && (
        <div className="mt-8 space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold text-white">
              Board Members & Staff ({content.about.boardMembers.length})
            </h2>
            <button
              type="button"
              onClick={() => {
                const nextId =
                  Math.max(0, ...content.about.boardMembers.map((m) => m.id)) + 1;
                setContent({
                  ...content,
                  about: {
                    ...content.about,
                    boardMembers: [
                      ...content.about.boardMembers,
                      {
                        id: nextId,
                        name: 'New Staff Member',
                        role: 'Role Title',
                        image: '/assets/team/ceo-office.jpg',
                        alt: 'Blord Group team member',
                        email: '',
                        phone: '',
                      },
                    ],
                  },
                });
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#fe6d2c] px-4 py-2 text-xs font-semibold text-white hover:bg-[#ff7f44]"
            >
              <Plus className="h-4 w-4" />
              <span>Add Staff Member</span>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {content.about.boardMembers.map((member, idx) => (
              <div
                key={member.id}
                className="space-y-3 rounded-2xl border border-white/10 bg-[#07090e]/55 p-5 backdrop-blur-md"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-[#fe6d2c]">Member #{member.id}</span>
                  <button
                    type="button"
                    aria-label={`Remove ${member.name}`}
                    onClick={() => {
                      if (content.about.boardMembers.length <= 1) return;
                      const next = content.about.boardMembers.filter((m) => m.id !== member.id);
                      setContent({
                        ...content,
                        about: { ...content.about, boardMembers: next },
                      });
                    }}
                    className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-red-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Remove</span>
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400">Full Name</label>
                    <input
                      type="text"
                      value={member.name}
                      onChange={(e) => {
                        const next = [...content.about.boardMembers];
                        next[idx] = { ...member, name: e.target.value };
                        setContent({
                          ...content,
                          about: { ...content.about, boardMembers: next },
                        });
                      }}
                      className="mt-1 w-full rounded-lg border border-white/15 bg-[#07090e]/65 px-3 py-2 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400">Role</label>
                    <input
                      type="text"
                      value={member.role}
                      onChange={(e) => {
                        const next = [...content.about.boardMembers];
                        next[idx] = { ...member, role: e.target.value };
                        setContent({
                          ...content,
                          about: { ...content.about, boardMembers: next },
                        });
                      }}
                      className="mt-1 w-full rounded-lg border border-white/15 bg-[#07090e]/65 px-3 py-2 text-sm text-white"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: BRANCHES & GOOGLE MAPS */}
      {activeTab === 'branches' && allowedSections.includes('branches') && (
        <div className="mt-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold text-white">
              Branch Locations & Google Maps Targets ({content.contact.branches.length})
            </h2>
            <button
              type="button"
              onClick={() => {
                setContent({
                  ...content,
                  contact: {
                    ...content.contact,
                    branches: [
                      ...content.contact.branches,
                      {
                        id: `branch-${Date.now()}`,
                        name: 'New Blordgroup Branch',
                        region: 'City, Nigeria',
                        address: 'Street Address',
                        phone: '+234 802 500 0083',
                        email: 'cro@blordholdings.com',
                        mapQuery: 'Street Address, City, Nigeria',
                        landmarkHint: 'Building / Plaza landmark',
                      },
                    ],
                  },
                });
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#fe6d2c] px-4 py-2 text-xs font-semibold text-white hover:bg-[#ff7f44]"
            >
              <Plus className="h-4 w-4" />
              <span>Add Branch</span>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {content.contact.branches.map((branch, idx) => (
              <div
                key={branch.id}
                className="space-y-3 rounded-2xl border border-white/10 bg-[#07090e]/55 p-6 backdrop-blur-md"
              >
                <div className="flex items-center justify-between">
                  <a
                    href={buildGoogleMapsDirectionsUrl(branch)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-[#fe6d2c] hover:underline"
                  >
                    <span>Test Google Maps Route</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                  <button
                    type="button"
                    aria-label={`Delete ${branch.name}`}
                    onClick={() => {
                      if (content.contact.branches.length <= 1) return;
                      const next = content.contact.branches.filter((b) => b.id !== branch.id);
                      setContent({
                        ...content,
                        contact: { ...content.contact, branches: next },
                      });
                    }}
                    className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-red-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Remove</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400">Branch Name</label>
                    <input
                      type="text"
                      value={branch.name}
                      onChange={(e) => {
                        const next = [...content.contact.branches];
                        next[idx] = { ...branch, name: e.target.value };
                        setContent({
                          ...content,
                          contact: { ...content.contact, branches: next },
                        });
                      }}
                      className="mt-1 w-full rounded-lg border border-white/15 bg-[#07090e]/65 px-3 py-2 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400">Region</label>
                    <input
                      type="text"
                      value={branch.region}
                      onChange={(e) => {
                        const next = [...content.contact.branches];
                        next[idx] = { ...branch, region: e.target.value };
                        setContent({
                          ...content,
                          contact: { ...content.contact, branches: next },
                        });
                      }}
                      className="mt-1 w-full rounded-lg border border-white/15 bg-[#07090e]/65 px-3 py-2 text-sm text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-400">Street Address</label>
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
                    className="mt-1 w-full rounded-lg border border-white/15 bg-[#07090e]/65 px-3 py-2 text-sm text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400">
                    Google Maps Navigation Query
                  </label>
                  <input
                    type="text"
                    value={branch.mapQuery}
                    onChange={(e) => {
                      const next = [...content.contact.branches];
                      next[idx] = { ...branch, mapQuery: e.target.value };
                      setContent({
                        ...content,
                        contact: { ...content.contact, branches: next },
                      });
                    }}
                    className="mt-1 w-full rounded-lg border border-white/15 bg-[#07090e]/65 px-3 py-2 text-sm text-white"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 7: CLIENT INBOX & SUBSCRIBERS */}
      {activeTab === 'inbox' && allowedSections.includes('inbox') && (
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="rounded-2xl border border-white/10 bg-[#07090e]/55 p-6 backdrop-blur-md lg:col-span-8">
            <h2 className="font-display text-lg font-bold text-white">
              Client Inquiries ({inquiries.length})
            </h2>
            {inquiries.length === 0 ? (
              <p className="mt-4 text-sm text-slate-400">No inquiries submitted yet.</p>
            ) : (
              <div className="mt-4 space-y-4">
                {inquiries.map((inq) => (
                  <div
                    key={inq.id}
                    className="rounded-xl border border-white/10 bg-[#07090e]/80 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-display text-sm font-bold text-white">{inq.subject}</p>
                      <span className="font-mono text-xs text-slate-400 tabular-nums">
                        {new Date(inq.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[#fe6d2c]">
                      {inq.name} · {inq.email}
                      {inq.phone ? ` · ${inq.phone}` : ''}
                    </p>
                    <p className="mt-2 text-sm text-slate-300">{inq.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#07090e]/55 p-6 backdrop-blur-md lg:col-span-4">
            <h2 className="font-display text-lg font-bold text-white">
              Newsletter Subscribers ({subscribers.length})
            </h2>
            {subscribers.length === 0 ? (
              <p className="mt-4 text-sm text-slate-400">No subscribers yet.</p>
            ) : (
              <ul className="mt-4 space-y-2.5">
                {subscribers.map((sub) => (
                  <li
                    key={sub.id}
                    className="flex items-center justify-between rounded-lg border border-white/10 bg-[#07090e]/80 px-3 py-2 text-xs text-slate-200"
                  >
                    <span className="truncate">{sub.email}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
      {/* TAB 8: DEPARTMENTS, BRANCHES & TEAM DIRECTORY */}
      {activeTab === 'directory' && allowedSections.includes('directory') && (
        <div className="mt-8 space-y-6">
          {/* Active Desk Assignment & Filter Toolbar */}
          <div className="rounded-2xl border border-white/20 bg-[#07090e]/60 p-6 backdrop-blur-xl">
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
              <div>
                <h2 className="font-display text-xl font-bold text-white">
                  Departments, Branches & Blord Group Team Directory
                </h2>
                <p className="mt-1 text-xs text-slate-300">
                  Locate any department desk (Sales, Marketing, ICT & Tech, Maintenance, Operations,
                  Inventory, Support) or branch office across Nigeria & Guangzhou.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <label htmlFor="my-active-branch" className="text-xs text-slate-300 whitespace-nowrap">
                  My Active Branch:
                </label>
                <select
                  id="my-active-branch"
                  value={staffBranchId}
                  onChange={(e) => {
                    const nextBranch = e.target.value;
                    setStaffBranchId(nextBranch);
                    void persistPreferences({ branchId: nextBranch, lastTab: 'directory' });
                  }}
                  className="rounded-lg border border-[#fe6d2c]/40 bg-[#07090e]/85 px-3 py-1.5 text-xs font-medium text-white"
                >
                  {content.contact.branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={directorySearch}
                  onChange={(e) => setDirectorySearch(e.target.value)}
                  placeholder="Search staff name, email, role..."
                  className="w-full rounded-lg border border-white/20 bg-[#07090e]/70 py-2 pl-9 pr-3 text-xs text-white placeholder:text-slate-400"
                />
              </div>

              <select
                aria-label="Filter directory by department"
                value={directoryDeptFilter}
                onChange={(e) => setDirectoryDeptFilter(e.target.value as 'all' | StaffDepartment)}
                className="rounded-lg border border-white/20 bg-[#07090e]/85 px-3 py-2 text-xs text-white"
              >
                <option value="all">All Departments ({STAFF_DEPARTMENT_OPTIONS.length})</option>
                {STAFF_DEPARTMENT_OPTIONS.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>

              <select
                aria-label="Filter directory by branch"
                value={directoryBranchFilter}
                onChange={(e) => setDirectoryBranchFilter(e.target.value)}
                className="rounded-lg border border-white/20 bg-[#07090e]/85 px-3 py-2 text-xs text-white"
              >
                <option value="all">All Branches ({content.contact.branches.length})</option>
                {content.contact.branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.region})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Registered Portal Staff Across Departments & Branches */}
          <div className="rounded-2xl border border-white/15 bg-[#07090e]/55 p-6 backdrop-blur-md">
            <h3 className="font-display text-lg font-bold text-white">
              Registered Portal Staff ({directoryStaff.length})
            </h3>
            {directoryStaff.length === 0 ? (
              <p className="mt-3 text-xs text-slate-300">
                No additional staff portal accounts registered yet.
              </p>
            ) : (
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {directoryStaff
                  .filter((member) => {
                    if (directoryDeptFilter !== 'all' && member.department !== directoryDeptFilter) {
                      return false;
                    }
                    if (directoryBranchFilter !== 'all' && member.branchId !== directoryBranchFilter) {
                      return false;
                    }
                    const q = directorySearch.trim().toLowerCase();
                    if (!q) return true;
                    return (
                      member.name.toLowerCase().includes(q) ||
                      member.email.toLowerCase().includes(q) ||
                      getStaffRoleLabel(member.department).toLowerCase().includes(q)
                    );
                  })
                  .map((member) => {
                    const branchObj = content.contact.branches.find((b) => b.id === member.branchId);
                    return (
                      <div
                        key={member.id}
                        className="rounded-xl border border-white/15 bg-white/[0.03] p-4"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-display text-sm font-bold text-white">{member.name}</p>
                            <p className="mt-0.5 text-xs font-medium text-[#fe6d2c]">
                              {getStaffRoleLabel(member.department)}
                            </p>
                          </div>
                          <span
                            className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                              member.active
                                ? 'bg-emerald-500/20 text-emerald-200'
                                : 'bg-red-500/20 text-red-200'
                            }`}
                          >
                            {member.active ? 'Active' : 'Suspended'}
                          </span>
                        </div>
                        <p className="mt-2 font-mono text-[11px] text-slate-300">{member.email}</p>
                        <p className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-400">
                          <MapPin className="h-3 w-3 shrink-0 text-[#fe6d2c]" />
                          <span>
                            {branchObj ? `${branchObj.name} (${branchObj.region})` : 'Awka Head Office'}
                          </span>
                        </p>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

          {/* Official Executive Board & Branch Desks */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-white/15 bg-[#07090e]/55 p-6 backdrop-blur-md">
              <h3 className="font-display text-lg font-bold text-white">
                Leadership & Department Heads ({content.about.boardMembers.length})
              </h3>
              <div className="mt-4 max-h-96 space-y-2.5 overflow-y-auto pr-1">
                {content.about.boardMembers
                  .filter((m) => {
                    const q = directorySearch.trim().toLowerCase();
                    if (!q) return true;
                    return (
                      m.name.toLowerCase().includes(q) ||
                      m.role.toLowerCase().includes(q) ||
                      (m.email && m.email.toLowerCase().includes(q))
                    );
                  })
                  .map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#07090e]/75 p-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={m.image}
                          alt={m.name}
                          className="h-10 w-10 shrink-0 rounded-lg object-cover"
                        />
                        <div className="min-w-0">
                          <p className="truncate text-xs font-bold text-white">{m.name}</p>
                          <p className="truncate text-[11px] text-[#fe6d2c]">{m.role}</p>
                        </div>
                      </div>
                      <div className="text-right text-[11px] text-slate-300">
                        {m.email && <p className="font-mono">{m.email}</p>}
                        {m.phone && <p className="font-mono text-slate-400">{m.phone}</p>}
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/15 bg-[#07090e]/55 p-6 backdrop-blur-md">
              <h3 className="font-display text-lg font-bold text-white">
                All Branch Offices ({content.contact.branches.length})
              </h3>
              <div className="mt-4 max-h-96 space-y-2.5 overflow-y-auto pr-1">
                {content.contact.branches
                  .filter((b) => {
                    if (directoryBranchFilter !== 'all' && b.id !== directoryBranchFilter) {
                      return false;
                    }
                    const q = directorySearch.trim().toLowerCase();
                    if (!q) return true;
                    return (
                      b.name.toLowerCase().includes(q) ||
                      b.region.toLowerCase().includes(q) ||
                      b.address.toLowerCase().includes(q)
                    );
                  })
                  .map((b) => (
                    <div
                      key={b.id}
                      className="rounded-xl border border-white/10 bg-[#07090e]/75 p-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-bold text-white">
                          {b.name} · <span className="text-[#fe6d2c]">{b.region}</span>
                        </p>
                        <a
                          href={buildGoogleMapsDirectionsUrl(b)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-[#fe6d2c] hover:underline"
                        >
                          Maps Route →
                        </a>
                      </div>
                      <p className="mt-1 text-[11px] text-slate-300">{b.address}</p>
                      <p className="mt-1 font-mono text-[11px] text-slate-400">
                        {b.phone} · {b.email}
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
