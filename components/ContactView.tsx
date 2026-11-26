import { useState } from 'react';
import {
  CheckCircle2,
  ExternalLink,
  Mail,
  MapPin,
  Navigation,
  Phone,
  Search,
  Send,
} from 'lucide-react';
import type { BlordSiteContent, BranchLocation } from '@/lib/blord-types';
import {
  buildGoogleMapsDirectionsUrl,
  buildGoogleMapsEmbedUrl,
  buildGoogleMapsSearchUrl,
  filterBranches,
  formatPhoneHref,
  validateInquiryInput,
  validateNewsletterEmail,
} from '@/lib/blord-utils';

type RegionFilter = 'all' | 'hq' | 'nigeria' | 'china';

export function ContactView({ content }: { content: BlordSiteContent }) {
  const { contact } = content;
  const [searchQuery, setSearchQuery] = useState('');
  const [regionFilter, setRegionFilter] = useState<RegionFilter>('all');
  const [selectedBranchId, setSelectedBranchId] = useState<string>(
    contact.branches[0]?.id ?? 'awka-hq'
  );

  // Inquiry Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [inquiryBranchId, setInquiryBranchId] = useState(
    contact.branches[0]?.id ?? 'awka-hq'
  );
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [inquiryStatus, setInquiryStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [inquiryFeedback, setInquiryFeedback] = useState('');

  // Newsletter state
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [newsletterFeedback, setNewsletterFeedback] = useState('');

  const regionFiltered = contact.branches.filter((b) => {
    if (regionFilter === 'hq') return b.badge === 'HQ';
    if (regionFilter === 'china') return b.region.toLowerCase().includes('china');
    if (regionFilter === 'nigeria') return b.region.toLowerCase().includes('nigeria');
    return true;
  });

  const visibleBranches = filterBranches(regionFiltered, searchQuery);
  const selectedBranch: BranchLocation =
    contact.branches.find((b) => b.id === selectedBranchId) ?? contact.branches[0];

  async function handleInquirySubmit(e: React.FormEvent) {
    e.preventDefault();
    const check = validateInquiryInput({ name, email, subject, message });
    if (!check.valid) {
      setInquiryStatus('error');
      setInquiryFeedback(check.error ?? 'Please review the form fields.');
      return;
    }

    setInquiryStatus('submitting');
    setInquiryFeedback('');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone,
          branchId: inquiryBranchId,
          subject,
          message,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setInquiryStatus('error');
        setInquiryFeedback(data.error ?? 'Could not send message.');
        return;
      }
      setInquiryStatus('success');
      setInquiryFeedback('Your message has been logged for our team. We will respond shortly.');
      setName('');
      setEmail('');
      setPhone('');
      setSubject('');
      setMessage('');
    } catch {
      setInquiryStatus('error');
      setInquiryFeedback('Network error. Please try again or call the branch directly.');
    }
  }

  async function handleNewsletterSubmit(e: React.FormEvent) {
    e.preventDefault();
    const check = validateNewsletterEmail(newsletterEmail);
    if (!check.valid) {
      setNewsletterStatus('error');
      setNewsletterFeedback(check.error ?? 'Please enter a valid email address.');
      return;
    }

    setNewsletterStatus('submitting');
    setNewsletterFeedback('');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'newsletter', email: newsletterEmail }),
      });
      const data = await res.json();
      if (!res.ok) {
        setNewsletterStatus('error');
        setNewsletterFeedback(data.error ?? 'Subscription failed.');
        return;
      }
      setNewsletterStatus('success');
      setNewsletterFeedback(
        data.alreadySubscribed
          ? 'You are already subscribed to Blord Group updates.'
          : 'Subscribed! Updates and offers will be delivered to your inbox.'
      );
      setNewsletterEmail('');
    } catch {
      setNewsletterStatus('error');
      setNewsletterFeedback('Network error. Please try again.');
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      {/* 1. HEADER */}
      <section className="border-b border-white/10 pb-12">
        <p className="text-xs font-medium text-[#fe6d2c]">{contact.eyebrow}</p>
        <h1
          className="mt-3 max-w-3xl font-display font-bold tracking-tight text-white text-balance"
          style={{ fontSize: 'clamp(2.25rem, 4vw, 3.5rem)', lineHeight: 1.1 }}
        >
          {contact.title}
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-relaxed text-slate-300">
          {contact.subtitle}
        </p>

        {/* Direct Contacts Strip */}
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <a
            href={formatPhoneHref(contact.supportPhone)}
            className="flex items-center gap-3 rounded-xl border border-white/15 bg-[#07090e]/55 px-5 py-4 backdrop-blur-md transition-colors hover:border-[#fe6d2c]/55"
          >
            <Phone className="h-5 w-5 shrink-0 text-[#fe6d2c]" />
            <div>
              <p className="text-xs text-slate-400">Customer Support Helpline</p>
              <p className="font-mono text-sm font-semibold text-white tabular-nums">
                {contact.supportPhone}
              </p>
            </div>
          </a>

          <a
            href={`mailto:${contact.supportEmail}`}
            className="flex items-center gap-3 rounded-xl border border-white/15 bg-[#07090e]/55 px-5 py-4 backdrop-blur-md transition-colors hover:border-[#fe6d2c]/55"
          >
            <Mail className="h-5 w-5 shrink-0 text-[#fe6d2c]" />
            <div>
              <p className="text-xs text-slate-400">General Support</p>
              <p className="text-sm font-semibold text-white">{contact.supportEmail}</p>
            </div>
          </a>

          <a
            href={`mailto:${contact.procurementEmail}`}
            className="flex items-center gap-3 rounded-xl border border-white/15 bg-[#07090e]/55 px-5 py-4 backdrop-blur-md transition-colors hover:border-[#fe6d2c]/55"
          >
            <Mail className="h-5 w-5 shrink-0 text-[#fe6d2c]" />
            <div>
              <p className="text-xs text-slate-400">China Procurement Desk</p>
              <p className="text-sm font-semibold text-white">{contact.procurementEmail}</p>
            </div>
          </a>
        </div>
      </section>

      {/* 2. BRANCH LOCATIONS + INTERACTIVE CLICKABLE GOOGLE MAPS */}
      <section className="border-b border-white/10 py-16">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter offices by region">
            {(
              [
                { id: 'all', label: `All Offices (${contact.branches.length})` },
                { id: 'hq', label: 'Head Office (Awka)' },
                { id: 'nigeria', label: 'Nigeria Branches' },
                { id: 'china', label: 'China Office' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setRegionFilter(tab.id)}
                className={`rounded-lg px-4 py-2 text-xs font-semibold whitespace-nowrap transition-colors ${
                  regionFilter === tab.id
                    ? 'bg-[#fe6d2c] text-white'
                    : 'border border-white/15 bg-[#07090e]/55 text-slate-200 backdrop-blur-md hover:bg-white/10'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full lg:w-80">
            <label htmlFor="branch-search" className="sr-only">
              Search branch by city, street, or plaza
            </label>
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              id="branch-search"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search city, street, or plaza..."
              className="w-full rounded-lg border border-white/20 bg-[#07090e]/60 py-2.5 pl-10 pr-4 text-sm text-white backdrop-blur-md placeholder:text-slate-400 focus:border-[#fe6d2c] focus:outline-none"
            />
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Left: 10 Branch Cards */}
          <div className="space-y-4 lg:col-span-6">
            {visibleBranches.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-[#0f131c]/80 p-8 text-center">
                <p className="text-sm text-slate-300">
                  No offices matched &ldquo;{searchQuery}&rdquo;.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setRegionFilter('all');
                  }}
                  className="mt-3 rounded-lg bg-[#fe6d2c] px-4 py-2 text-xs font-semibold text-white"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              visibleBranches.map((branch) => {
                const isSelected = selectedBranch.id === branch.id;
                const directionsHref = buildGoogleMapsDirectionsUrl(branch);
                const searchHref = buildGoogleMapsSearchUrl(branch);

                return (
                  <article
                    key={branch.id}
                    className={`rounded-2xl border p-6 transition-all duration-150 ${
                      isSelected
                        ? 'border-[#fe6d2c] bg-[#07090e]/70 backdrop-blur-md'
                        : 'border-white/15 bg-[#07090e]/55 backdrop-blur-md hover:border-white/30'
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-medium text-[#fe6d2c]">
                          {branch.region}
                          {branch.badge ? ` · ${branch.badge}` : ''}
                        </p>
                        <h2 className="mt-1 font-display text-lg font-bold text-white">
                          {branch.name}
                        </h2>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedBranchId(branch.id)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors ${
                          isSelected
                            ? 'bg-[#fe6d2c] text-white'
                            : 'border border-white/15 bg-white/[0.04] text-slate-200 hover:bg-white/10'
                        }`}
                      >
                        {isSelected ? 'Viewing on Map' : 'Preview on Map'}
                      </button>
                    </div>

                    <p className="mt-3 text-sm leading-relaxed text-slate-200">{branch.address}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      Structure landmark: {branch.landmarkHint}
                    </p>

                    <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-300">
                      <a
                        href={formatPhoneHref(branch.phone)}
                        className="inline-flex items-center gap-1.5 font-mono tabular-nums hover:text-[#fe6d2c]"
                      >
                        <Phone className="h-3.5 w-3.5 text-slate-400" />
                        <span>{branch.phone}</span>
                      </a>
                      <a
                        href={`mailto:${branch.email}`}
                        className="inline-flex items-center gap-1.5 hover:text-[#fe6d2c]"
                      >
                        <Mail className="h-3.5 w-3.5 text-slate-400" />
                        <span>{branch.email}</span>
                      </a>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-3 border-t border-white/10 pt-4">
                      <a
                        href={directionsHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-lg bg-[#fe6d2c] px-4 py-2 text-xs font-semibold text-white whitespace-nowrap transition-colors hover:bg-[#ff7f44]"
                      >
                        <Navigation className="h-3.5 w-3.5" />
                        <span>Drive Here (Google Maps)</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                      <a
                        href={searchHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/[0.04] px-4 py-2 text-xs font-medium text-slate-200 whitespace-nowrap transition-colors hover:bg-white/10"
                      >
                        <MapPin className="h-3.5 w-3.5 text-[#fe6d2c]" />
                        <span>Inspect Pin in Maps</span>
                      </a>
                    </div>
                  </article>
                );
              })
            )}
          </div>

          {/* Right: Live Sticky Interactive Google Maps Structure Locator */}
          <div className="lg:col-span-6">
            <div className="sticky top-24 overflow-hidden rounded-3xl border border-white/20 bg-[#07090e]/60 shadow-xl backdrop-blur-md">
              <div className="border-b border-white/10 p-6">
                <p className="text-xs font-medium text-[#fe6d2c]">
                  Active Branch Pin · {selectedBranch.region}
                </p>
                <h3 className="mt-1 font-display text-xl font-bold text-white">
                  {selectedBranch.name}
                </h3>
                <p className="mt-2 text-sm text-slate-300">{selectedBranch.address}</p>
                <p className="mt-1 text-xs text-slate-400">
                  Landmark: {selectedBranch.landmarkHint}
                </p>

                <div className="mt-4 flex flex-wrap gap-3">
                  <a
                    href={buildGoogleMapsDirectionsUrl(selectedBranch)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg bg-[#fe6d2c] px-4 py-2.5 text-xs font-semibold text-white whitespace-nowrap hover:bg-[#ff7f44]"
                  >
                    <Navigation className="h-4 w-4" />
                    <span>Start Driving Navigation</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                  <a
                    href={buildGoogleMapsSearchUrl(selectedBranch)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/[0.04] px-4 py-2.5 text-xs font-medium text-white whitespace-nowrap hover:bg-white/10"
                  >
                    <MapPin className="h-4 w-4 text-[#fe6d2c]" />
                    <span>Open Building View</span>
                  </a>
                </div>
              </div>

              <div className="relative h-[420px] w-full bg-slate-900">
                <iframe
                  title={`Google Map location for ${selectedBranch.name}`}
                  src={buildGoogleMapsEmbedUrl(selectedBranch)}
                  className="h-full w-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. INQUIRY FORM, SOCIALS & NEWSLETTER */}
      <section className="pt-16">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          {/* Inquiry Form */}
          <div className="rounded-3xl border border-white/15 bg-[#07090e]/55 p-8 backdrop-blur-md lg:col-span-7">
            <p className="text-xs font-medium text-[#fe6d2c]">Direct Inquiry</p>
            <h2 className="mt-2 font-display text-2xl font-bold text-white">
              Send a Message to Our Team
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Select the office you wish to reach and submit your inquiry below.
            </p>

            <form onSubmit={handleInquirySubmit} className="mt-6 space-y-4" noValidate>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="inq-name" className="block text-xs font-medium text-slate-300">
                    Full Name
                  </label>
                  <input
                    id="inq-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Chidi Okafor"
                    required
                    className="mt-1.5 w-full rounded-lg border border-white/15 bg-[#07090e]/65 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-400 focus:border-[#fe6d2c] focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="inq-email" className="block text-xs font-medium text-slate-300">
                    Email Address
                  </label>
                  <input
                    id="inq-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="mt-1.5 w-full rounded-lg border border-white/15 bg-[#07090e]/65 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-400 focus:border-[#fe6d2c] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="inq-phone" className="block text-xs font-medium text-slate-300">
                    Phone Number (Optional)
                  </label>
                  <input
                    id="inq-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+234 800 000 0000"
                    className="mt-1.5 w-full rounded-lg border border-white/15 bg-[#07090e]/65 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-400 focus:border-[#fe6d2c] focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="inq-branch" className="block text-xs font-medium text-slate-300">
                    Target Branch
                  </label>
                  <select
                    id="inq-branch"
                    value={inquiryBranchId}
                    onChange={(e) => setInquiryBranchId(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-white/15 bg-[#07090e] px-3.5 py-2.5 text-sm text-white focus:border-[#fe6d2c] focus:outline-none"
                  >
                    {contact.branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.region})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="inq-subject" className="block text-xs font-medium text-slate-300">
                  Subject
                </label>
                <input
                  id="inq-subject"
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Billpoint support, Real estate, B Cars import..."
                  required
                  className="mt-1.5 w-full rounded-lg border border-white/15 bg-[#07090e]/65 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-400 focus:border-[#fe6d2c] focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="inq-message" className="block text-xs font-medium text-slate-300">
                  Message
                </label>
                <textarea
                  id="inq-message"
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="How can our team assist you?"
                  required
                  className="mt-1.5 w-full rounded-lg border border-white/15 bg-[#07090e]/65 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-400 focus:border-[#fe6d2c] focus:outline-none"
                />
              </div>

              {inquiryFeedback && (
                <div
                  role="status"
                  className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-xs ${
                    inquiryStatus === 'success'
                      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                      : 'border-red-500/40 bg-red-500/10 text-red-200'
                  }`}
                >
                  {inquiryStatus === 'success' && <CheckCircle2 className="h-4 w-4 shrink-0" />}
                  <span>{inquiryFeedback}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={inquiryStatus === 'submitting'}
                className="inline-flex items-center gap-2 rounded-lg bg-[#fe6d2c] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#ff7f44] disabled:opacity-60"
              >
                <Send className="h-4 w-4" />
                <span>{inquiryStatus === 'submitting' ? 'Sending...' : 'Send Message'}</span>
              </button>
            </form>
          </div>

          {/* Socials & Newsletter */}
          <div className="space-y-6 lg:col-span-5">
            <div className="rounded-3xl border border-white/15 bg-[#07090e]/55 p-8 backdrop-blur-md">
              <p className="text-xs font-medium text-[#fe6d2c]">Follow Us</p>
              <h2 className="mt-2 font-display text-2xl font-bold text-white">
                Connect with Blord Group
              </h2>
              <p className="mt-2 text-sm text-slate-300">
                Follow us on social media for news, updates and offers.
              </p>

              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {contact.socials.map((social) => (
                  <a
                    key={social.id}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between rounded-xl border border-white/15 bg-white/[0.04] px-4 py-3.5 transition-colors hover:border-[#fe6d2c]/55"
                  >
                    <div>
                      <p className="text-xs text-slate-300">{social.platform}</p>
                      <p className="text-sm font-semibold text-white">{social.handle}</p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-[#fe6d2c]" />
                  </a>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-white/15 bg-[#07090e]/60 p-8 backdrop-blur-md">
              <p className="text-xs font-medium text-[#fe6d2c]">Stay Connected</p>
              <h2 className="mt-2 font-display text-2xl font-bold text-white">
                Subscribe to our newsletter!
              </h2>
              <p className="mt-2 text-sm text-slate-300">
                Get the latest updates on our services, news, and exclusive offers delivered to
                your inbox.
              </p>

              <form onSubmit={handleNewsletterSubmit} className="mt-5 space-y-3" noValidate>
                <div>
                  <label htmlFor="newsletter-email" className="sr-only">
                    Newsletter Email Address
                  </label>
                  <input
                    id="newsletter-email"
                    type="email"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    placeholder="Enter your email address"
                    required
                    className="w-full rounded-lg border border-white/20 bg-[#07090e]/65 px-4 py-3 text-sm text-white placeholder:text-slate-400 focus:border-[#fe6d2c] focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={newsletterStatus === 'submitting'}
                  className="w-full rounded-lg bg-[#fe6d2c] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#ff7f44] disabled:opacity-60"
                >
                  {newsletterStatus === 'submitting' ? 'Subscribing...' : 'Subscribe'}
                </button>
                {newsletterFeedback && (
                  <p
                    role="status"
                    className={`text-xs ${
                      newsletterStatus === 'success' ? 'text-emerald-300' : 'text-red-300'
                    }`}
                  >
                    {newsletterFeedback}
                  </p>
                )}
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
