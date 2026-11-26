import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, CheckCircle2, ExternalLink } from 'lucide-react';
import type { BlordSiteContent, ProductItem } from '@/lib/blord-types';

export function ProductDetailView({
  product,
  content,
}: {
  product: ProductItem;
  content: BlordSiteContent;
}) {
  const otherProducts = content.products.filter((p) => p.slug !== product.slug);

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <Link
        to="/#products"
        className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-[#07090e]/60 px-3.5 py-2 text-xs font-medium text-slate-100 backdrop-blur-md transition-colors hover:border-[#fe6d2c]/60 hover:text-[#fe6d2c]"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to All Products</span>
      </Link>

      <section className="mt-8 rounded-3xl border border-white/15 bg-[#07090e]/55 p-8 backdrop-blur-md sm:p-12">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-1.5">
                <img
                  src={product.logo}
                  alt={product.name}
                  width={80}
                  height={80}
                  referrerPolicy="no-referrer"
                  className="h-full w-full rounded-xl object-cover"
                />
              </div>
              <div>
                <p className="text-xs font-medium text-[#fe6d2c]">{product.category}</p>
                <h1 className="mt-1 font-display text-4xl font-bold tracking-tight text-white">
                  {product.name}
                </h1>
                {product.priceLabel && (
                  <p className="mt-1.5 font-mono text-lg font-bold text-[#fe6d2c] tabular-nums">
                    {product.priceLabel}
                  </p>
                )}
              </div>
            </div>

            <p className="mt-6 font-display text-2xl font-semibold text-slate-100 text-balance">
              {product.tagline}
            </p>
            <p className="mt-4 text-base leading-relaxed text-slate-300">{product.description}</p>

            <div className="mt-8 flex flex-wrap gap-3">
              {product.slug === 'b-cars' && (
                <Link
                  to="/cars"
                  className="inline-flex items-center gap-2 rounded-lg bg-[#fe6d2c] px-5 py-3 text-sm font-semibold text-white whitespace-nowrap transition-colors hover:bg-[#ff7f44]"
                >
                  <span>View Electric Cars & Prices</span>
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              )}
              {product.slug === 'blunt' && (
                <Link
                  to="/power-tank"
                  className="inline-flex items-center gap-2 rounded-lg bg-[#fe6d2c] px-5 py-3 text-sm font-semibold text-white whitespace-nowrap transition-colors hover:bg-[#ff7f44]"
                >
                  <span>View Power Tanks & Prices</span>
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              )}
              {product.links.webAppUrl && (
                <a
                  href={product.links.webAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-[#fe6d2c] px-5 py-3 text-sm font-semibold text-white whitespace-nowrap transition-colors hover:bg-[#ff7f44]"
                >
                  <span>Open Web App</span>
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
              {product.links.appStoreUrl && (
                <a
                  href={product.links.appStoreUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/[0.04] px-5 py-3 text-sm font-medium text-white whitespace-nowrap transition-colors hover:bg-white/10"
                >
                  <span>Download on App Store</span>
                  <ArrowUpRight className="h-4 w-4 text-[#fe6d2c]" />
                </a>
              )}
              {product.links.playStoreUrl && (
                <a
                  href={product.links.playStoreUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/[0.04] px-5 py-3 text-sm font-medium text-white whitespace-nowrap transition-colors hover:bg-white/10"
                >
                  <span>Get it on Google Play</span>
                  <ArrowUpRight className="h-4 w-4 text-[#fe6d2c]" />
                </a>
              )}
              {product.links.websiteUrl && (
                <a
                  href={product.links.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/[0.04] px-5 py-3 text-sm font-medium text-white whitespace-nowrap transition-colors hover:bg-white/10"
                >
                  <span>Visit {product.links.websiteLabel ?? 'Website'}</span>
                  <ExternalLink className="h-4 w-4 text-[#fe6d2c]" />
                </a>
              )}
              {product.slug !== 'b-cars' &&
                !product.links.webAppUrl &&
                !product.links.appStoreUrl &&
                !product.links.playStoreUrl &&
                !product.links.websiteUrl && (
                  <Link
                    to="/contact-us"
                    className="inline-flex items-center gap-2 rounded-lg bg-[#fe6d2c] px-5 py-3 text-sm font-semibold text-white whitespace-nowrap transition-colors hover:bg-[#ff7f44]"
                  >
                    <span>Speak with {product.name} Desk</span>
                  </Link>
                )}
            </div>
          </div>
        </div>
      </section>

      <section className="mt-14">
        <p className="text-xs font-medium text-[#fe6d2c]">Why {product.name}</p>
        <h2 className="mt-2 font-display text-3xl font-bold text-white">
          {product.featuresTitle}
        </h2>

        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
          {product.features.map((feat) => (
            <div
              key={feat.title}
              className="rounded-2xl border border-white/15 bg-[#07090e]/55 p-6 backdrop-blur-md"
            >
              <CheckCircle2 className="h-5 w-5 text-[#fe6d2c]" />
              <h3 className="mt-3 font-display text-lg font-bold text-white">{feat.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">{feat.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-16 border-t border-white/10 pt-14">
        <h2 className="font-display text-2xl font-bold text-white">Explore our other products</h2>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {otherProducts.map((item) => (
            <Link
              key={item.slug}
              to={`/products/${item.slug}`}
              className="group flex items-center gap-3 rounded-xl border border-white/15 bg-[#07090e]/55 p-4 backdrop-blur-md transition-colors hover:border-[#fe6d2c]/55"
            >
              <img
                src={item.logo}
                alt={item.name}
                width={40}
                height={40}
                referrerPolicy="no-referrer"
                className="h-10 w-10 rounded-lg object-cover"
              />
              <div>
                <p className="font-display text-sm font-bold text-white group-hover:text-[#fe6d2c]">
                  {item.name}
                </p>
                <p className="text-xs text-slate-400">{item.category}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
