import { Link } from 'react-router-dom';
import type { BlordSiteContent } from '@/lib/blord-types';
import { formatPhoneHref } from '@/lib/blord-utils';

export function SiteFooter({ content }: { content: BlordSiteContent }) {
  return (
    <footer className="border-t border-white/10 bg-[#05070b]/65 backdrop-blur-lg">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <Link to="/" className="inline-flex items-center">
              <img
                src="/assets/logo/blord-logo-footer.png"
                alt="Blord Group"
                width={170}
                height={46}
                referrerPolicy="no-referrer"
                className="h-10 w-auto object-contain brightness-0 invert"
              />
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-slate-400">
              {content.footerDescription}
            </p>
          </div>

          <div>
            <h2 className="font-display text-sm font-semibold text-white">Explore</h2>
            <ul className="mt-4 space-y-2.5 text-sm text-slate-400">
              <li>
                <Link to="/" className="transition-colors hover:text-[#fe6d2c]">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/about-us" className="transition-colors hover:text-[#fe6d2c]">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/cars" className="transition-colors hover:text-[#fe6d2c]">
                  Blord Cars (EV)
                </Link>
              </li>
              <li>
                <Link to="/power-tank" className="transition-colors hover:text-[#fe6d2c]">
                  Blord Power Tank
                </Link>
              </li>
              <li>
                <Link to="/contact-us" className="transition-colors hover:text-[#fe6d2c]">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/admin" className="transition-colors hover:text-[#fe6d2c]">
                  Staff Portal
                </Link>
              </li>
              <li>
                <Link to="/executive-admin" className="transition-colors hover:text-[#fe6d2c]">
                  Admin Backend
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="font-display text-sm font-semibold text-white">Our Products</h2>
            <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm text-slate-400">
              {content.products.map((product) => (
                <li key={product.slug}>
                  <Link
                    to={`/products/${product.slug}`}
                    className="transition-colors hover:text-[#fe6d2c]"
                  >
                    {product.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="font-display text-sm font-semibold text-white">Get In Touch</h2>
            <p className="mt-4 text-xs text-slate-400">Need Support?</p>
            <div className="mt-2 space-y-1.5 text-sm">
              <a
                href={`mailto:${content.contact.supportEmail}`}
                className="block font-medium text-slate-200 transition-colors hover:text-[#fe6d2c]"
              >
                {content.contact.supportEmail}
              </a>
              <a
                href={formatPhoneHref(content.contact.supportPhone)}
                className="block font-mono text-slate-300 tabular-nums transition-colors hover:text-[#fe6d2c]"
              >
                {content.contact.supportPhone}
              </a>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              {content.contact.socials.map((s) => (
                <a
                  key={s.id}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-medium text-slate-400 underline decoration-white/20 underline-offset-4 transition-colors hover:text-[#fe6d2c] hover:decoration-[#fe6d2c]"
                >
                  {s.platform}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 text-xs text-slate-500 sm:flex-row">
          <p>{content.copyrightText}</p>
          <p>Awka HQ · Abuja · Lagos · Port Harcourt · Asaba · Benin · Owerri · Enugu · Aba · Guangzhou</p>
        </div>
      </div>
    </footer>
  );
}
