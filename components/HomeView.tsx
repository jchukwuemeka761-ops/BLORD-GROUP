import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  ArrowRight,
  ArrowUpRight,
  Car,
  Check,
  ChevronRight,
  Globe,
  MapPin,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import type { BlordSiteContent } from '@/lib/blord-types';
import { formatNaira } from '@/lib/blord-utils';

export function HomeView({ content }: { content: BlordSiteContent }) {
  const [activeFeatureId, setActiveFeatureId] = useState<string>(
    content.coreFeatures[0]?.id ?? '1'
  );

  return (
    <div className="relative">
      {/* 1. HERO SECTION */}
      <section className="relative isolate overflow-hidden border-b border-white/10">
        {/* Balanced directional contrast over vivid full-screen live video */}
        <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-r from-[#07090e]/70 via-[#07090e]/30 to-transparent" />

        <div className="mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 md:pb-24 md:pt-24 lg:px-8">
          <motion.div
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-3xl rounded-3xl border border-white/15 bg-[#07090e]/50 p-7 shadow-2xl backdrop-blur-md sm:p-10"
          >
            <p className="text-xs font-semibold tracking-wide text-[#fe6d2c]">
              {content.brandName} · {content.tagline}
            </p>
            <h1
              className="mt-4 font-display font-bold tracking-tight text-white text-balance drop-shadow-sm"
              style={{ fontSize: 'clamp(2.25rem, 4.2vw, 4rem)', lineHeight: 1.08 }}
            >
              {content.heroTitle}
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-slate-200 sm:text-lg">
              {content.heroSubtitle}
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-4">
              <a
                href="#products"
                className="inline-flex items-center gap-2 rounded-lg bg-[#fe6d2c] px-6 py-3 text-sm font-semibold text-white whitespace-nowrap transition-colors duration-150 hover:bg-[#ff7f44] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <span>Our Products</span>
                <ArrowRight className="h-4 w-4" />
              </a>
              <Link
                to="/contact-us"
                className="inline-flex items-center gap-2 rounded-lg border border-white/25 bg-[#07090e]/55 px-6 py-3 text-sm font-medium text-white whitespace-nowrap backdrop-blur-md transition-colors duration-150 hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fe6d2c]"
              >
                <MapPin className="h-4 w-4 text-[#fe6d2c]" />
                <span>Find Nearest Branch</span>
              </Link>
            </div>
          </motion.div>

          {/* 3-Column Metrics Strip directly below Hero Statement */}
          <div className="mt-16 grid grid-cols-1 gap-4 border-t border-white/10 pt-10 sm:grid-cols-3 lg:gap-8">
            {content.heroStats.map((stat) => (
              <div
                key={stat.id}
                className="rounded-xl border border-white/15 bg-[#07090e]/55 p-6 backdrop-blur-md"
              >
                <p className="font-mono text-3xl font-bold tracking-tight text-white tabular-nums sm:text-4xl">
                  {stat.value}
                </p>
                <p className="mt-2 text-sm text-slate-300">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 2. OUR PRODUCTS ECOSYSTEM */}
      <section id="products" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-medium text-[#fe6d2c]">Ecosystem</p>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Our Products
            </h2>
          </div>
          <p className="max-w-md text-sm leading-relaxed text-slate-400">
            Six purpose-built platforms spanning digital bill payments, cryptocurrency wallets,
            USD virtual cards, gadgets, social growth, and automobile imports.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {content.products.map((product) => (
            <Link
              key={product.slug}
              to={`/products/${product.slug}`}
              className="group flex flex-col justify-between rounded-2xl border border-white/15 bg-[#07090e]/55 p-6 backdrop-blur-md transition-all duration-200 hover:-translate-y-1 hover:border-[#fe6d2c]/60 hover:bg-[#0f131c]/75"
            >
              <div>
                <div className="flex items-start justify-between gap-4">
                  <div className="h-16 w-16 overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-1">
                    <img
                      src={product.logo}
                      alt={product.name}
                      width={64}
                      height={64}
                      referrerPolicy="no-referrer"
                      className="h-full w-full rounded-xl object-cover"
                    />
                  </div>
                  <ArrowUpRight className="h-5 w-5 text-slate-500 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[#fe6d2c]" />
                </div>

                <div className="mt-5 flex items-center justify-between gap-2 text-xs text-slate-400">
                  <span>{product.category}</span>
                  {product.priceLabel && (
                    <span className="font-mono font-semibold text-[#fe6d2c] tabular-nums">
                      {product.priceLabel}
                    </span>
                  )}
                </div>
                <h3 className="mt-1 font-display text-xl font-bold text-white group-hover:text-[#fe6d2c] transition-colors">
                  {product.name}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{product.summary}</p>
              </div>

              <div className="mt-6 flex items-center gap-1.5 text-xs font-semibold text-slate-300 group-hover:text-white">
                <span>Explore {product.name}</span>
                <ChevronRight className="h-3.5 w-3.5 text-[#fe6d2c]" />
              </div>
            </Link>
          ))}
        </div>

        {/* Dedicated Flagship Hardware & EV Catalog Links */}
        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Link
            to="/cars"
            className="group relative overflow-hidden rounded-3xl border border-white/20 bg-[#07090e]/55 p-7 backdrop-blur-md transition-all hover:-translate-y-1 hover:border-[#fe6d2c]/65"
          >
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              <div className="relative h-32 w-full shrink-0 overflow-hidden rounded-2xl sm:w-44">
                <img
                  src="/assets/cars/byd-atto3.jpg"
                  alt="Blord Electric Cars Fleet"
                  referrerPolicy="no-referrer"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="flex-1">
                <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#fe6d2c]">
                  <Car className="h-3.5 w-3.5" />
                  <span>Blord Electric Vehicles ({content.cars?.length ?? 6} Models)</span>
                </p>
                <h3 className="mt-1.5 font-display text-xl font-bold text-white group-hover:text-[#fe6d2c]">
                  Blord Cars & China EV Imports
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
                  From {formatNaira(Math.min(...(content.cars ?? [{ priceNgn: 15500000 }]).map((c) => c.priceNgn)))} ·
                  BYD Seagull, Dolphin, Atto 3, Song Plus & Changan Deepal S07. Pay via Naira, USDT, or BTC.
                </p>
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-white">
                  <span>Browse Vehicles & Prices</span>
                  <ChevronRight className="h-3.5 w-3.5 text-[#fe6d2c]" />
                </span>
              </div>
            </div>
          </Link>

          <Link
            to="/power-tank"
            className="group relative overflow-hidden rounded-3xl border border-white/20 bg-[#07090e]/55 p-7 backdrop-blur-md transition-all hover:-translate-y-1 hover:border-[#fe6d2c]/65"
          >
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              <div className="relative h-32 w-full shrink-0 overflow-hidden rounded-2xl sm:w-44">
                <img
                  src="/assets/power-tanks/tank-5000w.jpg"
                  alt="Blord Power Tank Solar Generator"
                  referrerPolicy="no-referrer"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="flex-1">
                <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#fe6d2c]">
                  <Zap className="h-3.5 w-3.5" />
                  <span>Blunt Solar Power Tanks ({content.powerTanks?.length ?? 7} Sizes)</span>
                </p>
                <h3 className="mt-1.5 font-display text-xl font-bold text-white group-hover:text-[#fe6d2c]">
                  Blord Power Tanks & Generators
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
                  From {formatNaira(Math.min(...(content.powerTanks ?? [{ priceNgn: 14000 }]).map((t) => t.priceNgn)))} to{' '}
                  {formatNaira(Math.max(...(content.powerTanks ?? [{ priceNgn: 6420000 }]).map((t) => t.priceNgn)))} ·
                  1,000W to 10,000W LiFePO4 Solar Generators & 50,000mAh Power Banks.
                </p>
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-white">
                  <span>Compare Capacities & Prices</span>
                  <ChevronRight className="h-3.5 w-3.5 text-[#fe6d2c]" />
                </span>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* 3. WHERE INNOVATION MEETS EXCELLENCE + PAYMENT MANAGEMENT */}
      <section className="border-y border-white/10 bg-[#07090e]/35 py-20 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <p className="text-xs font-medium text-[#fe6d2c]">{content.paymentsEyebrow}</p>
              <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl text-balance">
                {content.innovationHeadline}
              </h2>
              <p className="mt-4 text-base leading-relaxed text-slate-200">
                {content.innovationSubtitle}
              </p>

              <div className="mt-8 rounded-2xl border border-white/15 bg-[#07090e]/60 p-6 backdrop-blur-md">
                <h3 className="font-display text-lg font-semibold text-white">
                  {content.paymentsTitle}
                </h3>
                <ul className="mt-4 space-y-3">
                  {content.paymentsBullets.map((bullet) => (
                    <li key={bullet} className="flex items-center gap-3 text-sm text-slate-300">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#fe6d2c]/15 text-[#fe6d2c]">
                        <Check className="h-3.5 w-3.5" />
                      </span>
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Genuine product showcase assets */}
            <div className="lg:col-span-7">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#121824] p-4">
                  <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-black/20">
                    <img
                      src="/assets/images/explore.png"
                      alt="Explore Blord Group fintech platform"
                      referrerPolicy="no-referrer"
                      className="absolute inset-0 h-full w-full object-contain p-2"
                    />
                  </div>
                  <p className="mt-3 text-xs font-medium text-slate-400">
                    Billpoint & Ecosystem Overview
                  </p>
                </div>

                <div className="grid grid-rows-2 gap-4">
                  <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#121824] p-4">
                    <div className="relative aspect-[16/9] overflow-hidden rounded-xl bg-black/20">
                      <img
                        src="/assets/images/expense.png"
                        alt="Blord Group expense tracking"
                        referrerPolicy="no-referrer"
                        className="absolute inset-0 h-full w-full object-contain p-1"
                      />
                    </div>
                  </div>
                  <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#121824] p-4">
                    <div className="relative aspect-[16/9] overflow-hidden rounded-xl bg-black/20">
                      <img
                        src="/assets/images/payment.png"
                        alt="Blord Group payment methods"
                        referrerPolicy="no-referrer"
                        className="absolute inset-0 h-full w-full object-contain p-1"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. PROOF OF SCALE BANNER */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-white/15">
          <div className="relative min-h-[380px] w-full">
            <img
              src="/assets/team/group-5.jpeg"
              alt="Blord Group team and leadership"
              referrerPolicy="no-referrer"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#07090e]/80 via-[#07090e]/45 to-[#07090e]/20" />

            <div className="relative z-10 flex min-h-[380px] flex-col justify-between gap-8 p-8 sm:p-12 lg:flex-row lg:items-end">
              <div className="max-w-xl">
                <p className="text-xs font-medium text-[#fe6d2c]">Verified Institutional Scale</p>
                <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl text-balance">
                  {content.trustHeadline}
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {content.trustMetrics.map((metric) => (
                  <div
                    key={metric.id}
                    className="rounded-2xl border border-white/15 bg-[#07090e]/75 px-6 py-5 backdrop-blur-md"
                  >
                    <p className="font-mono text-3xl font-bold text-[#fe6d2c] tabular-nums sm:text-4xl">
                      {metric.value}
                    </p>
                    <p className="mt-1.5 text-sm text-slate-200">{metric.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. GLOBAL REACH — BLORD GROUP CHINA */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-12">
          <div className="relative min-h-[380px] overflow-hidden rounded-3xl border border-white/10 lg:col-span-5">
            <img
              src={content.chinaImage}
              alt="Blord Group China Office in Guangzhou"
              referrerPolicy="no-referrer"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6">
              <p className="flex items-center gap-2 text-xs font-medium text-[#fe6d2c]">
                <Globe className="h-4 w-4" />
                <span>Guangzhou, China</span>
              </p>
              <p className="mt-1 text-sm text-slate-200">
                Office 5106, Floor 5, GuoTai International Trade Market, Yuexiu District
              </p>
            </div>
          </div>

          <div className="flex flex-col justify-center rounded-3xl border border-white/15 bg-[#07090e]/60 p-8 backdrop-blur-md lg:col-span-7 lg:p-10">
            <p className="text-xs font-medium text-[#fe6d2c]">{content.chinaEyebrow}</p>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
              {content.chinaTitle}
            </h2>

            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {content.chinaSteps.map((step) => (
                <div
                  key={step.step}
                  className="rounded-xl border border-white/10 bg-white/[0.03] p-5 transition-colors hover:border-[#fe6d2c]/40"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-2xl font-bold text-[#fe6d2c] tabular-nums">
                      {step.step}
                    </span>
                  </div>
                  <h3 className="mt-3 font-display text-base font-semibold text-white">
                    {step.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-400">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 6. CORE FEATURES */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-xs font-medium text-[#fe6d2c]">{content.coreFeaturesEyebrow}</p>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl text-balance">
            {content.coreFeaturesTitle}
          </h2>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {content.coreFeatures.map((feat) => {
            const isSelected = activeFeatureId === feat.id;
            return (
              <button
                key={feat.id}
                type="button"
                onClick={() => setActiveFeatureId(feat.id)}
                className={`group relative overflow-hidden rounded-2xl border text-left backdrop-blur-md transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fe6d2c] ${
                  isSelected
                    ? 'border-[#fe6d2c] bg-[#0f131c]/75'
                    : 'border-white/15 bg-[#07090e]/55 hover:border-white/30'
                }`}
              >
                <div className="relative aspect-[16/10] w-full overflow-hidden">
                  <img
                    src={feat.image}
                    alt={feat.alt}
                    referrerPolicy="no-referrer"
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#07090e]/75 via-transparent to-transparent" />
                </div>
                <div className="p-6">
                  <h3 className="font-display text-lg font-bold text-white">{feat.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-300">{feat.subtitle}</p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 7. LEADERSHIP & BRANCHES CONVERSION */}
      <section className="border-t border-white/10 bg-[#07090e]/40 py-20 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-12">
            <div className="relative min-h-[340px] overflow-hidden rounded-3xl border border-white/10 lg:col-span-5">
              <img
                src="/assets/team/ceo-office.jpg"
                alt="Linus Williams (Blord) - CEO of Blord Group"
                referrerPolicy="no-referrer"
                className="absolute inset-0 h-full w-full object-cover object-[center_25%]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6">
                <p className="text-xs font-medium text-[#fe6d2c]">Founder & CEO</p>
                <p className="mt-1 font-display text-xl font-bold text-white">
                  Chief Linus Williams Ifejirika (Blord)
                </p>
              </div>
            </div>

            <div className="flex flex-col justify-between rounded-3xl border border-white/15 bg-[#07090e]/60 p-8 backdrop-blur-md lg:col-span-7 lg:p-10">
              <div>
                <p className="flex items-center gap-2 text-xs font-medium text-[#fe6d2c]">
                  <ShieldCheck className="h-4 w-4" />
                  <span>Leadership & Global Footprint</span>
                </p>
                <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-white text-balance">
                  Meet the 16-member leadership board and visit any of our 10 offices.
                </h2>
                <p className="mt-4 text-base leading-relaxed text-slate-300">
                  From our Awka headquarters to Abuja, Lagos, Port Harcourt, Asaba, Benin, Owerri,
                  Enugu, Aba, and Guangzhou, China — every branch includes clickable turn-by-turn
                  Google Maps driving directions straight to our doors.
                </p>
              </div>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  to="/about-us"
                  className="inline-flex items-center gap-2 rounded-lg bg-[#fe6d2c] px-5 py-3 text-sm font-semibold text-white whitespace-nowrap transition-colors hover:bg-[#ff7f44]"
                >
                  <span>About & Leadership Team</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/contact-us"
                  className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/[0.04] px-5 py-3 text-sm font-medium text-white whitespace-nowrap transition-colors hover:bg-white/10"
                >
                  <MapPin className="h-4 w-4 text-[#fe6d2c]" />
                  <span>All 10 Branches & Google Maps</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
