import { useState } from 'react';
import { Award, CheckCircle2, Mail, Phone, Search, Users, X } from 'lucide-react';
import type { BlordSiteContent } from '@/lib/blord-types';
import { filterBoardMembers, formatPhoneHref } from '@/lib/blord-utils';

export function AboutView({ content }: { content: BlordSiteContent }) {
  const { about } = content;
  const [staffQuery, setStaffQuery] = useState('');
  const [lightboxImage, setLightboxImage] = useState<{ image: string; alt: string } | null>(null);

  const filteredMembers = filterBoardMembers(about.boardMembers, staffQuery);

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      {/* 1. PAGE HEADER & MISSION / VISION */}
      <section className="border-b border-white/10 pb-16">
        <p className="text-xs font-medium text-[#fe6d2c]">{about.eyebrow}</p>
        <h1
          className="mt-3 max-w-3xl font-display font-bold tracking-tight text-white text-balance"
          style={{ fontSize: 'clamp(2.25rem, 4vw, 3.5rem)', lineHeight: 1.1 }}
        >
          Driving Financial Freedom & Multi-Sector Innovation Since 2019
        </h1>

        <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="rounded-2xl border border-white/15 bg-[#07090e]/55 p-8 backdrop-blur-md lg:col-span-7">
            <h2 className="font-display text-2xl font-bold text-white">{about.missionTitle}</h2>
            <p className="mt-2 text-sm text-slate-300">At BlordGroup, our mission is to:</p>
            <ul className="mt-6 space-y-4">
              {about.missionPoints.map((point, idx) => (
                <li key={idx} className="flex items-start gap-3 text-base leading-relaxed text-slate-100">
                  <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-[#fe6d2c]" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col justify-between rounded-2xl border border-white/15 bg-[#07090e]/60 p-8 backdrop-blur-md lg:col-span-5">
            <div>
              <h2 className="font-display text-2xl font-bold text-white">{about.visionTitle}</h2>
              <p className="mt-5 text-base leading-relaxed text-slate-200">
                {about.visionStatement}
              </p>
            </div>
            <div className="mt-8 border-t border-white/10 pt-5 text-xs text-slate-400">
              <span>Founded 2019 · Awka HQ · 10 Offices Across Nigeria & China</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. BOARD MEMBERS (ALL 16 OFFICIAL STAFF WITH EXACT PHOTOS & CONTACTS) */}
      <section id="leadership" className="border-b border-white/10 py-20">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-medium text-[#fe6d2c]">Leadership Directory</p>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-white">
              Board Members & Executive Team
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Showing {filteredMembers.length} of {about.boardMembers.length} official team members.
            </p>
          </div>

          <div className="relative w-full md:w-80">
            <label htmlFor="staff-search" className="sr-only">
              Search staff by name, role, or email
            </label>
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              id="staff-search"
              type="search"
              value={staffQuery}
              onChange={(e) => setStaffQuery(e.target.value)}
              placeholder="Search name, role, or email..."
              className="w-full rounded-lg border border-white/20 bg-[#07090e]/60 py-2.5 pl-10 pr-4 text-sm text-white backdrop-blur-md placeholder:text-slate-400 focus:border-[#fe6d2c] focus:outline-none"
            />
          </div>
        </div>

        {filteredMembers.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-white/15 bg-[#07090e]/55 p-10 text-center backdrop-blur-md">
            <p className="text-base font-medium text-slate-200">
              No team members matched &ldquo;{staffQuery}&rdquo;.
            </p>
            <button
              type="button"
              onClick={() => setStaffQuery('')}
              className="mt-4 rounded-lg bg-[#fe6d2c] px-4 py-2 text-xs font-semibold text-white hover:bg-[#ff7f44]"
            >
              Show All Team Members
            </button>
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {filteredMembers.map((member) => (
              <article
                key={member.id}
                className="group overflow-hidden rounded-2xl border border-white/15 bg-[#07090e]/55 backdrop-blur-md transition-all duration-200 hover:-translate-y-1 hover:border-[#fe6d2c]/55"
              >
                <div className="relative aspect-square w-full overflow-hidden bg-slate-900">
                  <img
                    src={member.image}
                    alt={member.alt || member.name}
                    referrerPolicy="no-referrer"
                    className="absolute inset-0 h-full w-full object-cover object-[center_22%] transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#07090e]/75 to-transparent" />
                </div>

                <div className="p-5">
                  <p className="text-xs font-medium text-[#fe6d2c]">{member.role}</p>
                  <h3 className="mt-1 font-display text-lg font-bold text-white">{member.name}</h3>

                  {(member.email || member.phone) && (
                    <div className="mt-4 space-y-2 border-t border-white/10 pt-3 text-xs text-slate-300">
                      {member.email && (
                        <a
                          href={`mailto:${member.email}`}
                          className="flex items-center gap-2 truncate transition-colors hover:text-[#fe6d2c]"
                        >
                          <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                          <span className="truncate">{member.email}</span>
                        </a>
                      )}
                      {member.phone && (
                        <a
                          href={formatPhoneHref(member.phone)}
                          className="flex items-center gap-2 font-mono tabular-nums transition-colors hover:text-[#fe6d2c]"
                        >
                          <Phone className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                          <span>{member.phone}</span>
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* 3. THE BLORD GROUP TEAM GALLERY (ALL 5 GROUP PHOTOS) */}
      <section className="border-b border-white/10 py-20">
        <div className="flex items-center gap-2 text-xs font-medium text-[#fe6d2c]">
          <Users className="h-4 w-4" />
          <span>Team Culture</span>
        </div>
        <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-white">
          The Blord Group Team
        </h2>

        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {about.groupPhotos.map((photo) => (
            <button
              key={photo.id}
              type="button"
              onClick={() => setLightboxImage({ image: photo.image, alt: photo.alt })}
              aria-label={`View ${photo.alt} larger`}
              className="group relative aspect-video overflow-hidden rounded-2xl border border-white/10 bg-[#0f131c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fe6d2c]"
            >
              <img
                src={photo.image}
                alt={photo.alt}
                referrerPolicy="no-referrer"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/20 opacity-0 transition-opacity group-hover:opacity-100" />
            </button>
          ))}
        </div>
      </section>

      {/* 4. RECOGNITION & AWARDS */}
      <section id="awards" className="border-b border-white/10 py-20">
        <p className="text-xs font-medium text-[#fe6d2c]">{about.awardsEyebrow}</p>
        <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-white">
          {about.awardsTitle}
        </h2>
        <p className="mt-3 max-w-2xl text-base text-slate-400">{about.awardsSubtitle}</p>

        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
          {about.awards.map((award) => (
            <article
              key={award.id}
              className="group overflow-hidden rounded-2xl border border-white/15 bg-[#07090e]/55 backdrop-blur-md"
            >
              <button
                type="button"
                onClick={() => setLightboxImage({ image: award.image, alt: award.alt })}
                aria-label={`Inspect photo for ${award.title}`}
                className="relative block aspect-[4/3] w-full overflow-hidden bg-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fe6d2c]"
              >
                <img
                  src={award.image}
                  alt={award.alt}
                  referrerPolicy="no-referrer"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <span className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-[#07090e]/80 text-[#fe6d2c] backdrop-blur-md">
                  <Award className="h-4 w-4" />
                </span>
              </button>
              <div className="p-6">
                <p className="text-xs font-medium text-[#fe6d2c]">{award.recipient}</p>
                <h3 className="mt-1 font-display text-xl font-bold text-white">{award.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">{award.summary}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* 5. OUR HISTORY & DEDICATION */}
      <section className="border-b border-white/10 py-20">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p className="text-xs font-medium text-[#fe6d2c]">{about.historyEyebrow}</p>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl text-balance">
              {about.historyTitle}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-200">
              {about.historySubtitle}
            </p>

            <div className="mt-8 rounded-2xl border border-white/15 bg-[#07090e]/55 p-6 backdrop-blur-md">
              <h3 className="font-display text-lg font-bold text-white">{about.dedicationTitle}</h3>
              <div className="mt-3 space-y-3 text-sm leading-relaxed text-slate-200">
                {about.dedicationParagraphs.map((para, idx) => (
                  <p key={idx}>{para}</p>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-5 rounded-2xl border border-white/15 bg-[#07090e]/55 p-8 backdrop-blur-md lg:col-span-7">
            {about.historyParagraphs.map((para, idx) => (
              <p key={idx} className="text-base leading-relaxed text-slate-200">
                {para}
              </p>
            ))}
          </div>
        </div>
      </section>

      {/* 6. OUR GUIDING PRINCIPLES */}
      <section className="pt-20">
        <p className="text-xs font-medium text-[#fe6d2c]">{about.principlesEyebrow}</p>
        <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-white">
          {about.principlesTitle}
        </h2>
        <p className="mt-3 max-w-2xl text-base text-slate-300">{about.principlesSubtitle}</p>

        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {about.principles.map((val, index) => (
            <div
              key={val.id}
              className="rounded-2xl border border-white/15 bg-[#07090e]/55 p-6 backdrop-blur-md"
            >
              <span className="font-mono text-2xl font-bold text-[#fe6d2c] tabular-nums">
                {String(index + 1).padStart(2, '0')}
              </span>
              <h3 className="mt-3 font-display text-xl font-bold text-white">{val.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{val.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* LIGHTBOX MODAL */}
      {lightboxImage && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={lightboxImage.alt}
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-4xl overflow-hidden rounded-2xl border border-white/15 bg-[#0f131c]"
          >
            <button
              type="button"
              onClick={() => setLightboxImage(null)}
              aria-label="Close photo preview"
              className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/70 text-white hover:bg-[#fe6d2c]"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="relative aspect-video w-full">
              <img
                src={lightboxImage.image}
                alt={lightboxImage.alt}
                referrerPolicy="no-referrer"
                className="absolute inset-0 h-full w-full object-contain"
              />
            </div>
            <p className="border-t border-white/10 px-5 py-3 text-sm text-slate-300">
              {lightboxImage.alt}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
