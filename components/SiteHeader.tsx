import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/about-us', label: 'About Us' },
  { href: '/cars', label: 'Blord Cars' },
  { href: '/power-tank', label: 'Power Tank' },
  { href: '/contact-us', label: 'Contact Us' },
  { href: '/admin', label: 'Staff Portal' },
  { href: '/executive-admin', label: 'Admin Backend' },
];

export function SiteHeader({ brandName = 'Blord Group' }: { brandName?: string }) {
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#07090e]/65 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-8 px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Single-line Brand Wordmark */}
        <Link
          to="/"
          aria-label={`${brandName} Home`}
          className="flex items-center whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fe6d2c] rounded-md"
        >
          <img
            src="/assets/logo/blord-logo-nav.png"
            alt={brandName}
            width={150}
            height={42}
            referrerPolicy="no-referrer"
            className="h-8 w-auto object-contain"
          />
        </Link>

        {/* Zone 2: Concise single-line navigation links */}
        <nav aria-label="Main Navigation" className="hidden md:flex items-center gap-4 lg:gap-6">
          {NAV_LINKS.map((item) => {
            const isActive =
              item.href === '/'
                ? pathname === '/'
                : item.href.startsWith('/#')
                  ? false
                  : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                to={item.href}
                className={`whitespace-nowrap shrink-0 text-sm font-medium transition-colors duration-150 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fe6d2c] rounded px-1 py-1 ${
                  isActive
                    ? 'text-[#fe6d2c] underline decoration-[#fe6d2c]/60 underline-offset-8'
                    : 'text-slate-300'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Zone 3: 1 primary action CTA */}
        <div className="flex items-center gap-3 shrink-0">
          <Link
            to="/contact-us"
            className="hidden sm:inline-flex items-center justify-center rounded-lg bg-[#fe6d2c] px-4 py-2 text-xs font-semibold text-white whitespace-nowrap shrink-0 transition-colors duration-150 hover:bg-[#ff7f44] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            Visit Offices
          </Link>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileOpen}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 text-slate-200 md:hidden hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fe6d2c]"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="border-t border-white/10 bg-[#0b0e16]/95 px-4 py-4 md:hidden">
          <nav aria-label="Mobile Navigation" className="flex flex-col gap-2">
            {NAV_LINKS.map((item) => {
              const isActive =
                item.href === '/'
                  ? pathname === '/'
                  : item.href.startsWith('/#')
                    ? false
                    : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-[#fe6d2c]/15 text-[#fe6d2c]'
                      : 'text-slate-200 hover:bg-white/5'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}
