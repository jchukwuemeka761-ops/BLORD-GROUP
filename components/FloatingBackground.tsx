import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useReducedMotion } from 'motion/react';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';

interface SlideItem {
  src: string;
  label: string;
}

const GENERAL_SLIDESHOW: SlideItem[] = [
  { src: '/assets/images/features/fintech-tower.jpg', label: 'Modern Corporate Skyscrapers' },
  { src: '/assets/images/blord-china-office-new.jpg', label: 'Blord Group China Office' },
  { src: '/assets/images/features/digital-wallet.jpg', label: 'Architectural Skyline Complex' },
  { src: '/assets/team/group-5.jpeg', label: 'Blord Group Leadership & Team' },
  { src: '/assets/images/features/social-growth.jpg', label: 'Global Trade Infrastructure' },
  { src: '/assets/images/award2.jpg', label: 'Youth Influencer Award Recognition' },
  { src: '/assets/images/award.jpg', label: 'Blord Group Executive Awards' },
  { src: '/assets/team/group-3.jpeg', label: 'Blord Group Corporate Family' },
];

const CARS_SLIDESHOW: SlideItem[] = [
  { src: '/assets/cars/byd-atto3.jpg', label: 'BYD Atto 3 Electric SUV' },
  { src: '/assets/cars/deepal-s07.jpg', label: 'Changan Deepal S07 Smart SUV' },
  { src: '/assets/cars/byd-song-plus.jpg', label: 'BYD Song Plus EV' },
  { src: '/assets/cars/byd-dolphin.jpg', label: 'BYD Dolphin EV' },
  { src: '/assets/cars/byd-seagull.jpg', label: 'BYD Seagull Compact EV' },
  { src: '/assets/cars/wuling-mini-ev.jpg', label: 'Wuling Hongguang Mini EV' },
];

const POWER_TANK_SLIDESHOW: SlideItem[] = [
  { src: '/assets/power-tanks/tank-10000w.jpg', label: '10,000W Blunt Solar Generator' },
  { src: '/assets/power-tanks/tank-5000w.jpg', label: '5,000W Blunt Power Generator' },
  { src: '/assets/power-tanks/tank-3000w.jpg', label: '3,000W Blunt Solar Power Tank' },
  { src: '/assets/power-tanks/tank-1500w.jpg', label: '1,500W Blunt Solar Power Tank' },
  { src: '/assets/power-tanks/tank-1000w.jpg', label: '1,000W Portable Power Tank' },
];

interface KineticNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  hue: 'amber' | 'gold' | 'cyan';
}

