import { useEffect, useState } from 'react';
import { Link, Route, Routes, useLocation, useParams } from 'react-router-dom';
import { AboutView } from '@/components/AboutView';
import { BlordAiBot } from '@/components/BlordAiBot';
import { CarsView } from '@/components/CarsView';
import { ContactView } from '@/components/ContactView';
import { ExecutiveAdminView } from '@/components/ExecutiveAdminView';
import { FloatingBackground } from '@/components/FloatingBackground';
import { HomeView } from '@/components/HomeView';
import { PowerTankView } from '@/components/PowerTankView';
import { ProductDetailView } from '@/components/ProductDetailView';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';
import { StaffAdminView } from '@/components/StaffAdminView';
import { DEFAULT_BLORD_CONTENT } from '@/lib/blord-default-data';
import type { BlordSiteContent } from '@/lib/blord-types';

type AuthMode = 'unclaimed' | 'claimed' | 'env';

function RouteMetaAndScroll({ content }: { content: BlordSiteContent }) {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (pathname === '/') {
      document.title = `${content.brandName} — Fintech, Real Estate & Digital Solutions`;
    } else if (pathname === '/about-us') {
      document.title = `About Us | ${content.brandName}`;
    } else if (pathname === '/cars') {
      document.title = `Blord Cars & Electric Vehicles | ${content.brandName}`;
    } else if (pathname === '/power-tank') {
      document.title = `Blord Power Tanks & Solar Generators | ${content.brandName}`;
    } else if (pathname === '/contact-us') {
      document.title = `Contact Us & 10 Branches | ${content.brandName}`;
    } else if (pathname === '/admin') {
      document.title = `Staff Operations Portal | ${content.brandName}`;
    } else if (pathname === '/executive-admin') {
      document.title = `Executive Admin Backend | ${content.brandName}`;
    } else if (pathname.startsWith('/products/')) {
      const slug = pathname.replace('/products/', '');
      const matched = content.products.find((p) => p.slug === slug);
      document.title = matched ? `${matched.name} | ${content.brandName}` : `Product | ${content.brandName}`;
    }
  }, [pathname, content]);

  useEffect(() => {
    if (hash) {
      const targetId = hash.replace(/^#/, '');
      const timer = window.setTimeout(() => {
        const el = document.getElementById(targetId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 60);
      return () => window.clearTimeout(timer);
    }
    window.scrollTo({ top: 0, behavior: 'auto' });
    return undefined;
  }, [pathname, hash]);

  return null;
}

function ProductDetailRoute({ content }: { content: BlordSiteContent }) {
  const { slug } = useParams<{ slug: string }>();
  const product = content.products.find((item) => item.slug === slug);

  if (!product) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-4 py-20 text-center">
        <div className="rounded-3xl border border-white/15 bg-[#07090e]/65 p-10 backdrop-blur-xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#fe6d2c]">
            Catalog Entry Not Found
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold text-white">Product Not Found</h1>
          <p className="mt-3 text-sm text-slate-300">
            This product route does not match an active Blord Group offering.
          </p>
          <Link
            to="/"
            className="mt-6 inline-flex items-center rounded-xl bg-[#fe6d2c] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#ff7f44]"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return <ProductDetailView product={product} content={content} />;
}

function StaffAdminRoute({
  content,
  updatedAt,
  cmsReady,
  onContentChange,
}: {
  content: BlordSiteContent;
  updatedAt: string;
  cmsReady: boolean;
  onContentChange: (nextContent: BlordSiteContent, nextUpdatedAt: string) => void;
}) {
  const [status, setStatus] = useState<{ mode: AuthMode; claimedEmail?: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/auth/status')
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) {
          setStatus({
            mode: (data.mode as AuthMode) ?? 'unclaimed',
            claimedEmail: data.claimedEmail,
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStatus({ mode: 'unclaimed' });
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!status || !cmsReady) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-lg items-center justify-center px-4 py-16">
        <div className="w-full rounded-3xl border border-white/20 bg-[#07090e]/60 p-8 text-center backdrop-blur-xl">
          <p className="text-sm font-medium text-slate-200">Loading Staff Operations Portal...</p>
        </div>
      </div>
    );
  }

  return (
    <StaffAdminView
      initialAuthMode={status.mode}
      initialClaimedEmail={status.claimedEmail}
      initialContent={content}
      initialUpdatedAt={updatedAt}
      onContentChange={onContentChange}
    />
  );
}

function ExecutiveAdminRoute({
  content,
  updatedAt,
  cmsReady,
  onContentChange,
}: {
  content: BlordSiteContent;
  updatedAt: string;
  cmsReady: boolean;
  onContentChange: (nextContent: BlordSiteContent, nextUpdatedAt: string) => void;
}) {
  const [status, setStatus] = useState<{ mode: AuthMode; claimedEmail?: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/executive/status')
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) {
          setStatus({
            mode: (data.mode as AuthMode) ?? 'unclaimed',
            claimedEmail: data.claimedEmail,
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStatus({ mode: 'unclaimed' });
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!status || !cmsReady) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-xl items-center justify-center px-4 py-14">
        <div className="w-full rounded-3xl border border-[#fe6d2c]/35 bg-[#07090e]/65 p-8 text-center backdrop-blur-xl">
          <p className="text-sm font-medium text-slate-200">Loading Executive Admin Backend...</p>
        </div>
      </div>
    );
  }

  return (
    <ExecutiveAdminView
      initialAuthMode={status.mode}
      initialClaimedEmail={status.claimedEmail}
      initialContent={content}
      initialUpdatedAt={updatedAt}
      onContentChange={onContentChange}
    />
  );
}

export function App() {
  const [siteData, setSiteData] = useState<{
    content: BlordSiteContent;
    updatedAt: string;
    cmsReady: boolean;
  }>({
    content: DEFAULT_BLORD_CONTENT,
    updatedAt: '',
    cmsReady: false,
  });

  useEffect(() => {
    let cancelled = false;
    fetch('/api/cms')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled) {
          if (data?.content) {
            setSiteData({
              content: data.content as BlordSiteContent,
              updatedAt: typeof data.updatedAt === 'string' ? data.updatedAt : '',
              cmsReady: true,
            });
          } else {
            setSiteData((prev) => ({ ...prev, cmsReady: true }));
          }
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSiteData((prev) => ({ ...prev, cmsReady: true }));
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function handleContentChange(nextContent: BlordSiteContent, nextUpdatedAt: string) {
    setSiteData({ content: nextContent, updatedAt: nextUpdatedAt, cmsReady: true });
  }

  return (
    <>
      <RouteMetaAndScroll content={siteData.content} />
      <FloatingBackground />
      <div className="relative z-10 flex min-h-screen flex-col">
        <SiteHeader brandName={siteData.content.brandName} />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<HomeView content={siteData.content} />} />
            <Route path="/about-us" element={<AboutView content={siteData.content} />} />
            <Route path="/cars" element={<CarsView content={siteData.content} />} />
            <Route path="/power-tank" element={<PowerTankView content={siteData.content} />} />
            <Route path="/contact-us" element={<ContactView content={siteData.content} />} />
            <Route path="/products/:slug" element={<ProductDetailRoute content={siteData.content} />} />
            <Route
              path="/admin"
              element={
                <StaffAdminRoute
                  content={siteData.content}
                  updatedAt={siteData.updatedAt}
                  cmsReady={siteData.cmsReady}
                  onContentChange={handleContentChange}
                />
              }
            />
            <Route
              path="/executive-admin"
              element={
                <ExecutiveAdminRoute
                  content={siteData.content}
                  updatedAt={siteData.updatedAt}
                  cmsReady={siteData.cmsReady}
                  onContentChange={handleContentChange}
                />
              }
            />
            <Route path="*" element={<HomeView content={siteData.content} />} />
          </Routes>
        </main>
        <SiteFooter content={siteData.content} />
      </div>
      <BlordAiBot />
    </>
  );
}
