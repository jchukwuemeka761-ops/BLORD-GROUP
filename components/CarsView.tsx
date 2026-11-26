import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BatteryCharging,
  Car,
  CheckCircle2,
  Gauge,
  MapPin,
  Ruler,
  Search,
  Sparkles,
} from 'lucide-react';
import type { BlordSiteContent } from '@/lib/blord-types';
import { formatNaira } from '@/lib/blord-utils';

export function CarsView({ content }: { content: BlordSiteContent }) {
  const cars = content.cars ?? [];
  const categories = ['All', ...Array.from(new Set(cars.map((c) => c.category)))];

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const filteredCars = cars
    .filter((car) => {
      if (selectedCategory !== 'All' && car.category !== selectedCategory) return false;
      const q = searchQuery.trim().toLowerCase();
      if (!q) return true;
      return (
        car.name.toLowerCase().includes(q) ||
        car.category.toLowerCase().includes(q) ||
        car.sizeClass.toLowerCase().includes(q) ||
        car.batteryCapacity.toLowerCase().includes(q)
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
              <Car className="h-4 w-4" />
              <span>B Cars · Blord Electric & Import Fleet</span>
            </p>
            <h1
              className="mt-3 font-display font-bold tracking-tight text-white text-balance"
              style={{ fontSize: 'clamp(2.25rem, 4.2vw, 3.6rem)', lineHeight: 1.08 }}
            >
              Blord Electric Cars & China-to-Nigeria Auto Imports
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-200">
              Bypass petrol queues with zero-emission electric vehicles sourced directly from
              verified Guangzhou factories and delivered to Nigeria with full quality checks. Pay
              conveniently in <strong>Naira (₦), USDT, or Bitcoin (BTC)</strong>.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/contact-us"
              className="inline-flex items-center gap-2 rounded-xl bg-[#fe6d2c] px-5 py-3 text-sm font-semibold text-white whitespace-nowrap transition-colors hover:bg-[#ff7f44]"
            >
              <MapPin className="h-4 w-4" />
              <span>Book Inspection at Any Branch</span>
            </Link>
            <Link
              to="/power-tank"
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/[0.06] px-5 py-3 text-sm font-medium text-white whitespace-nowrap transition-colors hover:bg-white/15"
            >
              <Sparkles className="h-4 w-4 text-[#fe6d2c]" />
              <span>Explore Power Tanks</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 2. FILTER BAR */}
      <section className="mt-10 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter electric cars by type">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-lg px-4 py-2 text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-[#fe6d2c] text-white'
                  : 'border border-white/20 bg-[#07090e]/50 text-slate-100 backdrop-blur-md hover:bg-white/15'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-64">
            <label htmlFor="cars-search" className="sr-only">
              Search electric cars
            </label>
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" />
            <input
              id="cars-search"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search model, SUV, kWh..."
              className="w-full rounded-lg border border-white/20 bg-[#07090e]/60 py-2 pl-10 pr-4 text-sm text-white backdrop-blur-md placeholder:text-slate-400 focus:border-[#fe6d2c] focus:outline-none"
            />
          </div>

          <select
            aria-label="Sort vehicles by price"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
            className="rounded-lg border border-white/20 bg-[#07090e]/65 px-3.5 py-2 text-xs font-medium text-white backdrop-blur-md focus:border-[#fe6d2c] focus:outline-none"
          >
            <option value="asc">Price: Lowest First</option>
            <option value="desc">Price: Highest First</option>
          </select>
        </div>
      </section>

      {/* 3. VEHICLE CATALOG GRID */}
      {filteredCars.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-white/15 bg-[#07090e]/55 p-12 text-center backdrop-blur-md">
          <p className="text-base text-slate-200">No vehicles matched your filter.</p>
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('All');
              setSearchQuery('');
            }}
            className="mt-4 rounded-lg bg-[#fe6d2c] px-4 py-2 text-xs font-semibold text-white"
          >
            Show All Vehicles
          </button>
        </div>
      ) : (
        <section className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredCars.map((car) => (
            <article
              key={car.id}
              className="group flex flex-col overflow-hidden rounded-3xl border border-white/20 bg-[#07090e]/55 backdrop-blur-md transition-all duration-200 hover:-translate-y-1 hover:border-[#fe6d2c]/65"
            >
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-900">
                <img
                  src={car.image}
                  alt={car.name}
                  referrerPolicy="no-referrer"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#07090e]/80 via-transparent to-transparent" />
                <div className="absolute left-4 top-4 rounded-lg border border-white/20 bg-[#07090e]/75 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur-md">
                  {car.category}
                </div>
                <div
                  className={`absolute right-4 top-4 rounded-lg px-3 py-1 text-[11px] font-semibold backdrop-blur-md ${
                    car.status === 'Available'
                      ? 'bg-emerald-500/25 text-emerald-200 border border-emerald-400/40'
                      : car.status === 'Low Stock'
                        ? 'bg-amber-500/25 text-amber-200 border border-amber-400/40'
                        : car.status === 'Pre-Order'
                          ? 'bg-sky-500/25 text-sky-200 border border-sky-400/40'
                          : 'bg-red-500/25 text-red-200 border border-red-400/40'
                  }`}
                >
                  {car.status}
                </div>
              </div>

              <div className="flex flex-1 flex-col justify-between p-6">
                <div>
                  <h2 className="font-display text-xl font-bold text-white">{car.name}</h2>
                  <p className="mt-2 font-mono text-2xl font-bold text-[#fe6d2c] tabular-nums">
                    {formatNaira(car.priceNgn)}
                  </p>

                  <div className="mt-4 space-y-2 border-y border-white/10 py-3.5 text-xs text-slate-200">
                    <div className="flex items-center gap-2">
                      <Ruler className="h-3.5 w-3.5 shrink-0 text-[#fe6d2c]" />
                      <span>{car.sizeClass}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BatteryCharging className="h-3.5 w-3.5 shrink-0 text-[#fe6d2c]" />
                      <span>{car.batteryCapacity}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Gauge className="h-3.5 w-3.5 shrink-0 text-[#fe6d2c]" />
                      <span>Driving Range: {car.rangeKm}</span>
                    </div>
                  </div>

                  <ul className="mt-4 space-y-1.5">
                    {car.highlights.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-xs text-slate-300">
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#fe6d2c]" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6 flex items-center gap-3 pt-2">
                  <Link
                    to="/contact-us"
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#fe6d2c] px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#ff7f44]"
                  >
                    <span>Order / Inspect Vehicle</span>
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