export function FloatingBackground() {
  const { pathname } = useLocation();
  const prefersReduced = useReducedMotion();
  const [slideState, setSlideState] = useState<{ routeKey: string; index: number }>({
    routeKey: pathname,
    index: 0,
  });
  const [paused, setPaused] = useState(false);
  const [pointer, setPointer] = useState({ x: 0.5, y: 0.45 });
  const pointerRef = useRef({ x: 0.5, y: 0.45 });
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const isExecutivePage = pathname.startsWith('/executive-admin');
  const isVideoPage = pathname === '/' || pathname.startsWith('/admin') || isExecutivePage;
  const routeKey = pathname.startsWith('/cars')
    ? 'cars'
    : pathname.startsWith('/power-tank')
      ? 'tanks'
      : 'general';

  const slides =
    routeKey === 'cars'
      ? CARS_SLIDESHOW
      : routeKey === 'tanks'
        ? POWER_TANK_SLIDESHOW
        : GENERAL_SLIDESHOW;

  const activeSlideIndex =
    slideState.routeKey === routeKey ? slideState.index % slides.length : 0;

  useEffect(() => {
    if (isVideoPage || prefersReduced || paused) return;
    const timer = setInterval(() => {
      setSlideState((prev) => ({
        routeKey,
        index: prev.routeKey === routeKey ? (prev.index + 1) % slides.length : 1,
      }));
    }, 4500);
    return () => clearInterval(timer);
  }, [isVideoPage, prefersReduced, paused, routeKey, slides.length]);

  useEffect(() => {
    if (prefersReduced) return;
    const handleMove = (e: PointerEvent) => {
      const nx = e.clientX / Math.max(window.innerWidth, 1);
      const ny = e.clientY / Math.max(window.innerHeight, 1);
      pointerRef.current = { x: nx, y: ny };
      setPointer({ x: nx, y: ny });
    };
    window.addEventListener('pointermove', handleMove, { passive: true });
    return () => window.removeEventListener('pointermove', handleMove);
  }, [prefersReduced]);

  // Captivating real-time kinetic particle + light ribbon canvas specifically for /executive-admin
  useEffect(() => {
    if (!isExecutivePage) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    let width = window.innerWidth;
    let height = window.innerHeight;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const nodes: KineticNode[] = Array.from({ length: 34 }, (_, idx) => ({
      x: ((idx * 173) % 100) * 0.01 * width,
      y: ((idx * 97) % 100) * 0.01 * height,
      vx: (((idx % 7) - 3) * 0.22) || 0.32,
      vy: ((((idx + 2) % 5) - 2) * 0.22) || -0.28,
      radius: 1.8 + (idx % 4) * 0.9,
      hue: idx % 5 === 0 ? 'cyan' : idx % 2 === 0 ? 'amber' : 'gold',
    }));

    let t = 0;
    const drawFrame = () => {
      t += 0.014;
      ctx.clearRect(0, 0, width, height);

      // Sweeping live luminous energy waves across the live video backdrop
      for (let wave = 0; wave < 3; wave += 1) {
        ctx.beginPath();
        const baseY = height * (0.28 + wave * 0.22);
        const amp = 28 + wave * 14;
        const speed = t * (0.9 + wave * 0.25);
        for (let x = 0; x <= width; x += 36) {
          const y =
            baseY +
            Math.sin(x * 0.0045 + speed + wave) * amp +
            Math.cos(x * 0.0022 - speed * 0.7) * 18;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle =
          wave === 1
            ? 'rgba(56, 189, 248, 0.22)'
            : wave === 2
              ? 'rgba(255, 190, 92, 0.22)'
              : 'rgba(254, 109, 44, 0.28)';
        ctx.lineWidth = 1.6;
        ctx.stroke();
      }

      const px = pointerRef.current.x * width;
      const py = pointerRef.current.y * height;

      for (let i = 0; i < nodes.length; i += 1) {
        const node = nodes[i];
        if (!prefersReduced) {
          node.x += node.vx;
          node.y += node.vy;
          if (node.x < -30) node.x = width + 30;
          if (node.x > width + 30) node.x = -30;
          if (node.y < -30) node.y = height + 30;
          if (node.y > height + 30) node.y = -30;

          const dxP = px - node.x;
          const dyP = py - node.y;
          const distP = Math.hypot(dxP, dyP);
          if (distP > 4 && distP < 210) {
            node.x += (dxP / distP) * 0.35;
            node.y += (dyP / distP) * 0.35;
          }
        }

        // Connect neighboring geometric constellations
        for (let j = i + 1; j < nodes.length; j += 1) {
          const other = nodes[j];
          const dx = node.x - other.x;
          const dy = node.y - other.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 175) {
            const alpha = (1 - dist / 175) * 0.28;
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(other.x, other.y);
            ctx.strokeStyle =
              node.hue === 'cyan'
                ? `rgba(56, 189, 248, ${alpha.toFixed(3)})`
                : `rgba(254, 109, 44, ${alpha.toFixed(3)})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }

        const fill =
          node.hue === 'cyan'
            ? 'rgba(125, 211, 252, 0.85)'
            : node.hue === 'gold'
              ? 'rgba(253, 224, 71, 0.8)'
              : 'rgba(254, 128, 64, 0.9)';
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = fill;
        ctx.fill();
      }

      if (!prefersReduced) {
        rafId = window.requestAnimationFrame(drawFrame);
      }
    };

    drawFrame();

    return () => {
      window.removeEventListener('resize', resize);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, [isExecutivePage, prefersReduced]);

  const offsetX = prefersReduced ? 0 : (pointer.x - 0.5) * -18;
  const offsetY = prefersReduced ? 0 : (pointer.y - 0.5) * -14;

  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#0b101b]"
      >
        {/* Interactive parallax wrapper */}
        <div
          className="absolute -inset-6 transition-transform duration-300 ease-out will-change-transform"
          style={{ transform: `translate3d(${offsetX}px, ${offsetY}px, 0) scale(1.04)` }}
        >
          {isVideoPage ? (
            <div className="relative h-full w-full">
              <video
                key="blord-bg-video"
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
                className={`h-full w-full object-cover ${
                  isExecutivePage
                    ? 'opacity-95 brightness-115 contrast-110 saturate-125'
                    : 'opacity-95 brightness-110 contrast-105 saturate-110'
                }`}
              >
                <source src="/assets/blord-video.mp4" type="video/mp4" />
              </video>
              <div
                className={`absolute inset-0 ${
                  isExecutivePage
                    ? 'bg-gradient-to-br from-[#081020]/30 via-[#160a05]/15 to-[#07090e]/40'
                    : 'bg-gradient-to-b from-[#07090e]/30 via-transparent to-[#07090e]/45'
                }`}
              />
            </div>
          ) : (
            <div className="relative h-full w-full">
              {slides.map((slide, index) => {
                const isActive = index === activeSlideIndex;
                return (
                  <div
                    key={slide.src}
                    className={`absolute inset-0 transition-all duration-[1200ms] ease-out ${
                      isActive ? 'opacity-95 scale-105' : 'opacity-0 scale-100'
                    }`}
                  >
                    <img
                      src={slide.src}
                      alt=""
                      referrerPolicy="no-referrer"
                      className="absolute inset-0 h-full w-full object-cover brightness-110 contrast-105 saturate-110"
                    />
                  </div>
                );
              })}
              <div className="absolute inset-0 bg-gradient-to-b from-[#07090e]/28 via-transparent to-[#07090e]/45" />
            </div>
          )}
        </div>

        {/* Captivating Executive Kinetic Canvas + Vivid Aurora Layers */}
        {isExecutivePage && (
          <>
            <canvas
              ref={canvasRef}
              className="pointer-events-none absolute inset-0 h-full w-full"
            />
            <div
              className={`absolute -bottom-32 -right-24 h-[520px] w-[520px] rounded-full blur-[130px] opacity-35 ${
                prefersReduced ? '' : 'animate-float-b'
              }`}
              style={{
                background:
                  'radial-gradient(circle at 45% 45%, rgba(56, 189, 248, 0.55), rgba(254, 109, 44, 0.3) 55%, transparent 75%)',
              }}
            />
            <div
              className={`absolute top-1/3 left-1/2 h-[380px] w-[380px] -translate-x-1/2 rounded-full blur-[110px] opacity-25 ${
                prefersReduced ? '' : 'animate-float-c'
              }`}
              style={{
                background:
                  'radial-gradient(circle at 50% 50%, rgba(255, 180, 68, 0.5), transparent 72%)',
              }}
            />
          </>
        )}

        {/* Interactive Cursor Spotlight Glow */}
        {!prefersReduced && (
          <div
            className="absolute inset-0 transition-opacity duration-300"
            style={{
              background: isExecutivePage
                ? `radial-gradient(720px circle at ${pointer.x * 100}% ${pointer.y * 100}%, rgba(254, 109, 44, 0.24), rgba(56, 189, 248, 0.14) 45%, transparent 74%)`
                : `radial-gradient(640px circle at ${pointer.x * 100}% ${pointer.y * 100}%, rgba(254, 109, 44, 0.16), rgba(56, 189, 248, 0.08) 45%, transparent 72%)`,
            }}
          />
        )}

        {/* Subtle luminous edge accents */}
        <div
          className={`absolute -top-28 -left-24 h-[460px] w-[460px] rounded-full blur-[120px] ${
            isExecutivePage ? 'opacity-40' : 'opacity-25'
          } ${prefersReduced ? '' : 'animate-float-a'}`}
          style={{
            background:
              'radial-gradient(circle at 35% 35%, rgba(254, 109, 44, 0.52), transparent 72%)',
          }}
        />
      </div>

      {/* Interactive Background Switcher on Slideshow Pages */}
      {!isVideoPage && (
        <div className="fixed bottom-5 left-16 z-40 hidden items-center gap-1.5 rounded-xl border border-white/25 bg-[#07090e]/70 px-2.5 py-1.5 text-[11px] text-slate-100 shadow-lg backdrop-blur-md sm:flex">
          <button
            type="button"
            aria-label="Previous background photo"
            onClick={() =>
              setSlideState({
                routeKey,
                index: (activeSlideIndex - 1 + slides.length) % slides.length,
              })
            }
            className="flex h-6 w-6 items-center justify-center rounded-md hover:bg-white/15"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <span className="max-w-[180px] truncate px-1 font-medium">
            {slides[activeSlideIndex]?.label}
          </span>
          <span className="font-mono text-[10px] text-[#fe6d2c] tabular-nums">
            {String(activeSlideIndex + 1).padStart(2, '0')}/{String(slides.length).padStart(2, '0')}
          </span>
          <button
            type="button"
            aria-label="Next background photo"
            onClick={() =>
              setSlideState({
                routeKey,
                index: (activeSlideIndex + 1) % slides.length,
              })
            }
            className="flex h-6 w-6 items-center justify-center rounded-md hover:bg-white/15"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            aria-label={paused ? 'Resume background slideshow' : 'Pause background slideshow'}
            onClick={() => setPaused((p) => !p)}
            className="flex h-6 w-6 items-center justify-center rounded-md hover:bg-white/15"
          >
            {paused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
          </button>
        </div>
      )}
    </>
  );
}
