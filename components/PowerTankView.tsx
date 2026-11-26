import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BatteryFull,
  Car,
  ExternalLink,
  PlugZap,
  Ruler,
  Search,
  Zap,
} from 'lucide-react';
import type { BlordSiteContent } from '@/lib/blord-types';
import { formatNaira } from '@/lib/blord-utils';

type CapacityFilter = 'all' | 'heavy' | 'mid' | 'portable';

export function PowerTankView({ content }: { content: BlordSiteContent }) {
  const tanks = content.powerTanks ?? [];
  const [capacityFilter, setCapacityFilter] = useState<CapacityFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  const filteredTanks = tanks
    .filter((tank) => {
      if (capacityFilter === 'heavy' && tank.priceNgn < 3000000) return false;
      if (capacityFilter === 'mid' && (tank.priceNgn >= 3000000 || tank.priceNgn < 500000)) {
        return false;
      }
      if (capacityFilter === 'portable' && tank.priceNgn >= 500000) return false;

      const q = searchQuery.trim().toLowerCase();
      if (!q) return true;
      return (
        tank.name.toLowerCase().includes(q) ||
        tank.capacityWatt.toLowerCase().includes(q) ||
        tank.storageSpec.toLowerCase().includes(q) ||
        tank.appliances.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => (sortOrder === 'asc' ? a.priceNgn - b.priceNgn : b.priceNgn - a.priceNgn));

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      {/* 1. HERO HEADER */}
      <section className="rounded-3xl border border-white/20 bg-[#07090e]/50 p-8 backdrop-blur-md sm:p-12">
        <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#fe6d2c]">
              <Zap className="h-4 w-4" />
              <span>Blunt Energy · Blord Power Tanks & Solar Generators</span>
            </p>
            <h1
              className="mt-3 font-display font-bold tracking-tight text-white text-balance"
              style={{ fontSize: 'clamp(2.25rem, 4.2vw, 3.6rem)', lineHeight: 1.08 }}
            >
              Blord Power Tanks: Silent LiFePO4 Solar & Backup Power
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-200">
              Engineered by <strong>Blunt Gadgets (Blord Group)</strong> for uninterrupted home,
              studio, and office power across Nigeria. Compare exact wattage capacities from{' '}
              <strong>10,000W heavy-duty towers</strong> down to{' '}
              <strong>50,000mAh portable power tanks</strong>.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <a
              href="https://bluntgadgets.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-[#fe6d2c] px-5 py-3 text-sm font-semibold text-white whitespace-nowrap transition-colors hover:bg-[#ff7f44]"
            >
              <span>Visit Blunt Store</span>
              <ExternalLink className="h-4 w-4" />
            </a>
            <Link
              to="/cars"
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/[0.06] px-5 py-3 text-sm font-medium text-white whitespace-nowrap transition-colors hover:bg-white/15"
            >
              <Car className="h-4 w-4 text-[#fe6d2c]" />
              <span>Explore Blord Cars</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 2. FILTER BAR */}
      <section className="mt-10 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="Filter power tanks by capacity"
        >
          {(
            [
              { id: 'all', label: 'All Capacities' },
              { id: 'heavy', label: 'Heavy Duty (5kW – 10kW)' },
              { id: 'mid', label: 'Home & Office (1kW – 3kW)' },
              { id: 'portable', label: 'Portable Tanks (mAh)' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setCapacityFilter(tab.id)}
              className={`rounded-lg px-4 py-2 text-xs font-semibold whitespace-nowrap transition-colors ${
                capacityFilter === tab.id
                  ? 'bg-[#fe6d2c] text-white'
                  : 'border border-white/20 bg-[#07090e]/50 text-slate-100 backdrop-blur-md hover:bg-white/15'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-64">
            <label htmlFor="tanks-search" className="sr-only">
              Search power tanks
            </label>
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" />
            <input
              id="tanks-search"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search 10000W, AC, fridge..."
              className="w-full rounded-lg border border-white/20 bg-[#07090e]/60 py-2 pl-10 pr-4 text-sm text-white backdrop-blur-md placeholder:text-slate-400 focus:border-[#fe6d2c] focus:outline-none"
            />
          </div>

          <select
            aria-label="Sort power tanks by price"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
            className="rounded-lg border border-white/20 bg-[#07090e]/65 px-3.5 py-2 text-xs font-medium text-white backdrop-blur-md focus:border-[#fe6d2c] focus:outline-none"
          >
            <option value="desc">Capacity & Price: High to Low</option>
            <option value="asc">Capacity & Price: Low to High</option>
          </select>
        </div>
      </section>

      {/* 3. POWER TANK CATALOG GRID */}
      {filteredTanks.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-white/15 bg-[#07090e]/55 p-12 text-center backdrop-blur-md">
          <p className="text-base text-slate-200">No power tanks matched your filter.</p>
          <button
            type="button"
            onClick={() => {
              setCapacityFilter('all');
              setSearchQuery('');
            }}
            className="mt-4 rounded-lg bg-[#fe6d2c] px-4 py-2 text-xs font-semibold text-white"
          >
            Show All Power Tanks
          </button>
        </div>
      ) : (
        <section className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredTanks.map((tank) => (
            <article
              key={tank.id}
              className="group flex flex-col overflow-hidden rounded-3xl border border-white/20 bg-[#07090e]/55 backdrop-blur-md transition-all duration-200 hover:-translate-y-1 hover:border-[#fe6d2c]/65"
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-gradient-to-b from-slate-900/40 via-slate-900/65 to-[#07090e]/90">
                <img
                  src={tank.image}
                  alt={tank.name}
                  referrerPolicy="no-referrer"
                  className="absolute inset-0 h-full w-full object-contain p-4 transition-transform duration-300 group-hover:scale-105"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#07090e]/75 via-transparent to-transparent" />
                <div className="absolute left-4 top-4 rounded-lg border border-white/20 bg-[#07090e]/80 px-3 py-1 font-mono text-xs font-bold text-[#fe6d2c] backdrop-blur-md">
                  {tank.capacityWatt}
                </div>
                <div
                  className={`absolute right-4 top-4 rounded-lg px-3 py-1 text-[11px] font-semibold backdrop-blur-md ${
                    tank.status === 'Available'
                      ? 'bg-emerald-500/25 text-emerald-200 border border-emerald-400/40'
                      : tank.status === 'Low Stock'
                        ? 'bg-amber-500/25 text-amber-200 border border-amber-400/40'
                        : tank.status === 'Coming Soon'
                          ? 'bg-sky-500/25 text-sky-200 border border-sky-400/40'
                          : 'bg-red-500/25 text-red-200 border border-red-400/40'
                  }`}
                >
                  {tank.status}
                </div>
              </div>

              <div className="flex flex-1 flex-col justify-between p-6">
                <div>
                  <h2 className="font-display text-xl font-bold text-white">{tank.name}</h2>
                  <p className="mt-2 font-mono text-2xl font-bold text-[#fe6d2c] tabular-nums">
                    {formatNaira(tank.priceNgn)}
                  </p>

                  <div className="mt-4 space-y-2.5 border-y border-white/10 py-3.5 text-xs text-slate-200">
                    <div className="flex items-center gap-2">
                      <BatteryFull className="h-3.5 w-3.5 shrink-0 text-[#fe6d2c]" />
                      <span>{tank.storageSpec}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Ruler className="h-3.5 w-3.5 shrink-0 text-[#fe6d2c]" />
                      <span>Size: {tank.sizeDimensions}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <PlugZap className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#fe6d2c]" />
                      <span>Powers: {tank.appliances}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex items-center gap-3">
                  <Link
                    to="/contact-us"
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#fe6d2c] px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#ff7f44]"
                  >
                    <span>Order / Visit Store</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
