import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Leaf,
  LayoutDashboard,
  FilePlus2,
  Database,
  BarChart3,
  BookOpen,
  Users,
  Globe,
  ShieldCheck,
  Menu,
  X,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Search,
  Download,
  Trash2,
  Edit3,
  Eye,
  Plus,
  Calendar,
  MapPin,
  Scale,
  Recycle,
  Sprout,
  FileText,
  Package,
  Megaphone,
  Award,
  Home,
  Lock,
  Unlock,
  Filter,
  ArrowUpDown,
  Info,
  Sparkles,
  Printer
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';

// ============================================================================
// KONFIGURASI LINGKUNGAN & PERSISTENSI (SUPABASE REST API + LOCALSTORAGE CACHE)
// ============================================================================

const STORAGE_KEYS = {
  RECORDS: 'ecodesa_prod_waste_records_v1',
  ANNOUNCEMENTS: 'ecodesa_prod_announcements_v1',
  EDUCATION: 'ecodesa_prod_education_v1',
  SB_URL: 'ecodesa_supabase_url_v1',
  SB_KEY: 'ecodesa_supabase_anon_key_v1'
};

const getEnvVar = (key) => {
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
      return import.meta.env[key];
    }
    if (typeof window !== 'undefined' && window.__ENV__ && window.__ENV__[key]) {
      return window.__ENV__[key];
    }
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key];
    }
  } catch {
    // Abaikan jika tidak tersedia di runtime browser
  }
  return '';
};

const ENV_SUPABASE_URL = getEnvVar('VITE_SUPABASE_URL');
const ENV_SUPABASE_ANON_KEY = getEnvVar('VITE_SUPABASE_ANON_KEY');

async function supabaseRequest(url, anonKey, path, options = {}) {
  const cleanUrl = url.replace(/\/+$/, '');
  const res = await fetch(`${cleanUrl}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      ...(options.headers || {})
    }
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Supabase (${res.status}): ${errText || res.statusText}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : [];
}

const CATEGORIES = {
  Organik: {
    label: 'Organik',
    color: '#176B45',
    bgLight: 'bg-emerald-50',
    textDark: 'text-emerald-800',
    border: 'border-emerald-200',
    manageable: true,
    description: 'Sisa makanan, daun kering, kulit buah, dan sampah dapur mudah terurai.'
  },
  Plastik: {
    label: 'Plastik',
    color: '#2B9348',
    bgLight: 'bg-green-50',
    textDark: 'text-green-800',
    border: 'border-green-200',
    manageable: true,
    description: 'Botol kemasan, gelas plastik, kantong kresek bersih, dan wadah HDPE/PP.'
  },
  Kertas: {
    label: 'Kertas',
    color: '#63B77A',
    bgLight: 'bg-teal-50',
    textDark: 'text-teal-800',
    border: 'border-teal-200',
    manageable: true,
    description: 'Kardus bekas, koran, buku tulis, dan kemasan karton kering.'
  },
  Lainnya: {
    label: 'Lainnya',
    color: '#EAB308',
    bgLight: 'bg-amber-50',
    textDark: 'text-amber-800',
    border: 'border-amber-200',
    manageable: false,
    description: 'Residu, popok sekali pakai, kaca pecah, atau bahan sulit didaur ulang.'
  }
};

const DUSUN_OPTIONS = [
  'Dusun Krajan (RW 01)',
  'Dusun Sumberjo (RW 02)',
  'Dusun Mekarsari (RW 03)',
  'Dusun Harapan Jaya (RW 04)',
  'Pasar & Balai Desa'
];

const DEFAULT_EDUCATION_GUIDES = [
  {
    id: 'edu-1',
    title: 'Cara Memilah Sampah Organik & Anorganik di Rumah',
    category: 'Pemilahan Dasar',
    readTime: '4 Menit Baca',
    summary:
      'Langkah praktis menyiapkan dua wadah terpisah di dapur agar sampah basah tidak mencemari sampah bernilai daur ulang.',
    tips: [
      'Sediakan tempat sampah tertutup khusus sisa dapur (organik) dan wadah kering untuk plastik/kertas.',
      'Bilas kemasan plastik atau kaleng bekas minuman sebelum dimasukkan ke wadah anorganik.',
      'Keringkan kardus dan kertas agar tidak berjamur sebelum disetor ke Bank Sampah Desa.'
    ]
  },
  {
    id: 'edu-2',
    title: 'Pengomposan Sampah Organik Skala Rumah Tangga',
    category: 'Pengolahan Organik',
    readTime: '6 Menit Baca',
    summary:
      'Mengubah sisa sayuran dan daun pekarangan menjadi pupuk kompos subur menggunakan ember tumpuk atau biopori.',
    tips: [
      'Cacah sisa sayuran dan daun kering menjadi potongan kecil agar proses pelapukan lebih cepat.',
      'Seimbangkan bahan hijau (sisa dapur) dan bahan cokelat (daun kering/serbuk gergaji) dengan rasio 1:2.',
      'Aduk kompos setiap 5–7 hari sekali untuk menjaga sirkulasi udara dan mencegah bau.'
    ]
  },
  {
    id: 'edu-3',
    title: 'Mengenal Kode Daur Ulang Plastik & Pengelolaannya',
    category: 'Daur Ulang Plastik',
    readTime: '5 Menit Baca',
    summary:
      'Memahami jenis plastik PET (kode 1) dan HDPE (kode 2) yang paling mudah diserap oleh pengepul dan bank sampah.',
    tips: [
      'Lepaskan label merek dan tutup botol plastik, lalu pipihkan botol untuk menghemat ruang simpan.',
      'Pisahkan plastik bening dan plastik berwarna karena memiliki nilai tukar berbeda di Bank Sampah.',
      'Hindari membakar sampah plastik karena menghasilkan asap beracun (dioksin) yang berbahaya bagi warga.'
    ]
  },
  {
    id: 'edu-4',
    title: 'Pengelolaan & Daur Ulang Sampah Kertas dan Kardus',
    category: 'Daur Ulang Kertas',
    readTime: '3 Menit Baca',
    summary:
      'Menjaga serat kertas tetap kering dan bebas minyak agar dapat diolah kembali menjadi bubur kertas.',
    tips: [
      'Lipat rapi kardus bekas paket agar mudah ditimbang dan diangkut petugas desa.',
      'Kertas yang sudah terkena minyak makanan berat sebaiknya dipisahkan ke kategori residu.',
      'Manfaatkan sisi kosong kertas bekas catatan untuk keperluan coretan rumah tangga.'
    ]
  },
  {
    id: 'edu-5',
    title: 'Mengurangi Plastik Sekali Pakai dalam Kegiatan Desa',
    category: 'Gaya Hidup Minim Sampah',
    readTime: '4 Menit Baca',
    summary:
      'Kebiasaan sederhana membawa tas belanja kain dan wadah makan ulang saat rapat warga atau hajatan.',
    tips: [
      'Gunakan tas belanja kain (totebag) saat berbelanja ke pasar desa.',
      'Bawa botol minum isi ulang (tumbler) saat mengikuti kegiatan kerja bakti atau rapat RT.',
      'Gunakan daun pisang atau wadah guna ulang untuk konsumsi acara gotong royong desa.'
    ]
  },
  {
    id: 'edu-6',
    title: 'Kebiasaan Konsumsi Bertanggung Jawab di Keluarga',
    category: 'Konsumsi Bijak',
    readTime: '5 Menit Baca',
    summary:
      'Mencegah timbulan sampah sejak sebelum membeli dengan merencanakan kebutuhan belanja harian.',
    tips: [
      'Belanja bahan pangan sesuai porsi keluarga untuk mencegah sisa makanan terbuang.',
      'Pilih produk kemasan isi ulang (refill) berukuran besar dibanding kemasan saset kecil.',
      'Donasikan pakaian atau barang layak pakai melalui program berbagi warga desa.'
    ]
  }
];

// ============================================================================
// GAYA CSS KHUSUS LANDING PAGE SWISS POSTER (ADAPTASI TEMA ECO-DESA)
// ============================================================================

const ECO_LANDING_CSS = `
@media print {
  body * { visibility: hidden !important; }
  #ecodesa-print-report, #ecodesa-print-report * { visibility: visible !important; }
  #ecodesa-print-report { position: fixed !important; left: 0 !important; top: 0 !important; width: 100% !important; background: #ffffff !important; padding: 24px !important; z-index: 99999 !important; box-shadow: none !important; border: none !important; }
  .no-print { display: none !important; }
}
.eco-poster{--eco-accent:#176B45;--eco-frame:#88CFA0;--eco-paper:#F8FAF7;--eco-ink:#0B1F16;--eco-soft:#254033;--eco-muted:#5A7466;--eco-card:#EDF5EE;--eco-line:rgba(23,107,69,0.16);--eco-line-strong:rgba(23,107,69,0.32);position:relative;width:100%;background:var(--eco-paper);color:var(--eco-ink);border:clamp(6px,1.1vw,12px) solid var(--eco-frame);border-radius:24px;overflow:clip;box-shadow:0 24px 60px -24px rgba(11,31,22,0.18)}
.eco-poster ::selection{background:var(--eco-accent);color:#ffffff}
.eco-in{width:100%;max-width:1200px;margin:0 auto;padding:0 clamp(16px,4vw,44px)}
.eco-echo{display:inline-block;white-space:nowrap}
.eco-title{display:flex;flex-direction:column;font-weight:800;letter-spacing:-0.025em;line-height:0.9}
.eco-title>span:last-child{padding-bottom:0.25em}
.eco-mono{font-family:ui-monospace,"SF Mono",Menlo,Consolas,monospace;font-size:11px;letter-spacing:0.06em;text-transform:uppercase}
.eco-label{font-weight:800;font-size:11px;letter-spacing:0.06em;text-transform:uppercase;color:var(--eco-accent)}

/* Hero Wordmark & Bubbles */
.eco-hero{position:relative;padding:clamp(20px,3vw,36px) 0 clamp(32px,5vw,56px);overflow:hidden}
.eco-orbits{position:absolute;inset:0;pointer-events:none;color:var(--eco-line-strong)}
.eco-orbits svg{position:absolute}
.eco-orbit-spin{transform-box:view-box;transform-origin:50% 50%;animation:eco-spin 65s linear infinite}
.eco-orbit-spin-r{animation-duration:95s;animation-direction:reverse}
.eco-wm{position:relative;height:clamp(180px,34vw,440px);margin:0 -8px;cursor:crosshair;touch-action:pan-y}
.eco-bub{position:absolute;inset:0}
.eco-bub canvas{position:absolute;left:0;top:0;width:100%;height:100%}
.eco-hero-mark{position:absolute;right:clamp(16px,4vw,48px);top:clamp(4px,1.4vw,18px);display:flex;flex-direction:column;align-items:flex-end;gap:10px;pointer-events:none;z-index:2}
.eco-hero-mark .eco-compass{pointer-events:auto;color:var(--eco-ink);width:clamp(60px,11vw,145px);height:auto}
.eco-hero-title{font-size:clamp(20px,3.8vw,48px);color:var(--eco-ink);text-align:right}
.eco-hero-title>span{background:var(--eco-paper);padding:0 0.1em;box-decoration-break:clone;-webkit-box-decoration-break:clone}
.eco-hero-row{position:relative;display:grid;gap:24px;align-items:end;margin-top:clamp(-44px,-3vw,-6px);z-index:3}
@media(min-width:768px){.eco-hero-row{grid-template-columns:1fr}.eco-hero-copy{justify-self:end}}
.eco-hero-copy{display:flex;flex-direction:column;gap:16px;max-width:580px}
.eco-credit{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;padding-top:12px;border-top:1.5px solid var(--eco-ink);font-weight:800;font-size:10.5px;letter-spacing:0.05em;text-transform:uppercase}

/* Compass & Asterisk */
.eco-compass{overflow:visible}
.eco-compass-arrow{transform-box:view-box;transform-origin:50px 50px;transition:transform 0.55s cubic-bezier(0.2,0.8,0.2,1)}
.eco-ast{display:inline-grid;place-items:center;color:var(--eco-accent);transition:transform 0.7s cubic-bezier(0.2,0.8,0.2,1);cursor:pointer}
.eco-ast:hover{transform:rotate(60deg) scale(1.15)}

/* Bubble Band Knock-out */
.eco-band{position:relative;height:clamp(180px,26vw,320px);color:#ffffff;overflow:hidden}
.eco-band-title{position:absolute;left:clamp(16px,3vw,40px);top:50%;transform:translateY(-55%);font-size:clamp(22px,4.2vw,52px);z-index:1;pointer-events:none;text-shadow:0 2px 18px rgba(0,0,0,0.16)}
.eco-band .eco-ast{position:absolute;left:clamp(16px,3vw,40px);bottom:clamp(14px,2.4vw,28px);color:#ffffff;z-index:1}

/* Crossing Ribbons Stage */
.eco-stage{position:relative;height:clamp(380px,58vw,640px);overflow:hidden;margin-top:24px;--mx:0;--my:0;border-top:1px solid var(--eco-line);border-bottom:1px solid var(--eco-line)}
.eco-stage-type{position:absolute;left:clamp(8px,2vw,24px);top:10%;font-size:clamp(42px,11vw,150px);color:var(--eco-accent);line-height:0.84;letter-spacing:-0.03em;pointer-events:none;opacity:0.92}
.eco-stage-type sup{position:relative;top:-0.95em;margin-left:0.06em;font-size:0.38em;color:var(--eco-ink);vertical-align:baseline}
.eco-rib{position:absolute;left:var(--x);top:var(--y);width:var(--w);height:clamp(44px,7vw,92px);transform:translate(-50%,-50%) translate(calc(var(--mx) * var(--k) * 1px),calc(var(--my) * var(--k) * 1px)) rotate(var(--r));transition:transform 0.7s cubic-bezier(0.2,0.8,0.2,1),box-shadow 0.4s;overflow:hidden;box-shadow:0 18px 40px -26px rgba(11,31,22,0.55)}
.eco-rib-ink{background:var(--eco-ink);color:var(--eco-paper);display:flex;align-items:center}
.eco-marq{display:flex;width:max-content;animation:eco-marq var(--d,26s) linear infinite}
.eco-rib:hover .eco-marq{animation-play-state:paused}
.eco-marq-r{animation-direction:reverse}
.eco-marq-item{display:inline-flex;align-items:center;gap:clamp(10px,1.5vw,20px);padding-right:clamp(16px,2.4vw,32px);font-weight:800;font-size:clamp(16px,2.6vw,34px);letter-spacing:-0.01em;white-space:nowrap}
.eco-stage-foot{position:absolute;left:clamp(16px,3vw,40px);right:clamp(16px,3vw,40px);bottom:clamp(16px,3vw,32px);display:flex;flex-wrap:wrap;justify-content:space-between;align-items:flex-end;gap:16px;z-index:5;pointer-events:none}
.eco-stage-foot>*{pointer-events:auto}
.eco-stage-body{max-width:44ch;font-weight:700;font-size:clamp(11px,1.15vw,13px);line-height:1.55;color:var(--eco-accent);background:rgba(248,250,247,0.92);padding:10px 14px;border-radius:12px;border:1px solid var(--eco-line-strong)}

/* Interactive Dossier Cards */
.eco-card{position:relative;display:flex;flex-direction:column;border:1.5px solid var(--eco-line-strong);border-radius:22px;background:#ffffff;overflow:hidden;transition:border-color 0.3s,transform 0.4s cubic-bezier(0.2,0.8,0.2,1),box-shadow 0.4s}
.eco-card:hover{border-color:var(--eco-accent);transform:translateY(-3px);box-shadow:0 24px 50px -32px rgba(23,107,69,0.45)}
.eco-card-top{position:relative;height:clamp(110px,13vw,150px);overflow:hidden;--px:50%;--py:50%;background:var(--eco-card)}
.eco-card-fill{position:absolute;inset:0;clip-path:circle(0% at var(--px) var(--py));transition:clip-path 0.8s cubic-bezier(0.2,0.8,0.2,1)}
.eco-card:hover .eco-card-fill,.eco-card[data-open="true"] .eco-card-fill{clip-path:circle(150% at var(--px) var(--py))}
.eco-card-code{position:absolute;left:18px;bottom:8px;font-weight:800;font-size:clamp(46px,6.5vw,82px);line-height:0.9;letter-spacing:-0.04em;color:var(--eco-accent);transition:color 0.5s}
.eco-card:hover .eco-card-code,.eco-card[data-open="true"] .eco-card-code{color:#ffffff}
.eco-more{display:grid;grid-template-rows:0fr;transition:grid-template-rows 0.45s cubic-bezier(0.2,0.8,0.2,1)}
.eco-card[data-open="true"] .eco-more{grid-template-rows:1fr}
.eco-more>div{overflow:hidden}

/* Footer Band */
.eco-foot-band{position:relative;height:clamp(120px,15vw,180px);color:#ffffff;overflow:hidden;margin-top:48px}
.eco-foot-band .eco-title{position:absolute;left:clamp(16px,3vw,40px);top:50%;transform:translateY(-55%);font-size:clamp(18px,3.4vw,44px);z-index:1;pointer-events:none}

@keyframes eco-spin{to{transform:rotate(360deg)}}
@keyframes eco-marq{to{transform:translateX(-50%)}}
`;

// ============================================================================
// KOMPONEN VISUAL INTERAKTIF DARI TEMPLATE (BUBBLES, COMPASS LOGO, MARQUEE)
// ============================================================================

const ECO_BUBBLE_PALETTE = [
  '#176B45', // Forest Green (ground)
  '#0F4C30',
  '#1F8A59',
  '#2FA86E',
  '#45C285',
  '#63B77A', // Fresh Green
  '#88CFA0',
  '#AEE2BF',
  '#EAB308', // Soft Yellow Accent
  '#FDE047',
  '#14532D',
  '#34D399'
];

const ECO_COMPASS_PATHS = {
  ring: 'M14 50a36 36 0 1 0 72 0a36 36 0 1 0-72 0',
  left: 'M34.4 34.4A22 22 0 0 0 34.4 65.6',
  right: 'M65.6 34.4A22 22 0 0 1 65.6 65.6',
  u: 'M43.5 41V53a6.5 6.5 0 0 0 13 0V41',
  bar: 'M50 41V50',
  slash: 'M8 50H86',
  arrow: 'M86 50H98',
  head: 'M85 38L98 50L85 62'
};

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function unwrapAngle(prev, next) {
  let d = (next - prev) % 360;
  if (d > 180) d -= 360;
  if (d < -180) d += 360;
  return prev + d;
}

function buildBubbles(seed, w, h, nColors, density = 1, scale = 1) {
  const rnd = mulberry32(seed);
  const unit = Math.max(6, Math.min(w, h) * 0.12 * scale);
  const n = Math.min(1200, Math.max(12, Math.round(((w * h) / (unit * unit * 1.25)) * density)));
  const out = [];
  for (let i = 0; i < n; i++) {
    const r = unit * (0.22 + 1.3 * Math.pow(rnd(), 2.3));
    out.push({
      x: rnd() * (w + r) - r / 2,
      y: rnd() * (h + r) - r / 2,
      r,
      c: 1 + Math.floor(rnd() * Math.max(1, nColors - 1)),
      ph: rnd() * Math.PI * 2,
      amp: 1 + rnd() * 3.2,
      sp: 0.25 + rnd() * 0.55
    });
  }
  return out.sort((a, b) => b.r - a.r);
}

function bubbleCss(seed, colors, n = 30, maxR = 48) {
  const rnd = mulberry32(seed);
  const layers = [];
  for (let i = 0; i < n; i++) {
    const r = Math.round(6 + (maxR - 6) * Math.pow(rnd(), 1.8));
    const x = Math.round(rnd() * 100);
    const y = Math.round(rnd() * 100);
    const c = colors[1 + Math.floor(rnd() * Math.max(1, colors.length - 1))] || colors[0];
    layers.push(`radial-gradient(circle at ${x}% ${y}%, ${c} 0 ${r}px, transparent ${r + 0.6}px)`);
  }
  return layers.reverse().join(', ') + ', ' + (colors[0] || '#176B45');
}

function CompassLogoMark({ size = 40, follow = false, gap = 'var(--eco-paper)', className = '' }) {
  const svgRef = useRef(null);
  const arrowRef = useRef(null);

  useEffect(() => {
    if (!follow) return;
    let raf = 0;
    let deg = -45;
    let px = 0;
    let py = 0;
    const apply = () => {
      raf = 0;
      const el = svgRef.current;
      const g = arrowRef.current;
      if (!el || !g) return;
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      if (Math.hypot(px - cx, py - cy) < r.width * 0.3) return;
      deg = unwrapAngle(deg, (Math.atan2(py - cy, px - cx) * 180) / Math.PI);
      g.style.transform = `rotate(${deg.toFixed(1)}deg)`;
    };
    const move = (e) => {
      px = e.clientX;
      py = e.clientY;
      if (!raf) raf = requestAnimationFrame(apply);
    };
    window.addEventListener('pointermove', move, { passive: true });
    return () => {
      window.removeEventListener('pointermove', move);
      cancelAnimationFrame(raf);
    };
  }, [follow]);

  return (
    <svg
      ref={svgRef}
      className={`eco-compass ${className}`}
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <g>
        <path d={ECO_COMPASS_PATHS.ring} strokeWidth="9" />
        <path d={ECO_COMPASS_PATHS.left} strokeWidth="6.5" />
        <path d={ECO_COMPASS_PATHS.right} strokeWidth="6.5" />
        <path d={ECO_COMPASS_PATHS.u} strokeWidth="6.5" />
        <path d={ECO_COMPASS_PATHS.bar} strokeWidth="5" />
      </g>
      <g ref={arrowRef} className="eco-compass-arrow" style={{ transform: 'rotate(-45deg)' }}>
        <path d={ECO_COMPASS_PATHS.slash} strokeWidth="5" stroke={gap} strokeLinecap="butt" style={{ transform: 'translate(0,8px)' }} />
        <path d={ECO_COMPASS_PATHS.arrow} strokeWidth="8" />
        <path d={ECO_COMPASS_PATHS.head} strokeWidth="7" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

function InteractiveAsterisk({ size = 22, className = '', style }) {
  const [turn, setTurn] = useState(0);
  return (
    <button
      type="button"
      className={`eco-ast ${className}`}
      style={{ ...style, transform: turn ? `rotate(${turn * 120}deg)` : undefined }}
      onClick={() => setTurn((t) => t + 1)}
      aria-label="Putar ikon"
    >
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.6" strokeLinecap="round">
        <path d="M12 2.5v19M3.8 7.25l16.4 9.5M3.8 16.75l16.4-9.5" />
      </svg>
    </button>
  );
}

function BubbleCanvasField({ seed = 102, colors = ECO_BUBBLE_PALETTE, density = 1.8, scale = 0.42, mask = null, interactive = true, onPop }) {
  const canvasRef = useRef(null);
  const liveRef = useRef({ colors, mask, onPop });
  liveRef.current = { colors, mask, onPop };
  const maskKey = mask ? JSON.stringify(mask) : '';

  useEffect(() => {
    const cv = canvasRef.current;
    const ctx = cv?.getContext('2d');
    if (!cv || !ctx) return;
    const host = cv.parentElement?.parentElement || cv.parentElement;
    const rand = mulberry32(seed ^ 0x5bd1e995);
    let w = 0;
    let h = 0;
    let dpr = 1;
    let list = [];
    let sparks = [];
    let raf = 0;
    let running = false;
    let visible = true;
    let knock = null;
    const ptr = { x: -1e4, y: -1e4, on: false, dx: 0, dy: 0 };

    const buildKnock = () => {
      const m = liveRef.current.mask;
      knock = null;
      if (!m || m.kind !== 'logo' || typeof Path2D !== 'function' || !w || !h) return;
      const off = document.createElement('canvas');
      off.width = Math.round(w * dpr);
      off.height = Math.round(h * dpr);
      const o = off.getContext('2d');
      if (!o) return;
      const s = (h * m.size) / 100;
      o.setTransform(dpr, 0, 0, dpr, 0, 0);
      o.translate(m.cx * w - s * 50, m.cy * h - s * 50);
      o.scale(s, s);
      o.lineCap = 'round';
      o.strokeStyle = '#000';
      o.lineWidth = 9;
      o.stroke(new Path2D(ECO_COMPASS_PATHS.ring));
      o.lineWidth = 6.5;
      o.stroke(new Path2D(ECO_COMPASS_PATHS.left));
      o.stroke(new Path2D(ECO_COMPASS_PATHS.right));
      o.stroke(new Path2D(ECO_COMPASS_PATHS.u));
      o.lineWidth = 5;
      o.stroke(new Path2D(ECO_COMPASS_PATHS.bar));
      o.translate(50, 50);
      o.rotate(-Math.PI / 4);
      o.translate(-50, -50);
      o.globalCompositeOperation = 'destination-out';
      o.lineCap = 'butt';
      o.lineWidth = 5;
      o.translate(0, 8);
      o.stroke(new Path2D(ECO_COMPASS_PATHS.slash));
      o.translate(0, -8);
      o.globalCompositeOperation = 'source-over';
      o.lineCap = 'round';
      o.lineWidth = 8;
      o.stroke(new Path2D(ECO_COMPASS_PATHS.arrow));
      o.lineJoin = 'round';
      o.lineWidth = 7;
      o.stroke(new Path2D(ECO_COMPASS_PATHS.head));
      knock = off;
    };

    let textSize = 0;
    let textFor = '';
    const draw = (t) => {
      const { colors: cols, mask: m } = liveRef.current;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = cols[0] || '#176B45';
      ctx.fillRect(0, 0, w, h);
      const ts = t / 1000;
      const R = Math.max(70, Math.min(h, w) * 0.34);

      for (const b of list) {
        let tx = 0;
        let ty = 0;
        if (ptr.on) {
          const dx = b.x + b.ox - ptr.x;
          const dy = b.y + b.oy - ptr.y;
          const d = Math.hypot(dx, dy) || 1;
          const reach = R + b.r;
          if (d < reach) {
            const f = 1 - d / reach;
            const push = f * f * R * 0.6;
            tx = (dx / d) * push + ptr.dx * f * 0.6;
            ty = (dy / d) * push + ptr.dy * f * 0.6;
          }
        }
        b.ox += (tx - b.ox) * 0.09;
        b.oy += (ty - b.oy) * 0.09;
        b.s += (1 - b.s) * 0.07;
        const wx = Math.sin(ts * b.sp + b.ph) * b.amp;
        const wy = Math.cos(ts * b.sp * 0.8 + b.ph) * b.amp;
        ctx.fillStyle = cols[b.c % cols.length];
        ctx.beginPath();
        ctx.arc(b.x + b.ox + wx, b.y + b.oy + wy, Math.max(0.1, b.r * b.s), 0, Math.PI * 2);
        ctx.fill();
      }
      ptr.dx *= 0.85;
      ptr.dy *= 0.85;

      if (sparks.length) {
        for (const s of sparks) {
          s.x += s.vx;
          s.y += s.vy;
          s.vx *= 0.94;
          s.vy = s.vy * 0.94 - 0.05;
          s.life -= 0.024;
          if (s.life <= 0) continue;
          ctx.fillStyle = cols[s.c % cols.length];
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r * s.life, 0, Math.PI * 2);
          ctx.fill();
        }
        sparks = sparks.filter((s) => s.life > 0);
      }

      if (m && m.kind === 'text') {
        const key = `${m.text}|${w}|${h}|${m.fit}`;
        if (key !== textFor) {
          ctx.font = '800 100px Inter, system-ui, sans-serif';
          const mw = ctx.measureText(m.text).width || 1;
          textSize = Math.min((100 * w * m.fit) / mw, h * 1.25);
          textFor = key;
        }
        ctx.globalCompositeOperation = 'destination-in';
        ctx.fillStyle = '#000';
        ctx.font = `800 ${textSize.toFixed(1)}px Inter, system-ui, sans-serif`;
        ctx.textBaseline = 'alphabetic';
        ctx.fillText(m.text, w * m.x, h * m.baseline);
      } else if (knock) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalCompositeOperation = 'destination-out';
        ctx.drawImage(knock, 0, 0);
      }
    };

    const loop = (t) => {
      draw(t);
      raf = requestAnimationFrame(loop);
    };
    const start = () => {
      if (running || !visible || !w) return;
      running = true;
      raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    const resize = () => {
      if (!cv.clientWidth || !cv.clientHeight) return;
      w = cv.clientWidth;
      h = cv.clientHeight;
      dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
      list = buildBubbles(seed, w, h, liveRef.current.colors.length, density, scale).map((b) => ({ ...b, ox: 0, oy: 0, s: 1 }));
      textFor = '';
      buildKnock();
      draw(performance.now());
      start();
    };

    const local = (e) => {
      const r = cv.getBoundingClientRect();
      return [e.clientX - r.left, e.clientY - r.top];
    };
    const onMove = (e) => {
      const [x, y] = local(e);
      if (ptr.on) {
        ptr.dx = Math.max(-40, Math.min(40, x - ptr.x));
        ptr.dy = Math.max(-40, Math.min(40, y - ptr.y));
      }
      ptr.x = x;
      ptr.y = y;
      ptr.on = x >= -40 && y >= -40 && x <= w + 40 && y <= h + 40;
    };
    const onLeave = () => {
      ptr.on = false;
    };
    let downAt = [0, 0];
    const onDown = (e) => {
      downAt = [e.clientX, e.clientY];
    };
    const onUp = (e) => {
      if (Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 6) return;
      if (e.target?.closest?.('a,button,input,label,select,textarea')) return;
      const [x, y] = local(e);
      if (x < 0 || y < 0 || x > w || y > h) return;
      const px = ctx.getImageData(Math.round(x * dpr), Math.round(y * dpr), 1, 1).data;
      if (px[3] < 10) return;
      for (let i = list.length - 1; i >= 0; i--) {
        const b = list[i];
        if (Math.hypot(b.x + b.ox - x, b.y + b.oy - y) > b.r * b.s + 2) continue;
        const n = liveRef.current.colors.length;
        const old = b.c;
        b.c = 1 + ((b.c + Math.floor(rand() * (n - 2))) % Math.max(1, n - 1));
        b.s = 0;
        for (let k = 0; k < 8; k++) {
          const a = (k / 8) * Math.PI * 2 + rand() * 0.5;
          const sp = 2 + rand() * 3.8;
          sparks.push({ x: b.x + b.ox, y: b.y + b.oy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r: b.r * 0.2, c: old, life: 1 });
        }
        liveRef.current.onPop?.();
        break;
      }
    };

    resize();
    const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(resize) : null;
    ro?.observe(cv);
    const io = typeof IntersectionObserver === 'function'
      ? new IntersectionObserver((es) => {
          visible = es.some((e) => e.isIntersecting);
          if (visible) start();
          else stop();
        })
      : null;
    io?.observe(cv);

    if (interactive && host) {
      host.addEventListener('pointermove', onMove, { passive: true });
      host.addEventListener('pointerleave', onLeave);
      host.addEventListener('pointerdown', onDown);
      host.addEventListener('pointerup', onUp);
    }

    return () => {
      stop();
      ro?.disconnect();
      io?.disconnect();
      if (interactive && host) {
        host.removeEventListener('pointermove', onMove);
        host.removeEventListener('pointerleave', onLeave);
        host.removeEventListener('pointerdown', onDown);
        host.removeEventListener('pointerup', onUp);
      }
    };
  }, [seed, density, scale, interactive, maskKey]);

  return (
    <div className="eco-bub" aria-hidden="true">
      <canvas ref={canvasRef} />
    </div>
  );
}

function RibbonMarquee({ text, reverse = false, duration = 26, big = false }) {
  const items = Array.from({ length: 8 });
  const run = (key) => (
    <div key={key} style={{ display: 'flex' }} aria-hidden={key === 'b' ? true : undefined}>
      {items.map((_, i) => (
        <span className="eco-marq-item" key={i}>
          {text}
          <CompassLogoMark size={big ? 48 : 30} gap="#0B1F16" />
        </span>
      ))}
    </div>
  );
  return (
    <div className={`eco-marq ${reverse ? 'eco-marq-r' : ''}`} style={{ '--d': `${duration * 2}s` }}>
      {run('a')}
      {run('b')}
    </div>
  );
}

// ============================================================================
// HELPER KALKULASI & PRIVASI WARGA
// ============================================================================

function maskResidentName(name, isAdmin) {
  if (isAdmin || !name) return name || 'Warga Anonim';
  const trimmed = name.trim();
  if (trimmed.toUpperCase().startsWith('KK-')) return trimmed;
  const parts = trimmed.split(/\s+/);
  return parts
    .map((part) => (part.length <= 2 ? `${part[0]}*` : `${part.slice(0, 2)}${'*'.repeat(Math.min(4, part.length - 2))}`))
    .join(' ');
}

function formatDateID(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

// ============================================================================
// KOMPONEN UTAMA APLIKASI
// ============================================================================

export default function App() {
  const [activeTab, setActiveTab] = useState('landing');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [landingMenuOpen, setLandingMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [notification, setNotification] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const [supabaseConfig, setSupabaseConfig] = useState(() => ({
    url: ENV_SUPABASE_URL || localStorage.getItem(STORAGE_KEYS.SB_URL) || '',
    anonKey: ENV_SUPABASE_ANON_KEY || localStorage.getItem(STORAGE_KEYS.SB_KEY) || ''
  }));

  const isSupabaseConnected = Boolean(supabaseConfig.url && supabaseConfig.anonKey);

  // State utama dimulai kosong [] (siap untuk input pengguna sungguhan)
  const [records, setRecords] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.RECORDS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [announcements, setAnnouncements] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ANNOUNCEMENTS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [educationGuides, setEducationGuides] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.EDUCATION);
      return saved ? JSON.parse(saved) : DEFAULT_EDUCATION_GUIDES;
    } catch {
      return DEFAULT_EDUCATION_GUIDES;
    }
  });

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification((prev) => (prev && prev.message === message ? null : prev));
    }, 5000);
  };

  // Sinkronisasi data awal dari Supabase jika URL & Anon Key tersedia
  const fetchFromSupabase = async (cfg = supabaseConfig) => {
    if (!cfg.url || !cfg.anonKey) return;
    setIsSyncing(true);
    try {
      const [remoteRecords, remoteAnns] = await Promise.all([
        supabaseRequest(cfg.url, cfg.anonKey, 'waste_records?select=*&order=created_at.desc'),
        supabaseRequest(cfg.url, cfg.anonKey, 'announcements?select=*&order=created_at.desc').catch(() => null)
      ]);

      if (Array.isArray(remoteRecords)) {
        const normalized = remoteRecords.map((r) => ({
          id: String(r.id),
          residentName: r.resident_name || r.residentName || 'Warga',
          date: r.report_date || r.date || '',
          category: r.category || 'Lainnya',
          weight: Number(r.weight) || 0,
          location: r.location || DUSUN_OPTIONS[0],
          notes: r.notes || '',
          createdAt: r.created_at || new Date().toISOString()
        }));
        setRecords(normalized);
      }

      if (Array.isArray(remoteAnns)) {
        const normAnns = remoteAnns.map((a) => ({
          id: String(a.id),
          title: a.title || '',
          date: a.event_date || a.date || '',
          category: a.category || 'Gotong Royong',
          location: a.location || '',
          description: a.description || ''
        }));
        setAnnouncements(normAnns);
      }
    } catch (err) {
      showNotification(
        'error',
        `Gagal membaca tabel Supabase: ${err.message}. Pastikan tabel "waste_records" & policy RLS sudah dibuat.`
      );
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    if (isSupabaseConnected) {
      fetchFromSupabase(supabaseConfig);
    }
  }, [supabaseConfig.url, supabaseConfig.anonKey]);

  const handleSaveSupabaseConfig = (newUrl, newKey) => {
    const cleanUrl = newUrl.trim();
    const cleanKey = newKey.trim();
    localStorage.setItem(STORAGE_KEYS.SB_URL, cleanUrl);
    localStorage.setItem(STORAGE_KEYS.SB_KEY, cleanKey);
    const updated = { url: cleanUrl, anonKey: cleanKey };
    setSupabaseConfig(updated);
    if (cleanUrl && cleanKey) {
      showNotification('success', 'Konfigurasi Supabase disimpan. Mengambil data dari server...');
      fetchFromSupabase(updated);
    } else {
      showNotification('success', 'Koneksi Supabase dilepas. Beralih ke penyimpanan lokal.');
    }
  };

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(records));
    } catch {
      // Abaikan kuota storage penuh
    }
  }, [records]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(announcements));
    } catch {
      // Abaikan kuota storage penuh
    }
  }, [announcements]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.EDUCATION, JSON.stringify(educationGuides));
    } catch {
      // Abaikan kuota storage penuh
    }
  }, [educationGuides]);

  const metrics = useMemo(() => {
    const totals = {
      Organik: 0,
      Plastik: 0,
      Kertas: 0,
      Lainnya: 0
    };

    records.forEach((rec) => {
      const cat = totals[rec.category] !== undefined ? rec.category : 'Lainnya';
      totals[cat] += Number(rec.weight) || 0;
    });

    const totalWeight = Object.values(totals).reduce((sum, val) => sum + val, 0);
    const manageableWeight = totals.Organik + totals.Plastik + totals.Kertas;
    const manageableRate = totalWeight > 0 ? (manageableWeight / totalWeight) * 100 : 0;
    const avgDaily = totalWeight / 7;

    const breakdown = Object.keys(CATEGORIES).map((key) => {
      const weight = totals[key] || 0;
      const percentage = totalWeight > 0 ? (weight / totalWeight) * 100 : 0;
      return {
        name: key,
        weight: Number(weight.toFixed(2)),
        percentage,
        color: CATEGORIES[key].color
      };
    });

    const byDateMap = {};
    records.forEach((rec) => {
      const d = rec.date || 'Tanpa Tanggal';
      if (!byDateMap[d]) {
        byDateMap[d] = { date: d, label: formatDateID(d), total: 0, terkelola: 0 };
      }
      const w = Number(rec.weight) || 0;
      byDateMap[d].total += w;
      if (rec.category !== 'Lainnya') {
        byDateMap[d].terkelola += w;
      }
    });

    const trendData = Object.values(byDateMap)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((item) => ({
        ...item,
        total: Number(item.total.toFixed(2)),
        terkelola: Number(item.terkelola.toFixed(2))
      }));

    return {
      totals,
      totalWeight,
      manageableWeight,
      manageableRate,
      avgDaily,
      recordCount: records.length,
      breakdown,
      trendData
    };
  }, [records]);

  const handleAddRecord = async (newRecord) => {
    const generatedId =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `REC-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    const createdLocal = {
      ...newRecord,
      id: generatedId,
      createdAt: new Date().toISOString()
    };

    if (isSupabaseConnected) {
      setIsSyncing(true);
      try {
        const inserted = await supabaseRequest(supabaseConfig.url, supabaseConfig.anonKey, 'waste_records', {
          method: 'POST',
          body: JSON.stringify({
            id: generatedId,
            resident_name: newRecord.residentName,
            report_date: newRecord.date,
            category: newRecord.category,
            weight: Number(newRecord.weight),
            location: newRecord.location,
            notes: newRecord.notes || ''
          })
        });
        const row = Array.isArray(inserted) && inserted[0] ? inserted[0] : null;
        const syncedRecord = row
          ? {
              id: String(row.id),
              residentName: row.resident_name,
              date: row.report_date,
              category: row.category,
              weight: Number(row.weight),
              location: row.location,
              notes: row.notes || '',
              createdAt: row.created_at || createdLocal.createdAt
            }
          : createdLocal;

        setRecords((prev) => [syncedRecord, ...prev]);
        showNotification('success', `Tersimpan ke Supabase (${syncedRecord.weight} kg ${syncedRecord.category})!`);
      } catch (err) {
        showNotification('error', `Gagal menyimpan ke Supabase: ${err.message}`);
      } finally {
        setIsSyncing(false);
      }
      return;
    }

    setRecords((prev) => [createdLocal, ...prev]);
    showNotification(
      'success',
      `Tersimpan lokal (${createdLocal.weight} kg ${createdLocal.category}). Hubungkan Supabase di Panel Admin agar masuk ke database cloud.`
    );
  };

  const handleUpdateRecord = async (updatedRecord) => {
    if (isSupabaseConnected) {
      setIsSyncing(true);
      try {
        await supabaseRequest(
          supabaseConfig.url,
          supabaseConfig.anonKey,
          `waste_records?id=eq.${encodeURIComponent(updatedRecord.id)}`,
          {
            method: 'PATCH',
            body: JSON.stringify({
              resident_name: updatedRecord.residentName,
              report_date: updatedRecord.date,
              category: updatedRecord.category,
              weight: Number(updatedRecord.weight),
              location: updatedRecord.location,
              notes: updatedRecord.notes || ''
            })
          }
        );
        setRecords((prev) => prev.map((r) => (r.id === updatedRecord.id ? updatedRecord : r)));
        showNotification('success', 'Data di Supabase berhasil diperbarui.');
      } catch (err) {
        showNotification('error', `Gagal memperbarui di Supabase: ${err.message}`);
      } finally {
        setIsSyncing(false);
      }
      return;
    }

    setRecords((prev) => prev.map((r) => (r.id === updatedRecord.id ? updatedRecord : r)));
    showNotification('success', 'Data catatan sampah berhasil diperbarui.');
  };

  const handleDeleteRecord = async (id) => {
    if (isSupabaseConnected) {
      setIsSyncing(true);
      try {
        await supabaseRequest(
          supabaseConfig.url,
          supabaseConfig.anonKey,
          `waste_records?id=eq.${encodeURIComponent(id)}`,
          { method: 'DELETE' }
        );
        setRecords((prev) => prev.filter((r) => r.id !== id));
        showNotification('success', 'Catatan berhasil dihapus dari Supabase.');
      } catch (err) {
        showNotification('error', `Gagal menghapus di Supabase: ${err.message}`);
      } finally {
        setIsSyncing(false);
      }
      return;
    }

    setRecords((prev) => prev.filter((r) => r.id !== id));
    showNotification('success', 'Catatan sampah berhasil dihapus dari basis data.');
  };

  const handleAddAnnouncement = async (ann) => {
    const generatedAnnId =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `ANN-${Date.now()}`;

    const created = {
      ...ann,
      id: generatedAnnId,
      participantsCount: 0
    };

    if (isSupabaseConnected) {
      try {
        const inserted = await supabaseRequest(supabaseConfig.url, supabaseConfig.anonKey, 'announcements', {
          method: 'POST',
          body: JSON.stringify({
            id: generatedAnnId,
            title: ann.title,
            event_date: ann.date,
            category: ann.category,
            location: ann.location,
            description: ann.description
          })
        });
        const row = Array.isArray(inserted) && inserted[0] ? inserted[0] : null;
        if (row) {
          created.id = String(row.id);
        }
      } catch {
        // Tetap simpan lokal jika tabel announcements belum dibuat di Supabase
      }
    }

    setAnnouncements((prev) => [created, ...prev]);
    showNotification('success', 'Pengumuman & jadwal kegiatan baru berhasil diterbitkan.');
  };

  const handleDeleteAnnouncement = async (id) => {
    if (isSupabaseConnected) {
      await supabaseRequest(
        supabaseConfig.url,
        supabaseConfig.anonKey,
        `announcements?id=eq.${encodeURIComponent(id)}`,
        { method: 'DELETE' }
      ).catch(() => {});
    }
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    showNotification('success', 'Pengumuman berhasil dihapus.');
  };

  const handleAddEducation = (guide) => {
    const created = {
      ...guide,
      id: `EDU-${Date.now()}`
    };
    setEducationGuides((prev) => [created, ...prev]);
    showNotification('success', 'Materi edukasi lingkungan berhasil ditambahkan.');
  };

  const handleDeleteEducation = (id) => {
    setEducationGuides((prev) => prev.filter((g) => g.id !== id));
    showNotification('success', 'Materi edukasi berhasil dihapus.');
  };

  const navItems = [
    { id: 'landing', label: 'Beranda', icon: Home },
    { id: 'dashboard', label: 'Dashboard Utama', icon: LayoutDashboard },
    { id: 'report', label: 'Lapor Sampah', icon: FilePlus2 },
    { id: 'database', label: 'Database Sampah', icon: Database },
    { id: 'analytics', label: 'Analitik & Statistik', icon: BarChart3 },
    { id: 'education', label: 'Pusat Edukasi', icon: BookOpen },
    { id: 'community', label: 'Kolaborasi Warga', icon: Users },
    { id: 'sdgs', label: 'SDGs Desa', icon: Globe },
    { id: 'admin', label: 'Panel Admin', icon: ShieldCheck }
  ];

  const navigateTo = (tabId) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
    setLandingMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isLanding = activeTab === 'landing';

  return (
    <div className={`min-h-screen bg-[#F8FAF7] text-slate-800 flex flex-col ${isLanding ? '' : 'lg:flex-row'} font-sans antialiased`}>
      {/* NOTIFIKASI TOAST */}
      {notification && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3.5 rounded-2xl shadow-xl border text-sm font-semibold max-w-md transition-all ${
            notification.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-900'
              : 'bg-[#176B45] border-emerald-700 text-white'
          }`}
        >
          {notification.type === 'error' ? (
            <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
          ) : (
            <CheckCircle2 className="w-5 h-5 shrink-0 text-amber-300" />
          )}
          <span className="flex-1">{notification.message}</span>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="opacity-75 hover:opacity-100 p-1"
            aria-label="Tutup notifikasi"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* HEADER MOBILE */}
      {!isLanding && (
        <header className="lg:hidden sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-emerald-900/10 px-4 h-16 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigateTo('landing')}
            className="flex items-center gap-2.5 text-left"
          >
            <div className="w-9 h-9 rounded-xl bg-[#176B45] text-white flex items-center justify-center shadow-sm">
              <Leaf className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-[#0B1F16] block leading-none">
                ECO-DESA
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#176B45]">
                Digital Waste Platform
              </span>
            </div>
          </button>

          <div className="flex items-center gap-2">
            {isAdmin && (
              <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 text-[10px] font-extrabold uppercase">
                Admin
              </span>
            )}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-emerald-50"
              aria-label="Buka menu navigasi"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </header>
      )}

      {/* DRAWER MENU MOBILE */}
      {!isLanding && mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 top-16 z-30 bg-slate-900/40 backdrop-blur-xs">
          <nav
            aria-label="Navigasi Mobile"
            className="bg-white border-b border-slate-200 p-4 space-y-1 max-h-[calc(100vh-4rem)] overflow-y-auto shadow-xl"
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigateTo(item.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-colors ${
                    isActive
                      ? 'bg-[#176B45] text-white'
                      : 'text-slate-700 hover:bg-emerald-50 hover:text-[#176B45]'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>
      )}

      {/* TOMBOL MENU FLOATING & DRAWER SAAT BERADA DI BERANDA FULLWIDTH */}
      {isLanding && (
        <>
          <div className="fixed top-5 right-5 sm:top-7 sm:right-8 z-40">
            <button
              type="button"
              onClick={() => setLandingMenuOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/95 backdrop-blur border border-emerald-900/15 text-[#0B1F16] text-xs font-extrabold uppercase tracking-wider shadow-lg hover:bg-emerald-50 transition-all"
              aria-label="Buka menu navigasi"
            >
              <Menu className="w-4 h-4 text-[#176B45]" />
              <span>Menu</span>
            </button>
          </div>

          {landingMenuOpen && (
            <div className="fixed inset-0 z-50 bg-slate-900/45 backdrop-blur-xs flex justify-end">
              <div className="w-72 bg-white h-full shadow-2xl border-l border-emerald-900/10 flex flex-col justify-between p-5 overflow-y-auto">
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-[#176B45] text-white flex items-center justify-center">
                        <Leaf className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="font-extrabold text-base text-[#0B1F16] block leading-none">ECO-DESA</span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#176B45]">
                          Digital Waste Platform
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setLandingMenuOpen(false)}
                      className="p-2 rounded-xl hover:bg-slate-100 text-slate-600"
                      aria-label="Tutup menu"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <nav aria-label="Menu Beranda" className="space-y-1">
                    {navItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => navigateTo(item.id)}
                          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                            isActive
                              ? 'bg-[#176B45] text-white'
                              : 'text-slate-700 hover:bg-emerald-50 hover:text-[#176B45]'
                          }`}
                        >
                          <Icon className="w-4 h-4 shrink-0" />
                          {item.label}
                        </button>
                      );
                    })}
                  </nav>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      if (isAdmin) {
                        setIsAdmin(false);
                        setLandingMenuOpen(false);
                        showNotification('success', 'Kembali ke Mode Warga Publik.');
                      } else {
                        navigateTo('admin');
                      }
                    }}
                    className={`w-full py-2.5 px-3 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-colors ${
                      isAdmin
                        ? 'bg-slate-900 text-white hover:bg-slate-800'
                        : 'bg-[#176B45] text-white hover:bg-[#125637]'
                    }`}
                  >
                    {isAdmin ? 'Keluar Mode Admin' : 'Login Mode Admin'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* SIDEBAR DESKTOP */}
      {!isLanding && (
        <aside className="hidden lg:flex lg:w-72 lg:flex-col lg:sticky lg:top-0 lg:h-screen bg-white border-r border-emerald-900/10 shrink-0">
          <div className="p-6 border-b border-emerald-900/10">
            <button
              type="button"
              onClick={() => navigateTo('landing')}
              className="flex items-center gap-3 text-left group"
            >
              <div className="w-11 h-11 rounded-2xl bg-[#176B45] text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                <Leaf className="w-6 h-6" />
              </div>
              <div>
                <span className="font-extrabold text-xl tracking-tight text-[#0B1F16] block leading-none">
                  ECO-DESA
                </span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#176B45] mt-1 block">
                  Digital Waste Management
                </span>
              </div>
            </button>

            <div className="mt-4 px-3 py-2 rounded-xl bg-[#F8FAF7] border border-emerald-900/10 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-600">Status Penyimpanan</span>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold text-[#176B45]">
                <span className={`w-2 h-2 rounded-full ${isSupabaseConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                {isSyncing ? 'Menyinkronkan...' : isSupabaseConnected ? 'Supabase Cloud' : 'Lokal Browser'}
              </span>
            </div>
          </div>

          <nav aria-label="Menu Utama" className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigateTo(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                    isActive
                      ? 'bg-[#176B45] text-white shadow-sm'
                      : 'text-slate-600 hover:bg-emerald-50/80 hover:text-[#176B45]'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Icon className="w-4 h-4 shrink-0" />
                    {item.label}
                  </span>
                </button>
              );
            })}
          </nav>

          <div className="p-4 border-t border-emerald-900/10 space-y-3">
            <div className="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-200/80">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-900">
                  Mode Akses
                </span>
                {isAdmin ? (
                  <Unlock className="w-3.5 h-3.5 text-amber-700" />
                ) : (
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                )}
              </div>
              <p className="text-xs text-amber-950/80 mb-2.5 leading-snug">
                {isAdmin
                  ? 'Mode Pengurus Desa aktif. Anda dapat mengedit & menghapus data.'
                  : 'Mode Warga Publik. Aktifkan Admin untuk kelola basis data.'}
              </p>
              <button
                type="button"
                onClick={() => {
                  if (isAdmin) {
                    setIsAdmin(false);
                    showNotification('success', 'Kembali ke Mode Warga Publik.');
                  } else {
                    navigateTo('admin');
                  }
                }}
                className={`w-full py-2 px-3 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-colors ${
                  isAdmin
                    ? 'bg-slate-900 text-white hover:bg-slate-800'
                    : 'bg-[#176B45] text-white hover:bg-[#125637]'
                }`}
              >
                {isAdmin ? 'Keluar Mode Admin' : 'Login Mode Admin'}
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* KONTEN UTAMA */}
      <main className="flex-1 min-w-0 flex flex-col">
        {activeTab === 'landing' ? (
          <LandingPageView
            onNavigate={navigateTo}
            metrics={metrics}
            announcements={announcements}
            onNotify={showNotification}
            isSupabaseConnected={isSupabaseConnected}
          />
        ) : (
          <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
            {/* Banner Status Data */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-white border border-emerald-900/10 shadow-2xs">
              <div className="flex items-center gap-2.5 text-xs sm:text-sm">
                <span
                  className={`px-2.5 py-1 rounded-full font-extrabold text-[11px] uppercase tracking-wider ${
                    isSupabaseConnected ? 'bg-emerald-100 text-[#176B45]' : 'bg-amber-100 text-amber-900'
                  }`}
                >
                  {isSupabaseConnected ? 'Terhubung ke Supabase' : 'Mode Penyimpanan Lokal'}
                </span>
                <span className="text-slate-600 font-medium">
                  {isSupabaseConnected
                    ? 'Setiap input warga langsung dikirim ke tabel waste_records di Supabase.'
                    : 'Data tersimpan di browser ini. Hubungkan URL & Anon Key Supabase di Panel Admin.'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => navigateTo('report')}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#176B45] text-white text-xs font-bold hover:bg-[#125637] transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Input Laporan Baru
              </button>
            </div>

            {activeTab === 'dashboard' && (
              <DashboardView metrics={metrics} records={records} isAdmin={isAdmin} onNavigate={navigateTo} />
            )}
            {activeTab === 'report' && (
              <ReportFormView onAddRecord={handleAddRecord} onNavigate={navigateTo} />
            )}
            {activeTab === 'database' && (
              <DatabaseView
                records={records}
                isAdmin={isAdmin}
                onUpdateRecord={handleUpdateRecord}
                onDeleteRecord={handleDeleteRecord}
                onNavigate={navigateTo}
              />
            )}
            {activeTab === 'analytics' && (
              <AnalyticsView metrics={metrics} onNavigate={navigateTo} />
            )}
            {activeTab === 'education' && (
              <EducationView guides={educationGuides} onNavigate={navigateTo} />
            )}
            {activeTab === 'community' && (
              <CommunityView
                announcements={announcements}
                isAdmin={isAdmin}
                onAddAnnouncement={handleAddAnnouncement}
                onDeleteAnnouncement={handleDeleteAnnouncement}
                onNotify={showNotification}
                metrics={metrics}
              />
            )}
            {activeTab === 'sdgs' && <SdgsView onNavigate={navigateTo} />}
            {activeTab === 'admin' && (
              <AdminView
                isAdmin={isAdmin}
                setIsAdmin={setIsAdmin}
                records={records}
                metrics={metrics}
                announcements={announcements}
                educationGuides={educationGuides}
                onDeleteRecord={handleDeleteRecord}
                onAddAnnouncement={handleAddAnnouncement}
                onDeleteAnnouncement={handleDeleteAnnouncement}
                onAddEducation={handleAddEducation}
                onDeleteEducation={handleDeleteEducation}
                onNotify={showNotification}
                supabaseConfig={supabaseConfig}
                isSupabaseConnected={isSupabaseConnected}
                onSaveSupabaseConfig={handleSaveSupabaseConfig}
                onSyncNow={() => fetchFromSupabase(supabaseConfig)}
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
}

// ============================================================================
// 1. LANDING PAGE (ADAPTASI SWISS POSTER TEMPLATE KE ECO-DESA)
// ============================================================================

function LandingPageView({ onNavigate, metrics, announcements, onNotify, isSupabaseConnected }) {
  const [openDossier, setOpenDossier] = useState(-1);
  const [rsvpState, setRsvpState] = useState({});
  const stageRef = useRef(null);

  const wordMask = useMemo(
    () => ({ kind: 'text', text: 'ECODESA', fit: 0.94, x: 0.02, baseline: 0.82 }),
    []
  );
  const bandMask = useMemo(
    () => ({ kind: 'logo', cx: 0.56, cy: 0.5, size: 0.88 }),
    []
  );
  const footMask = useMemo(
    () => ({ kind: 'logo', cx: 0.55, cy: 0.85, size: 1.7 }),
    []
  );

  const onStageMove = (e) => {
    const el = stageRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', (((e.clientX - r.left) / r.width - 0.5) * 2).toFixed(3));
    el.style.setProperty('--my', (((e.clientY - r.top) / r.height - 0.5) * 2).toFixed(3));
  };
  const onStageLeave = () => {
    stageRef.current?.style.setProperty('--mx', '0');
    stageRef.current?.style.setProperty('--my', '0');
  };

  const aimCardFill = (e) => {
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--px', `${(((e.clientX - r.left) / r.width) * 100).toFixed(1)}%`);
    el.style.setProperty('--py', `${(((e.clientY - r.top) / r.height) * 100).toFixed(1)}%`);
  };

  const programDossiers = [
    {
      code: '#01',
      status: 'aktif',
      title: 'Pilah Sampah Rumah Tangga',
      summary: 'Warga memisahkan sampah organik dapur, plastik, kertas, dan residu sejak dari rumah.',
      detail:
        'Pemilahan di sumber adalah kunci mencegah kontaminasi. Sampah bersih memudahkan kader bank sampah desa menimbang dan menyalurkan material daur ulang.',
      progress: metrics.totalWeight > 0 ? Math.min(1, metrics.manageableRate / 100) : 0,
      goal: `${metrics.manageableRate.toFixed(1)}% potensi terkelola dari ${metrics.totalWeight.toFixed(1)} kg tercatat`,
      actionLabel: 'Pelajari Panduan Pilah',
      targetTab: 'education'
    },
    {
      code: '#02',
      status: 'aktif',
      title: 'Pelaporan Digital Mandiri',
      summary: 'Catat timbangan sampah secara daring melalui ponsel tanpa antre buku tulis.',
      detail:
        'Setiap keluarga dapat melaporkan berat sampah per kategori dan lokasi dusun dalam hitungan detik. Data langsung terakumulasi di dasbor desa.',
      progress: Math.min(1, metrics.recordCount / 20),
      goal: `${metrics.recordCount} laporan warga masuk ke sistem`,
      actionLabel: 'Isi Form Lapor Sampah',
      targetTab: 'report'
    },
    {
      code: '#03',
      status: 'berjalan',
      title: 'Audit Komposisi & Analitik Desa',
      summary: 'Pemetaan volume organik vs anorganik untuk perencanaan komposter & bank sampah.',
      detail:
        'Sistem menghitung persentase tiap kategori, rata-rata timbulan harian (kg/hari), dan potensi sampah yang berhasil dialihkan dari TPA.',
      progress: metrics.totalWeight > 0 ? 0.85 : 0.15,
      goal: `Rata-rata ${metrics.avgDaily.toFixed(1)} kg/hari tercatat`,
      actionLabel: 'Buka Analitik Statistik',
      targetTab: 'analytics'
    },
    {
      code: '#04',
      status: 'terbuka',
      title: 'Gotong Royong & SDGs Desa',
      summary: 'Kolaborasi warga, karang taruna, dan perangkat desa demi desa bersih berkelanjutan.',
      detail:
        'Mengintegrasikan nilai kearifan lokal gotong royong dengan indikator SDGs Desa 11, 12, 13, dan 17.',
      progress: 0.75,
      goal: 'Mendukung 4 Pilar Utama SDGs Desa',
      actionLabel: 'Lihat Agenda Gotong Royong',
      targetTab: 'community'
    }
  ];

  const sdgGoals = [
    {
      num: '11',
      title: 'Desa Aman & Nyaman',
      desc: 'Lingkungan permukiman bersih, bebas tumpukan sampah liar, dan sehat bagi seluruh warga.'
    },
    {
      num: '12',
      title: 'Konsumsi & Produksi Sadar Lingkungan',
      desc: 'Mendorong pemilahan sumber, pengomposan organik, dan daur ulang plastik maupun kertas.'
    },
    {
      num: '13',
      title: 'Desa Tanggap Perubahan Iklim',
      desc: 'Mengurangi emisi gas metana dari sampah organik serta mencegah pembakaran sampah terbuka.'
    },
    {
      num: '17',
      title: 'Kemitraan untuk Pembangunan Desa',
      desc: 'Sinergi warga, kader PKK, Bank Sampah, karang taruna, dan pemerintah desa berbasis data.'
    }
  ];

  return (
    <div className="w-full">
      <style>{ECO_LANDING_CSS}</style>
      <div className="eco-poster !rounded-none !border-x-0">
        {/* HERO SECTION DENGAN WORDMARK GELEMBUNG INTERAKTIF */}
        <section className="eco-hero">
          <div className="eco-orbits" aria-hidden="true">
            <svg style={{ left: '40%', top: '-26%', width: '82vw', height: '82vw', maxWidth: '900px' }} viewBox="0 0 100 100" fill="none">
              <g className="eco-orbit-spin">
                <circle cx="50" cy="50" r="49" stroke="currentColor" strokeWidth="0.18" />
                <circle cx="99" cy="50" r="1" fill="#176B45" />
              </g>
            </svg>
            <svg style={{ left: '-18%', top: '34%', width: '54vw', height: '54vw', maxWidth: '600px' }} viewBox="0 0 100 100" fill="none">
              <g className="eco-orbit-spin eco-orbit-spin-r">
                <circle cx="50" cy="50" r="49" stroke="currentColor" strokeWidth="0.22" />
                <circle cx="50" cy="1" r="1.4" fill="#63B77A" />
              </g>
            </svg>
          </div>

          <div className="eco-wm">
            <BubbleCanvasField
              seed={102}
              colors={ECO_BUBBLE_PALETTE}
              density={2}
              scale={0.38}
              mask={wordMask}
            />
            <div className="eco-hero-mark">
              <CompassLogoMark size={135} follow className="hidden sm:block" />
              <div className="eco-title eco-hero-title hidden md:flex">
                <span>DESA BERSIH</span>
                <span>
                  <span className="eco-echo">AKSI DIGITAL</span>
                </span>
              </div>
            </div>
          </div>

          <div className="eco-in">
            <div className="eco-hero-row">
              <div className="eco-hero-copy">
                <InteractiveAsterisk size={22} style={{ alignSelf: 'flex-start' }} />
                <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[#0B1F16] leading-tight">
                  Transformasi Pengelolaan Sampah Desa Berbasis Teknologi Digital
                </h1>
                <p className="text-sm sm:text-base text-[#254033] leading-relaxed">
                  Platform pengelolaan sampah berbasis partisipasi warga desa. Laporkan timbulan sampah rumah tangga,
                  pantau komposisi organik &amp; anorganik secara transparan, dan hidupkan kembali semangat{' '}
                  <strong className="text-[#176B45]">gotong royong</strong> berbasis data.
                </p>

                <div className="flex flex-wrap gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => onNavigate('report')}
                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-[#176B45] text-white text-xs sm:text-sm font-extrabold uppercase tracking-wider hover:bg-[#125637] shadow-md transition-all"
                  >
                    Mulai Kelola Sampah
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigate('dashboard')}
                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full border-2 border-[#176B45] text-[#176B45] text-xs sm:text-sm font-extrabold uppercase tracking-wider hover:bg-[#176B45] hover:text-white transition-all"
                  >
                    Pelajari Program &amp; Dashboard
                  </button>
                </div>

                <div className="eco-credit">
                  <span>ECO-DESA · SISTEM PENGELOLAAN SAMPAH DIGITAL DESA</span>
                  <span className="text-[#176B45]">
                    {isSupabaseConnected ? '● SUPABASE CLOUD AKTIF' : '● MODE PENYIMPANAN LOKAL'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* BUBBLE BAND DENGAN LOGO KNOCK-OUT */}
        <section>
          <div className="eco-band">
            <BubbleCanvasField
              seed={103}
              colors={ECO_BUBBLE_PALETTE}
              density={2}
              scale={0.42}
              mask={bandMask}
            />
            <div className="eco-title eco-band-title">
              <span>GOTONG ROYONG</span>
              <span>
                <span className="eco-echo">DIGITAL DESA</span>
              </span>
            </div>
            <InteractiveAsterisk size={20} />
          </div>

          {/* STATISTIK REAL-TIME DARI DATABASE */}
          <div className="eco-in py-10 sm:py-14">
            <div className="flex flex-col items-center gap-3 pb-6 text-center">
              <span className="eco-label">MONITORING TIMBULAN SAMPAH DESA (REAL-TIME)</span>
              <InteractiveAsterisk size={24} />
            </div>

            <div className="flex flex-wrap justify-between gap-2 py-2.5 border-t border-[#176B45]/30 text-[10px] font-extrabold uppercase tracking-wider text-[#176B45]">
              <span>Inisiatif Lingkungan Digital</span>
              <span>Data Terhitung Otomatis dari Input Warga</span>
              <span>Transparansi Bank Sampah Desa</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-8 items-start">
              <div className="lg:col-span-6 space-y-4">
                <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#0B1F16] leading-[1.02]">
                  Dari pencatatan warga menjadi aksi nyata desa.
                </h2>
                <p className="text-sm sm:text-base text-[#254033] leading-relaxed">
                  Setiap kilogram sampah yang dilaporkan warga membantu perangkat desa dan pengelola Bank Sampah
                  menentukan kapasitas rumah kompos, jadwal pengangkutan, serta edukasi pemilahan di tingkat RT/RW.
                </p>
              </div>

              <dl className="lg:col-span-6 grid grid-cols-2 border-t-2 border-[#0B1F16]">
                <div className="py-5 pr-3 border-b border-[#176B45]/25">
                  <dt className="text-3xl sm:text-5xl font-extrabold text-[#176B45] tracking-tight tabular-nums">
                    {metrics.totalWeight.toFixed(1)} <span className="text-lg">kg</span>
                  </dt>
                  <dd className="eco-mono text-[#5A7466] mt-1.5">Total Sampah Tercatat</dd>
                </div>
                <div className="py-5 pl-3 border-b border-[#176B45]/25">
                  <dt className="text-3xl sm:text-5xl font-extrabold text-[#176B45] tracking-tight tabular-nums">
                    {metrics.manageableRate.toFixed(1)}%
                  </dt>
                  <dd className="eco-mono text-[#5A7466] mt-1.5">Potensi Terkelola</dd>
                </div>
                <div className="py-5 pr-3 border-b border-[#176B45]/25">
                  <dt className="text-3xl sm:text-5xl font-extrabold text-[#176B45] tracking-tight tabular-nums">
                    {metrics.recordCount}
                  </dt>
                  <dd className="eco-mono text-[#5A7466] mt-1.5">Laporan Warga Masuk</dd>
                </div>
                <div className="py-5 pl-3 border-b border-[#176B45]/25">
                  <dt className="text-3xl sm:text-5xl font-extrabold text-[#176B45] tracking-tight tabular-nums">
                    {metrics.avgDaily.toFixed(1)} <span className="text-lg">kg</span>
                  </dt>
                  <dd className="eco-mono text-[#5A7466] mt-1.5">Rata-Rata Harian</dd>
                </div>
              </dl>
            </div>
          </div>
        </section>

        {/* PITA SILANG INTERAKTIF (CROSSING RIBBONS) & 4 ALUR PROGRAM */}
        <section className="pb-12">
          <div className="eco-stage" ref={stageRef} onPointerMove={onStageMove} onPointerLeave={onStageLeave}>
            <div className="eco-stage-type eco-title" aria-hidden="true">
              <span>ECO</span>
              <span>
                <span className="eco-echo">DESA</span>
                <sup>04</sup>
              </span>
            </div>

            <div className="eco-rib" style={{ '--x': '26%', '--y': '62%', '--w': '190%', '--r': '-30deg', '--k': '10' }}>
              <BubbleCanvasField seed={104} colors={ECO_BUBBLE_PALETTE} density={1.6} scale={0.7} interactive={false} />
            </div>
            <div className="eco-rib eco-rib-ink" style={{ '--x': '35%', '--y': '55%', '--w': '190%', '--r': '68deg', '--k': '-14' }}>
              <RibbonMarquee text="PILAH · LAPOR · OLAH" duration={28} big />
            </div>
            <div className="eco-rib" style={{ '--x': '56%', '--y': '62%', '--w': '190%', '--r': '15deg', '--k': '8' }}>
              <BubbleCanvasField seed={105} colors={ECO_BUBBLE_PALETTE} density={1.6} scale={0.7} interactive={false} />
            </div>
            <div className="eco-rib eco-rib-ink" style={{ '--x': '84%', '--y': '64%', '--w': '190%', '--r': '36deg', '--k': '-18' }}>
              <RibbonMarquee text="eco-desa · gotong royong bersih" reverse duration={22} />
            </div>

            <div className="eco-stage-foot">
              <b className="text-2xl sm:text-4xl font-extrabold tracking-tight bg-[#F8FAF7] px-2 rounded">ECO-DESA.</b>
              <div className="flex flex-col items-end gap-3">
                <p className="eco-stage-body">
                  Pengelolaan sampah desa membutuhkan keterlibatan aktif seluruh rumah tangga—mulai dari pemilahan di
                  dapur, pencatatan digital, hingga pengolahan kompos dan bank sampah.
                </p>
                <div className="flex items-center gap-2">
                  <CompassLogoMark size={48} follow />
                  <InteractiveAsterisk size={18} />
                </div>
              </div>
            </div>
          </div>

          {/* 4 KARTU PROSES PENGELOLAAN (DOSSIER CARDS) */}
          <div className="eco-in pt-12">
            <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
              <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#0B1F16] max-w-md leading-tight">
                Alur Kerja Pengelolaan Sampah Digital.
              </h2>
              <span className="eco-label">4 TAHAP TERINTEGRASI · KLIK DETAIL</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {programDossiers.map((item, idx) => {
                const isOpen = openDossier === idx;
                return (
                  <article key={item.code} className="eco-card" data-open={isOpen}>
                    <div className="eco-card-top" onPointerMove={aimCardFill} onPointerEnter={aimCardFill}>
                      <div
                        className="eco-card-fill"
                        style={{ background: bubbleCss(102 * 31 + idx * 7, ECO_BUBBLE_PALETTE, 28, 50) }}
                      />
                      <span className="eco-card-code">{item.code}</span>
                      <div className="absolute right-4 top-4 text-[#176B45]">
                        <CompassLogoMark size={40} gap="transparent" />
                      </div>
                    </div>

                    <div className="p-5 sm:p-6 flex flex-col gap-3">
                      <span className="inline-flex items-center gap-1.5 self-start px-3 py-1 rounded-full border border-[#176B45] text-[#176B45] text-[10.5px] font-extrabold uppercase tracking-wider">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#176B45] animate-pulse" />
                        {item.status}
                      </span>
                      <h3 className="text-xl sm:text-2xl font-extrabold text-[#0B1F16] tracking-tight">{item.title}</h3>
                      <p className="text-sm text-[#254033]">{item.summary}</p>

                      <div className="space-y-1.5 pt-1">
                        <div className="h-2 rounded-full bg-[#176B45]/15 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[#176B45] transition-all duration-700"
                            style={{ width: `${Math.round(item.progress * 100)}%` }}
                          />
                        </div>
                        <span className="eco-mono text-[#5A7466] block">{item.goal}</span>
                      </div>

                      <div className="eco-more" data-open={isOpen}>
                        <div>
                          <div className="pt-2 space-y-3 border-t border-[#176B45]/15 mt-2">
                            <p className="text-sm text-[#254033] leading-relaxed">{item.detail}</p>
                            <button
                              type="button"
                              onClick={() => onNavigate(item.targetTab)}
                              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#0B1F16] text-white text-xs font-extrabold uppercase tracking-wider hover:bg-[#176B45] transition-colors"
                            >
                              {item.actionLabel}
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() => setOpenDossier(isOpen ? -1 : idx)}
                          className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[#176B45] hover:underline"
                        >
                          <Plus className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-45' : ''}`} />
                          {isOpen ? 'Tutup Rincian' : 'Buka Rincian'}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* AGENDA GOTONG ROYONG & SDGs DESA */}
        <section className="eco-in py-10 border-t border-[#176B45]/20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Kolom Kiri: SDGs Desa */}
            <div className="lg:col-span-5 space-y-4">
              <span className="eco-label">KONTRIBUSI PEMBANGUNAN BERKELANJUTAN</span>
              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[#0B1F16]">
                Mendukung 4 Pilar SDGs Desa.
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3 pt-2">
                {sdgGoals.map((g) => (
                  <div
                    key={g.num}
                    className="p-4 rounded-2xl bg-white border border-[#176B45]/20 flex items-start gap-3.5 hover:border-[#176B45] transition-colors"
                  >
                    <div className="w-11 h-11 rounded-xl bg-[#176B45] text-white font-extrabold text-lg flex items-center justify-center shrink-0">
                      {g.num}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-[#0B1F16]">
                        SDGs Desa {g.num}: {g.title}
                      </h3>
                      <p className="text-xs text-[#254033] mt-1 leading-relaxed">{g.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => onNavigate('sdgs')}
                className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[#176B45] hover:underline pt-1"
              >
                Pelajari Pemetaan SDGs Lengkap <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Kolom Kanan: Agenda Gotong Royong (Dinamis dari Pengumuman) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="eco-label">AGENDA KOMUNITAS</span>
                  <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[#0B1F16]">
                    Jadwal Gotong Royong &amp; Edukasi.
                  </h2>
                </div>
                <InteractiveAsterisk size={24} />
              </div>

              {announcements.length === 0 ? (
                <div className="p-8 rounded-2xl bg-[#EDF5EE] border border-dashed border-[#176B45]/35 text-center space-y-3">
                  <Megaphone className="w-8 h-8 text-[#176B45] mx-auto" />
                  <h3 className="font-extrabold text-base text-[#0B1F16]">Belum Ada Jadwal Kegiatan Diterbitkan</h3>
                  <p className="text-xs sm:text-sm text-[#254033] max-w-md mx-auto">
                    Pengurus desa dapat menambahkan jadwal kerja bakti, penimbangan bank sampah, atau penyuluhan melalui Mode Admin.
                  </p>
                  <button
                    type="button"
                    onClick={() => onNavigate('community')}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#176B45] text-white text-xs font-extrabold uppercase tracking-wider"
                  >
                    Buka Halaman Komunitas
                  </button>
                </div>
              ) : (
                <ul className="border-t-2 border-[#0B1F16] divide-y divide-[#176B45]/20">
                  {announcements.slice(0, 4).map((item) => {
                    const isGoing = !!rsvpState[item.id];
                    return (
                      <li key={item.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-3.5">
                          <div className="px-3 py-2 rounded-2xl bg-[#176B45] text-white text-center font-extrabold shrink-0 min-w-[64px]">
                            <span className="block text-xs uppercase">{item.category}</span>
                            <span className="block text-[10px] opacity-85 mt-0.5">{item.date}</span>
                          </div>
                          <div>
                            <h3 className="font-extrabold text-base text-[#0B1F16]">{item.title}</h3>
                            <p className="text-xs text-[#254033] mt-0.5">{item.description}</p>
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#5A7466] mt-1">
                              <MapPin className="w-3 h-3 text-[#176B45]" /> {item.location}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setRsvpState((prev) => ({ ...prev, [item.id]: !prev[item.id] }));
                            onNotify(
                              'success',
                              !isGoing ? `Anda terdaftar hadir pada "${item.title}"` : 'Konfirmasi kehadiran dibatalkan.'
                            );
                          }}
                          className={`px-4 py-2 rounded-full text-xs font-extrabold uppercase tracking-wider border-2 transition-all shrink-0 ${
                            isGoing
                              ? 'bg-[#176B45] border-[#176B45] text-white'
                              : 'border-[#176B45] text-[#176B45] hover:bg-[#176B45] hover:text-white'
                          }`}
                        >
                          {isGoing ? '✓ Hadir' : 'Ikut Hadir'}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </section>

        {/* FOOTER BAND */}
        <footer>
          <div className="eco-foot-band">
            <BubbleCanvasField
              seed={106}
              colors={ECO_BUBBLE_PALETTE}
              density={2}
              scale={0.48}
              mask={footMask}
            />
            <div className="eco-title">
              <span>ECO-DESA.</span>
              <span>
                <span className="eco-echo">DIGITAL WASTE</span>
              </span>
            </div>
          </div>

          <div className="eco-in py-8 flex flex-col items-center text-center gap-4">
            <p className="font-extrabold text-base sm:text-xl text-[#176B45] tracking-wide">
              DESA BERSIH · GOTONG ROYONG DIGITAL · BERKELANJUTAN
            </p>
            <p className="text-xs text-[#254033] max-w-2xl leading-relaxed">
              Platform digital kolaboratif untuk membantu warga desa melaporkan sampah rumah tangga, memantau komposisi
              limbah secara transparan, dan memperkuat gerakan kebersihan lingkungan berbasis gotong royong.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-xs font-extrabold uppercase tracking-wider text-[#254033] pt-1">
              <button type="button" onClick={() => onNavigate('dashboard')} className="hover:text-[#176B45]">
                Dashboard
              </button>
              <button type="button" onClick={() => onNavigate('report')} className="hover:text-[#176B45]">
                Lapor Sampah
              </button>
              <button type="button" onClick={() => onNavigate('database')} className="hover:text-[#176B45]">
                Database
              </button>
              <button type="button" onClick={() => onNavigate('education')} className="hover:text-[#176B45]">
                Edukasi
              </button>
              <button type="button" onClick={() => onNavigate('admin')} className="hover:text-[#176B45]">
                Panel Admin
              </button>
            </div>
            <span className="eco-mono text-[#5A7466]">
              © {new Date().getFullYear()} ECO-DESA Digital Waste Management
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}

// ============================================================================
// 2. MAIN DASHBOARD (DATA DINAMIS + EMPTY STATE AMAN)
// ============================================================================

function DashboardView({ metrics, records, isAdmin, onNavigate }) {
  const [categoryFilter, setCategoryFilter] = useState('Semua');
  const [dateFilter, setDateFilter] = useState('');

  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      const matchCat = categoryFilter === 'Semua' || rec.category === categoryFilter;
      const matchDate = !dateFilter || rec.date === dateFilter;
      return matchCat && matchDate;
    });
  }, [records, categoryFilter, dateFilter]);

  const kpiCards = [
    {
      title: 'Total Sampah Tercatat',
      value: `${metrics.totalWeight.toFixed(1)} kg`,
      sub: `${metrics.recordCount} laporan warga`,
      icon: Scale,
      accent: 'bg-[#176B45] text-white'
    },
    {
      title: 'Sampah Organik',
      value: `${metrics.totals.Organik.toFixed(1)} kg`,
      sub: `${(metrics.totalWeight > 0 ? (metrics.totals.Organik / metrics.totalWeight) * 100 : 0).toFixed(1)}% dari total`,
      icon: Sprout,
      accent: 'bg-emerald-50 text-[#176B45]'
    },
    {
      title: 'Sampah Plastik',
      value: `${metrics.totals.Plastik.toFixed(1)} kg`,
      sub: `${(metrics.totalWeight > 0 ? (metrics.totals.Plastik / metrics.totalWeight) * 100 : 0).toFixed(1)}% dari total`,
      icon: Recycle,
      accent: 'bg-green-50 text-green-700'
    },
    {
      title: 'Sampah Kertas',
      value: `${metrics.totals.Kertas.toFixed(1)} kg`,
      sub: `${(metrics.totalWeight > 0 ? (metrics.totals.Kertas / metrics.totalWeight) * 100 : 0).toFixed(1)}% dari total`,
      icon: FileText,
      accent: 'bg-teal-50 text-teal-700'
    },
    {
      title: 'Sampah Lainnya (Residu)',
      value: `${metrics.totals.Lainnya.toFixed(1)} kg`,
      sub: `${(metrics.totalWeight > 0 ? (metrics.totals.Lainnya / metrics.totalWeight) * 100 : 0).toFixed(1)}% dari total`,
      icon: Package,
      accent: 'bg-amber-50 text-amber-800'
    },
    {
      title: 'Potensi Terkelola',
      value: `${metrics.manageableRate.toFixed(2)}%`,
      sub: `${metrics.manageableWeight.toFixed(1)} kg berpotensi diolah`,
      icon: Sparkles,
      accent: 'bg-amber-100 text-amber-950'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-wider text-[#176B45]">
            Ringkasan Operasional Desa
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F16] tracking-tight mt-1">
            Dashboard Pengelolaan Sampah
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Filter Kategori Dashboard"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none focus:border-[#176B45]"
          >
            <option value="Semua">Semua Kategori</option>
            {Object.keys(CATEGORIES).map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <input
            type="date"
            aria-label="Filter Tanggal Dashboard"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none focus:border-[#176B45]"
          />
          {(categoryFilter !== 'Semua' || dateFilter) && (
            <button
              type="button"
              onClick={() => {
                setCategoryFilter('Semua');
                setDateFilter('');
              }}
              className="px-3 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200"
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* GRID 6 KARTU KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {kpiCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-white border border-emerald-900/10 shadow-2xs flex items-start justify-between gap-4"
            >
              <div>
                <span className="text-xs font-bold text-slate-500">{card.title}</span>
                <p className="text-2xl sm:text-3xl font-extrabold text-[#0B1F16] tracking-tight mt-1 tabular-nums">
                  {card.value}
                </p>
                <span className="text-xs font-semibold text-[#176B45] mt-1.5 block">{card.sub}</span>
              </div>
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${card.accent}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* GRAFIK KOMPOSISI & TREN */}
      {records.length === 0 ? (
        <div className="p-10 rounded-3xl bg-white border-2 border-dashed border-emerald-900/15 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-[#176B45] flex items-center justify-center mx-auto">
            <BarChart3 className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h2 className="text-lg font-extrabold text-[#0B1F16]">Belum Ada Data Laporan Sampah</h2>
            <p className="text-sm text-slate-600">
              Grafik komposisi dan tren pengumpulan sampah akan otomatis muncul setelah warga mengirimkan laporan pertama.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('report')}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-[#176B45] text-white text-xs font-extrabold uppercase tracking-wider hover:bg-[#125637] shadow-sm"
          >
            <FilePlus2 className="w-4 h-4" />
            Buat Laporan Sampah Pertama
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Pie Chart Komposisi */}
          <div className="lg:col-span-5 p-6 rounded-2xl bg-white border border-emerald-900/10 shadow-2xs flex flex-col">
            <h2 className="text-base font-extrabold text-[#0B1F16]">Komposisi Jenis Sampah</h2>
            <p className="text-xs text-slate-500 mb-4">Proporsi berat berdasarkan kategori terpilah</p>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={metrics.breakdown.filter((b) => b.weight > 0)}
                    dataKey="weight"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={88}
                    paddingAngle={4}
                  >
                    {metrics.breakdown
                      .filter((b) => b.weight > 0)
                      .map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                  </Pie>
                  <Tooltip formatter={(val) => [`${val} kg`, 'Berat']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bar Chart Pengumpulan */}
          <div className="lg:col-span-7 p-6 rounded-2xl bg-white border border-emerald-900/10 shadow-2xs flex flex-col">
            <h2 className="text-base font-extrabold text-[#0B1F16]">Volume Pengumpulan per Kategori (kg)</h2>
            <p className="text-xs text-slate-500 mb-4">Perbandingan timbulan organik, plastik, kertas, dan lainnya</p>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.breakdown} margin={{ top: 10, right: 16, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fontWeight: 700 }} />
                  <YAxis unit=" kg" tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(val) => [`${val} kg`, 'Total Berat']} />
                  <Bar dataKey="weight" radius={[10, 10, 0, 0]}>
                    {metrics.breakdown.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* TABEL LAPORAN TERBARU */}
      <div className="rounded-2xl bg-white border border-emerald-900/10 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-extrabold text-[#0B1F16]">Laporan Sampah Terbaru</h2>
            <p className="text-xs text-slate-500">
              Menampilkan {Math.min(6, filteredRecords.length)} dari {filteredRecords.length} catatan
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('database')}
            className="text-xs font-extrabold text-[#176B45] hover:underline inline-flex items-center gap-1"
          >
            Lihat Semua Database <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {filteredRecords.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            Tidak ada catatan sampah yang sesuai dengan filter saat ini.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F8FAF7] border-b border-slate-200/80 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Tanggal</th>
                  <th className="py-3 px-4">Warga / Kode KK</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4">Berat</th>
                  <th className="py-3 px-4">Lokasi / Dusun</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredRecords.slice(0, 6).map((rec) => {
                  const cat = CATEGORIES[rec.category] || CATEGORIES.Lainnya;
                  return (
                    <tr key={rec.id} className="hover:bg-emerald-50/40 transition-colors">
                      <td className="py-3.5 px-4 font-medium text-slate-700 whitespace-nowrap">
                        {formatDateID(rec.date)}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-[#0B1F16]">
                        {maskResidentName(rec.residentName, isAdmin)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-extrabold border ${cat.bgLight} ${cat.textDark} ${cat.border}`}
                        >
                          {rec.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-[#176B45] tabular-nums">
                        {Number(rec.weight).toFixed(1)} kg
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">{rec.location}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// 3. WASTE REPORTING SYSTEM (FORM PELAPORAN SAMPAH WARGA)
// ============================================================================

function ReportFormView({ onAddRecord, onNavigate }) {
  const todayStr = new Date().toISOString().split('T')[0];
  const [residentName, setResidentName] = useState('');
  const [date, setDate] = useState(todayStr);
  const [category, setCategory] = useState('Organik');
  const [weight, setWeight] = useState('');
  const [location, setLocation] = useState(DUSUN_OPTIONS[0]);
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState({});

  const validate = () => {
    const nextErrors = {};
    if (!residentName.trim()) {
      nextErrors.residentName = 'Nama warga atau kode kartu keluarga wajib diisi.';
    }
    if (!date) {
      nextErrors.date = 'Tanggal pelaporan wajib dipilih.';
    }
    const numWeight = parseFloat(weight);
    if (!weight || Number.isNaN(numWeight) || numWeight <= 0) {
      nextErrors.weight = 'Masukkan berat sampah yang valid (lebih dari 0 kg).';
    } else if (numWeight > 2000) {
      nextErrors.weight = 'Berat maksimal per satu kali input adalah 2.000 kg.';
    }
    if (!location) {
      nextErrors.location = 'Lokasi pengumpulan wajib dipilih.';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onAddRecord({
      residentName: residentName.trim(),
      date,
      category,
      weight: parseFloat(parseFloat(weight).toFixed(2)),
      location,
      notes: notes.trim()
    });
    setResidentName('');
    setWeight('');
    setNotes('');
    setErrors({});
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <span className="text-xs font-extrabold uppercase tracking-wider text-[#176B45]">
          Partisipasi Warga Digital
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F16] tracking-tight mt-1">
          Formulir Pelaporan Sampah Rumah Tangga
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Catat berat sampah terpilah Anda. Data langsung memperbarui statistik dashboard dan membantu jadwal penjemputan Bank Sampah Desa.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        noValidate
        className="p-6 sm:p-8 rounded-3xl bg-white border border-emerald-900/10 shadow-sm space-y-5"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label htmlFor="rep-name" className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-2">
              Nama Warga / Kode Rumah Tangga *
            </label>
            <input
              id="rep-name"
              type="text"
              value={residentName}
              onChange={(e) => setResidentName(e.target.value)}
              placeholder="Contoh: Siti Aminah atau KK-014"
              className={`w-full px-4 py-3 rounded-xl border text-sm font-medium focus:outline-none ${
                errors.residentName ? 'border-red-400 bg-red-50/40' : 'border-slate-200 focus:border-[#176B45]'
              }`}
            />
            {errors.residentName && <p className="text-xs text-red-600 font-semibold mt-1">{errors.residentName}</p>}
          </div>

          <div>
            <label htmlFor="rep-date" className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-2">
              Tanggal Pelaporan *
            </label>
            <input
              id="rep-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={`w-full px-4 py-3 rounded-xl border text-sm font-medium focus:outline-none ${
                errors.date ? 'border-red-400 bg-red-50/40' : 'border-slate-200 focus:border-[#176B45]'
              }`}
            />
            {errors.date && <p className="text-xs text-red-600 font-semibold mt-1">{errors.date}</p>}
          </div>
        </div>

        {/* PILIHAN KATEGORI VISUAL */}
        <div>
          <span className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-2">
            Kategori Sampah *
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.keys(CATEGORIES).map((catKey) => {
              const cat = CATEGORIES[catKey];
              const selected = category === catKey;
              return (
                <button
                  key={catKey}
                  type="button"
                  onClick={() => setCategory(catKey)}
                  className={`p-3.5 rounded-2xl border-2 text-left transition-all ${
                    selected
                      ? 'border-[#176B45] bg-emerald-50/70 shadow-2xs'
                      : 'border-slate-200 bg-white hover:border-emerald-300'
                  }`}
                >
                  <span className="font-extrabold text-sm text-[#0B1F16] block">{cat.label}</span>
                  <span className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{cat.description}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label htmlFor="rep-weight" className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-2">
              Berat Sampah (kg) *
            </label>
            <div className="relative">
              <input
                id="rep-weight"
                type="number"
                step="0.1"
                min="0.1"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="Contoh: 3.5"
                className={`w-full px-4 py-3 pr-12 rounded-xl border text-sm font-bold focus:outline-none ${
                  errors.weight ? 'border-red-400 bg-red-50/40' : 'border-slate-200 focus:border-[#176B45]'
                }`}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-extrabold text-slate-400">
                KG
              </span>
            </div>
            {errors.weight && <p className="text-xs text-red-600 font-semibold mt-1">{errors.weight}</p>}
          </div>

          <div>
            <label htmlFor="rep-loc" className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-2">
              Lokasi Pengumpulan / Dusun *
            </label>
            <select
              id="rep-loc"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium bg-white focus:outline-none focus:border-[#176B45]"
            >
              {DUSUN_OPTIONS.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="rep-notes" className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-2">
            Catatan Tambahan (Opsional)
          </label>
          <textarea
            id="rep-notes"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Contoh: Sudah dipilah dan dikemas dalam karung di depan pagar rumah."
            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#176B45]"
          />
        </div>

        <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
          <button
            type="button"
            onClick={() => onNavigate('dashboard')}
            className="px-5 py-3 rounded-xl border border-slate-200 text-xs font-extrabold uppercase tracking-wider text-slate-600 hover:bg-slate-50"
          >
            Kembali ke Dashboard
          </button>
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#176B45] text-white text-xs font-extrabold uppercase tracking-wider hover:bg-[#125637] shadow-md transition-all"
          >
            <CheckCircle2 className="w-4 h-4" />
            Kirim Laporan Sampah
          </button>
        </div>
      </form>
    </div>
  );
}

// ============================================================================
// 4. WASTE MANAGEMENT DATABASE (PENCARIAN, FILTER, SORT, EXPORT CSV, CRUD)
// ============================================================================

function DatabaseView({ records, isAdmin, onUpdateRecord, onDeleteRecord, onNavigate }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [catFilter, setCatFilter] = useState('Semua');
  const [locFilter, setLocFilter] = useState('Semua');
  const [dateFilter, setDateFilter] = useState('');
  const [sortBy, setSortBy] = useState('date-desc');

  const [selectedRecord, setSelectedRecord] = useState(null);
  const [editingRecord, setEditingRecord] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const filteredAndSorted = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    const list = records.filter((rec) => {
      const matchQuery =
        !q ||
        rec.residentName.toLowerCase().includes(q) ||
        rec.location.toLowerCase().includes(q) ||
        (rec.notes && rec.notes.toLowerCase().includes(q));
      const matchCat = catFilter === 'Semua' || rec.category === catFilter;
      const matchLoc = locFilter === 'Semua' || rec.location === locFilter;
      const matchDate = !dateFilter || rec.date === dateFilter;
      return matchQuery && matchCat && matchLoc && matchDate;
    });

    return [...list].sort((a, b) => {
      if (sortBy === 'date-desc') return b.date.localeCompare(a.date);
      if (sortBy === 'date-asc') return a.date.localeCompare(b.date);
      if (sortBy === 'weight-desc') return Number(b.weight) - Number(a.weight);
      if (sortBy === 'weight-asc') return Number(a.weight) - Number(b.weight);
      return 0;
    });
  }, [records, searchTerm, catFilter, locFilter, dateFilter, sortBy]);

  const totalFilteredWeight = useMemo(
    () => filteredAndSorted.reduce((sum, r) => sum + (Number(r.weight) || 0), 0),
    [filteredAndSorted]
  );

  const handleExportCSV = () => {
    const headers = ['ID', 'Tanggal', 'Warga/Kode KK', 'Kategori', 'Berat (kg)', 'Lokasi', 'Catatan'];
    const rows = filteredAndSorted.map((r) => [
      r.id,
      r.date,
      `"${maskResidentName(r.residentName, isAdmin).replace(/"/g, '""')}"`,
      r.category,
      r.weight,
      `"${r.location.replace(/"/g, '""')}"`,
      `"${(r.notes || '').replace(/"/g, '""')}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ecodesa-data-sampah-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-wider text-[#176B45]">
            Arsip &amp; Transparansi Data
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F16] tracking-tight mt-1">
            Database Pengelolaan Sampah
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={filteredAndSorted.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-extrabold text-slate-700 hover:bg-emerald-50 hover:border-[#176B45] disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-[#176B45]" />
            Ekspor CSV
          </button>
          <button
            type="button"
            onClick={() => onNavigate('report')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#176B45] text-white text-xs font-extrabold hover:bg-[#125637]"
          >
            <Plus className="w-4 h-4" />
            Tambah Catatan
          </button>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="p-4 rounded-2xl bg-white border border-emerald-900/10 shadow-2xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="relative lg:col-span-2">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nama warga, lokasi, atau catatan..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-[#176B45]"
          />
        </div>

        <select
          aria-label="Filter Kategori"
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white"
        >
          <option value="Semua">Semua Kategori</option>
          {Object.keys(CATEGORIES).map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select
          aria-label="Filter Lokasi"
          value={locFilter}
          onChange={(e) => setLocFilter(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white"
        >
          <option value="Semua">Semua Dusun / Lokasi</option>
          {DUSUN_OPTIONS.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>

        <select
          aria-label="Urutkan Data"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white"
        >
          <option value="date-desc">Tanggal Terbaru</option>
          <option value="date-asc">Tanggal Terlama</option>
          <option value="weight-desc">Berat Terbesar (kg)</option>
          <option value="weight-asc">Berat Terkecil (kg)</option>
        </select>
      </div>

      {/* RINGKASAN JUMLAH & BERAT */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-xs font-bold text-[#0B1F16]">
        <span>
          Total Catatan Ditampilkan: <strong className="text-[#176B45]">{filteredAndSorted.length}</strong> laporan
        </span>
        <span>
          Akumulasi Berat Terfilter: <strong className="text-[#176B45]">{totalFilteredWeight.toFixed(2)} kg</strong>
        </span>
      </div>

      {/* TABEL BASIS DATA */}
      <div className="rounded-2xl bg-white border border-emerald-900/10 shadow-2xs overflow-hidden">
        {filteredAndSorted.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <Database className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-sm font-bold text-slate-700">Belum ada data sampah yang tercatat atau cocok dengan filter.</p>
            <p className="text-xs text-slate-500">Silakan tambahkan laporan sampah baru atau ubah kata kunci pencarian.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F8FAF7] border-b border-slate-200 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-4">Tanggal</th>
                  <th className="py-3.5 px-4">Pelapor / Kode KK</th>
                  <th className="py-3.5 px-4">Kategori</th>
                  <th className="py-3.5 px-4">Berat</th>
                  <th className="py-3.5 px-4">Lokasi</th>
                  <th className="py-3.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredAndSorted.map((rec) => {
                  const cat = CATEGORIES[rec.category] || CATEGORIES.Lainnya;
                  return (
                    <tr key={rec.id} className="hover:bg-emerald-50/35">
                      <td className="py-3.5 px-4 whitespace-nowrap font-medium">{formatDateID(rec.date)}</td>
                      <td className="py-3.5 px-4 font-bold text-[#0B1F16]">
                        {maskResidentName(rec.residentName, isAdmin)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-extrabold border ${cat.bgLight} ${cat.textDark} ${cat.border}`}
                        >
                          {rec.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-[#176B45] tabular-nums">
                        {Number(rec.weight).toFixed(2)} kg
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">{rec.location}</td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedRecord(rec)}
                            className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-[#176B45]"
                            title="Lihat Detail"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {isAdmin && (
                            <>
                              <button
                                type="button"
                                onClick={() => setEditingRecord({ ...rec })}
                                className="p-2 rounded-lg text-amber-700 hover:bg-amber-50"
                                title="Edit Catatan"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(rec.id)}
                                className="p-2 rounded-lg text-red-600 hover:bg-red-50"
                                title="Hapus Catatan"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL DETAIL LAPORAN */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-lg text-[#0B1F16]">Detail Catatan Sampah</h3>
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <dl className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">ID Catatan</dt>
                <dd className="font-mono font-bold text-slate-800">{selectedRecord.id}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Pelapor / Kode KK</dt>
                <dd className="font-bold text-[#0B1F16]">{maskResidentName(selectedRecord.residentName, isAdmin)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Tanggal</dt>
                <dd className="font-medium">{formatDateID(selectedRecord.date)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Kategori</dt>
                <dd className="font-bold text-[#176B45]">{selectedRecord.category}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Berat Tercatat</dt>
                <dd className="font-extrabold text-[#176B45]">{Number(selectedRecord.weight).toFixed(2)} kg</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Lokasi</dt>
                <dd className="font-medium">{selectedRecord.location}</dd>
              </div>
              <div className="pt-2 border-t border-slate-100">
                <dt className="text-slate-500 text-xs font-bold uppercase mb-1">Catatan</dt>
                <dd className="text-slate-700 bg-slate-50 p-3 rounded-xl text-xs">
                  {selectedRecord.notes || 'Tidak ada catatan tambahan.'}
                </dd>
              </div>
            </dl>
            <button
              type="button"
              onClick={() => setSelectedRecord(null)}
              className="w-full py-2.5 rounded-xl bg-[#176B45] text-white text-xs font-extrabold uppercase tracking-wider"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* MODAL EDIT ADMIN */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onUpdateRecord({
                ...editingRecord,
                weight: parseFloat(editingRecord.weight) || 0
              });
              setEditingRecord(null);
            }}
            className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-lg text-[#0B1F16]">Edit Catatan Sampah</h3>
              <button type="button" onClick={() => setEditingRecord(null)} className="p-1.5 rounded-lg hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Nama Pelapor / KK</label>
                <input
                  type="text"
                  required
                  value={editingRecord.residentName}
                  onChange={(e) => setEditingRecord({ ...editingRecord, residentName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Kategori</label>
                  <select
                    value={editingRecord.category}
                    onChange={(e) => setEditingRecord({ ...editingRecord, category: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white"
                  >
                    {Object.keys(CATEGORIES).map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Berat (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    required
                    value={editingRecord.weight}
                    onChange={(e) => setEditingRecord({ ...editingRecord, weight: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Lokasi</label>
                <select
                  value={editingRecord.location}
                  onChange={(e) => setEditingRecord({ ...editingRecord, location: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white"
                >
                  {DUSUN_OPTIONS.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingRecord(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-extrabold uppercase"
              >
                Batal
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-[#176B45] text-white text-xs font-extrabold uppercase"
              >
                Simpan Perubahan
              </button>
            </div>
          </form>
        </div>
      )}

      {/* DIALOG KONFIRMASI HAPUS */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <h3 className="font-extrabold text-lg text-[#0B1F16]">Konfirmasi Hapus Data</h3>
            <p className="text-sm text-slate-600">
              Apakah Anda yakin ingin menghapus catatan sampah ini? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-extrabold uppercase"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteRecord(confirmDeleteId);
                  setConfirmDeleteId(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-xs font-extrabold uppercase hover:bg-red-700"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 5. ANALYTICS AND STATISTICS (RUMUS DINAMIS & METODOLOGI)
// ============================================================================

function AnalyticsView({ metrics, onNavigate }) {
  const comparisonData = [
    {
      name: 'Perbandingan Pengelolaan',
      TotalSampah: Number(metrics.totalWeight.toFixed(2)),
      PotensiTerkelola: Number(metrics.manageableWeight.toFixed(2)),
      ResiduLainnya: Number(metrics.totals.Lainnya.toFixed(2))
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <span className="text-xs font-extrabold uppercase tracking-wider text-[#176B45]">
          Analisis Kuantitatif &amp; Komposisi
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F16] tracking-tight mt-1">
          Analitik &amp; Statistik Pengelolaan Sampah
        </h1>
      </div>

      {/* KARTU METRIK FORMULASI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-emerald-900/10 shadow-2xs">
          <span className="text-xs font-bold text-slate-500">Total Sampah Tercatat</span>
          <p className="text-3xl font-extrabold text-[#0B1F16] mt-1 tabular-nums">
            {metrics.totalWeight.toFixed(2)} kg
          </p>
          <span className="text-xs text-slate-500 mt-1 block">Akumulasi seluruh kategori</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-emerald-900/10 shadow-2xs">
          <span className="text-xs font-bold text-slate-500">Rata-Rata Harian (Total / 7)</span>
          <p className="text-3xl font-extrabold text-[#176B45] mt-1 tabular-nums">
            {metrics.avgDaily.toFixed(2)} kg/hari
          </p>
          <span className="text-xs text-slate-500 mt-1 block">Estimasi timbulan harian siklus mingguan</span>
        </div>

        <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200 shadow-2xs">
          <span className="text-xs font-bold text-[#176B45]">Tingkat Potensi Terkelola</span>
          <p className="text-3xl font-extrabold text-[#176B45] mt-1 tabular-nums">
            {metrics.manageableRate.toFixed(2)}%
          </p>
          <span className="text-xs text-emerald-900/80 mt-1 block">
            {metrics.manageableWeight.toFixed(2)} kg (Organik + Plastik + Kertas)
          </span>
        </div>
      </div>

      {/* PENJELASAN METODOLOGI & RUMUS */}
      <div className="p-5 rounded-2xl bg-amber-50/80 border border-amber-200/90 space-y-2">
        <div className="flex items-center gap-2 text-amber-950 font-extrabold text-sm">
          <Info className="w-4 h-4 text-amber-700 shrink-0" />
          <span>Catatan Metodologi Perhitungan Potensi Pengelolaan</span>
        </div>
        <p className="text-xs sm:text-sm text-amber-950/90 leading-relaxed">
          Angka <strong>{metrics.manageableRate.toFixed(2)}%</strong> merupakan <strong>potensi teoretis sampah terkelola</strong>{' '}
          dengan asumsi seluruh kategori <em>Organik + Plastik + Kertas</em> berhasil dipilah dan diproses melalui komposter
          maupun Bank Sampah Desa (bukan angka tingkat daur ulang aktual di lapangan).
        </p>
        <div className="pt-1 flex flex-wrap gap-3 text-[11px] font-mono text-amber-900">
          <span>• Persentase Kategori = (Berat Kategori / Total Berat) × 100</span>
          <span>• Rata-Rata Harian = Total Berat / 7</span>
          <span>• Potensi Terkelola = ((Organik + Plastik + Kertas) / Total) × 100</span>
        </div>
      </div>

      {metrics.totalWeight === 0 ? (
        <div className="p-10 rounded-3xl bg-white border-2 border-dashed border-emerald-900/15 text-center space-y-3">
          <p className="text-sm font-bold text-slate-700">Belum ada data untuk divisualisasikan pada grafik analitik.</p>
          <button
            type="button"
            onClick={() => onNavigate('report')}
            className="px-5 py-2.5 rounded-full bg-[#176B45] text-white text-xs font-extrabold uppercase tracking-wider"
          >
            Input Data Laporan Sampah
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tren Harian / Bulanan Line Chart */}
            <div className="p-6 rounded-2xl bg-white border border-emerald-900/10 shadow-2xs">
              <h2 className="text-base font-extrabold text-[#0B1F16]">Tren Timbulan Sampah per Tanggal</h2>
              <p className="text-xs text-slate-500 mb-4">Perbandingan total sampah masuk vs potensi terkelola</p>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={metrics.trendData} margin={{ top: 10, right: 16, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis unit=" kg" tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="total" name="Total (kg)" stroke="#0B1F16" strokeWidth={2.5} />
                    <Line type="monotone" dataKey="terkelola" name="Potensi Terkelola (kg)" stroke="#176B45" strokeWidth={2.5} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Perbandingan Total vs Potensi Terkelola */}
            <div className="p-6 rounded-2xl bg-white border border-emerald-900/10 shadow-2xs">
              <h2 className="text-base font-extrabold text-[#0B1F16]">Total Sampah vs Potensi Terkelola</h2>
              <p className="text-xs text-slate-500 mb-4">Evaluasi kapasitas pengalihan sampah dari TPA</p>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={comparisonData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fontWeight: 700 }} />
                    <YAxis unit=" kg" tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="TotalSampah" name="Total Sampah (kg)" fill="#0B1F16" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="PotensiTerkelola" name="Potensi Terkelola (kg)" fill="#176B45" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="ResiduLainnya" name="Residu / Lainnya (kg)" fill="#EAB308" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Tabel Rincian Persentase */}
          <div className="p-6 rounded-2xl bg-white border border-emerald-900/10 shadow-2xs overflow-x-auto">
            <h2 className="text-base font-extrabold text-[#0B1F16] mb-4">Tabel Kalkulasi Persentase per Kategori</h2>
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-extrabold uppercase text-slate-500">
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4">Berat Tercatat</th>
                  <th className="py-3 px-4">Persentase</th>
                  <th className="py-3 px-4">Status Potensi Pengolahan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {metrics.breakdown.map((item) => (
                  <tr key={item.name}>
                    <td className="py-3 px-4 font-extrabold text-[#0B1F16]">{item.name}</td>
                    <td className="py-3 px-4 font-bold text-[#176B45] tabular-nums">{item.weight.toFixed(2)} kg</td>
                    <td className="py-3 px-4 font-bold tabular-nums">{item.percentage.toFixed(2)}%</td>
                    <td className="py-3 px-4 text-xs font-semibold">
                      {CATEGORIES[item.name]?.manageable
                        ? '✓ Dapat Diolah / Didaur Ulang'
                        : '• Residu (Perlu Penanganan Khusus)'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================================
// 6. DIGITAL EDUCATION CENTER (PUSAT EDUKASI)
// ============================================================================

function EducationView({ guides, onNavigate }) {
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const categories = ['Semua', ...Array.from(new Set(guides.map((g) => g.category)))];
  const shownGuides = guides.filter((g) => selectedCategory === 'Semua' || g.category === selectedCategory);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-wider text-[#176B45]">
            Literasi Lingkungan Warga
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F16] tracking-tight mt-1">
            Pusat Edukasi Pengelolaan Sampah
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Panduan praktis pemilahan, pengomposan organik, daur ulang plastik &amp; kertas, serta gaya hidup minim sampah.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onNavigate('report')}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#176B45] text-white text-xs font-extrabold uppercase tracking-wider shrink-0"
        >
          Praktikkan &amp; Lapor Sampah
        </button>
      </div>

      {/* Filter Kategori Edukasi */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-full text-xs font-extrabold transition-colors ${
              selectedCategory === cat
                ? 'bg-[#176B45] text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:border-[#176B45]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Kartu Artikel Edukasi */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {shownGuides.map((guide) => (
          <article
            key={guide.id}
            className="p-6 rounded-3xl bg-white border border-emerald-900/10 shadow-2xs flex flex-col justify-between gap-4 hover:border-[#176B45] transition-colors"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="px-3 py-1 rounded-full bg-emerald-50 text-[#176B45] text-[11px] font-extrabold uppercase tracking-wider">
                  {guide.category}
                </span>
                <span className="text-xs font-semibold text-slate-400">{guide.readTime}</span>
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold text-[#0B1F16] leading-snug">{guide.title}</h2>
              <p className="text-sm text-slate-600 leading-relaxed">{guide.summary}</p>
              <div className="pt-2 space-y-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#176B45] block">
                  Langkah Praktis:
                </span>
                <ul className="space-y-1.5">
                  {(guide.tips || []).map((tip, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-[#176B45] shrink-0 mt-0.5" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// 7. COMMUNITY COLLABORATION (KOLABORASI & GOTONG ROYONG WARGA)
// ============================================================================

function CommunityView({ announcements, isAdmin, onAddAnnouncement, onDeleteAnnouncement, onNotify, metrics }) {
  const [rsvps, setRsvps] = useState({});
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [category, setCategory] = useState('Gotong Royong');
  const [location, setLocation] = useState(DUSUN_OPTIONS[0]);
  const [description, setDescription] = useState('');

  const handlePublish = (e) => {
    e.preventDefault();
    if (!title.trim() || !date || !description.trim()) {
      onNotify('error', 'Lengkapi judul, tanggal, dan deskripsi kegiatan.');
      return;
    }
    onAddAnnouncement({
      title: title.trim(),
      date,
      category,
      location,
      description: description.trim()
    });
    setTitle('');
    setDate('');
    setDescription('');
  };

  return (
    <div className="space-y-6">
      <div>
        <span className="text-xs font-extrabold uppercase tracking-wider text-[#176B45]">
          Gotong Royong &amp; Partisipasi Sosial
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F16] tracking-tight mt-1">
          Kolaborasi Komunitas &amp; Agenda Desa
        </h1>
      </div>

      {/* Statistik Partisipasi */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-emerald-900/10">
          <span className="text-xs font-bold text-slate-500">Laporan Warga Terkumpul</span>
          <p className="text-2xl font-extrabold text-[#176B45] mt-1">{metrics.recordCount} Laporan</p>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-emerald-900/10">
          <span className="text-xs font-bold text-slate-500">Agenda Kegiatan Aktif</span>
          <p className="text-2xl font-extrabold text-[#0B1F16] mt-1">{announcements.length} Kegiatan</p>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-emerald-900/10">
          <span className="text-xs font-bold text-slate-500">Wilayah Terjangkau</span>
          <p className="text-2xl font-extrabold text-[#176B45] mt-1">{DUSUN_OPTIONS.length} Titik Dusun</p>
        </div>
      </div>

      {/* Form Tambah Pengumuman jika Admin */}
      {isAdmin && (
        <form onSubmit={handlePublish} className="p-6 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-4">
          <h2 className="text-base font-extrabold text-[#0B1F16]">Terbitkan Pengumuman / Jadwal Gotong Royong</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Judul Kegiatan (misal: Kerja Bakti Sungai)"
              className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm"
            />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm"
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm font-semibold"
            >
              <option value="Gotong Royong">Gotong Royong</option>
              <option value="Bank Sampah">Setor Bank Sampah</option>
              <option value="Edukasi Warga">Edukasi Warga</option>
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm"
            >
              {DUSUN_OPTIONS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Deskripsi singkat & perlengkapan yang dibawa..."
              className="sm:col-span-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-[#176B45] text-white text-xs font-extrabold uppercase tracking-wider"
          >
            Publikasikan Agenda
          </button>
        </form>
      )}

      {/* Daftar Pengumuman */}
      {announcements.length === 0 ? (
        <div className="p-10 rounded-3xl bg-white border-2 border-dashed border-emerald-900/15 text-center space-y-2">
          <Megaphone className="w-8 h-8 text-[#176B45] mx-auto" />
          <h3 className="font-extrabold text-base text-[#0B1F16]">Belum Ada Pengumuman Komunitas</h3>
          <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
            Aktifkan <strong>Mode Admin</strong> di menu samping untuk menerbitkan jadwal gotong royong, penimbangan Bank Sampah, atau penyuluhan lingkungan.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {announcements.map((item) => {
            const joined = !!rsvps[item.id];
            return (
              <div
                key={item.id}
                className="p-6 rounded-2xl bg-white border border-emerald-900/10 shadow-2xs flex flex-col justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full bg-emerald-50 text-[#176B45] text-xs font-extrabold">
                      {item.category}
                    </span>
                    <span className="text-xs font-bold text-slate-500">{formatDateID(item.date)}</span>
                  </div>
                  <h3 className="text-lg font-extrabold text-[#0B1F16]">{item.title}</h3>
                  <p className="text-sm text-slate-600">{item.description}</p>
                  <p className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 pt-1">
                    <MapPin className="w-3.5 h-3.5 text-[#176B45]" /> {item.location}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setRsvps((prev) => ({ ...prev, [item.id]: !prev[item.id] }));
                      onNotify('success', !joined ? 'Kehadiran gotong royong dikonfirmasi!' : 'Konfirmasi dibatalkan.');
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-colors ${
                      joined ? 'bg-[#176B45] text-white' : 'bg-emerald-50 text-[#176B45] hover:bg-emerald-100'
                    }`}
                  >
                    {joined ? '✓ Terdaftar Hadir' : 'Konfirmasi Hadir'}
                  </button>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => onDeleteAnnouncement(item.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      title="Hapus Pengumuman"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 8. SDGs INTEGRATION (SDGs DESA 11, 12, 13, 17)
// ============================================================================

function SdgsView({ onNavigate }) {
  const goals = [
    {
      number: '11',
      title: 'SDGs Desa 11: Desa Aman dan Nyaman',
      subtitle: 'Permukiman Bersih, Sehat, dan Bebas Tumpukan Sampah',
      contribution:
        'ECO-DESA membantu pemetaan titik pengumpulan sampah di setiap dusun sehingga pengangkutan berjalan terjadwal dan mencegah munculnya tempat pembuangan sampah liar di saluran air maupun lahan kosong.',
      indicators: [
        'Pelaporan timbulan sampah berbasis dusun/RW',
        'Peningkatan kebersihan fasilitas umum dan lingkungan permukiman'
      ]
    },
    {
      number: '12',
      title: 'SDGs Desa 12: Konsumsi dan Produksi Desa Sadar Lingkungan',
      subtitle: 'Pemilahan Sumber, Pengomposan, dan Sirkularitas Material',
      contribution:
        'Mendorong rumah tangga memilah sampah organik, plastik, dan kertas sejak dari sumbernya, serta menyediakan modul edukasi literasi minim sampah sekali pakai.',
      indicators: [
        'Pemantauan persentase sampah berpotensi terkelola secara real-time',
        'Integrasi pencatatan dengan operasional Bank Sampah & rumah kompos desa'
      ]
    },
    {
      number: '13',
      title: 'SDGs Desa 13: Desa Tanggap Perubahan Iklim',
      subtitle: 'Mitigasi Emisi Metana & Pencegahan Pembakaran Terbuka',
      contribution:
        'Pengalihan sampah organik ke unit pengomposan mengurangi emisi gas metana (CH4) di TPA, sementara edukasi warga menekan praktik pembakaran sampah plastik yang mencemari udara desa.',
      indicators: [
        'Pengurangan timbulan sampah organik tak terolah',
        'Kampanye desa bebas pembakaran sampah terbuka'
      ]
    },
    {
      number: '17',
      title: 'SDGs Desa 17: Kemitraan untuk Pembangunan Desa',
      subtitle: 'Kolaborasi Digital Berbasis Nilai Gotong Royong',
      contribution:
        'Menghubungkan peran warga, kader PKK, Karang Taruna, pengelola Bank Sampah, dan pemerintah desa dalam satu ekosistem data yang transparan dan mudah diakses.',
      indicators: [
        'Partisipasi aktif pelaporan mandiri oleh warga',
        'Koordinasi agenda kerja bakti dan evaluasi berbasis data terbuka'
      ]
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <span className="text-xs font-extrabold uppercase tracking-wider text-[#176B45]">
          Kerangka Pembangunan Berkelanjutan
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F16] tracking-tight mt-1">
          Integrasi SDGs Desa pada ECO-DESA
        </h1>
        <p className="text-sm text-slate-600 mt-1 max-w-3xl">
          Setiap fitur pelaporan, edukasi, dan kolaborasi warga dirancang untuk mendukung pencapaian 4 tujuan utama SDGs Desa.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {goals.map((g) => (
          <div key={g.number} className="p-6 rounded-3xl bg-white border border-emerald-900/10 shadow-2xs space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#176B45] text-white font-extrabold text-2xl flex items-center justify-center shrink-0 shadow-sm">
                {g.number}
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-[#0B1F16] leading-snug">{g.title}</h2>
                <span className="text-xs font-bold text-[#176B45]">{g.subtitle}</span>
              </div>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">{g.contribution}</p>
            <div className="pt-2 border-t border-slate-100 space-y-1.5">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 block">
                Kontribusi Platform:
              </span>
              {g.indicators.map((ind, i) => (
                <div key={i} className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <Award className="w-4 h-4 text-[#176B45] shrink-0" />
                  <span>{ind}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="p-6 rounded-3xl bg-[#176B45] text-white flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-extrabold">Berkontribusi Langsung pada SDGs Desa</h3>
          <p className="text-xs sm:text-sm text-emerald-100 mt-0.5">
            Mulai dengan mencatat sampah rumah tangga terpilah hari ini.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onNavigate('report')}
          className="px-5 py-3 rounded-full bg-white text-[#176B45] text-xs font-extrabold uppercase tracking-wider hover:bg-emerald-50 shrink-0"
        >
          Laporkan Sampah Sekarang
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// 9. ADMINISTRATOR INTERFACE (PANEL PENGURUS DESA)
// ============================================================================

function AdminView({
  isAdmin,
  setIsAdmin,
  records,
  metrics,
  announcements,
  educationGuides,
  onDeleteRecord,
  onAddAnnouncement,
  onDeleteAnnouncement,
  onAddEducation,
  onDeleteEducation,
  onNotify,
  supabaseConfig,
  isSupabaseConnected,
  onSaveSupabaseConfig,
  onSyncNow
}) {
  const [adminPassword, setAdminPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [sbUrlInput, setSbUrlInput] = useState(supabaseConfig?.url || '');
  const [sbKeyInput, setSbKeyInput] = useState(supabaseConfig?.anonKey || '');
  const [eduTitle, setEduTitle] = useState('');
  const [eduCategory, setEduCategory] = useState('Pemilahan Dasar');
  const [eduSummary, setEduSummary] = useState('');
  const [eduTip, setEduTip] = useState('');

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (adminPassword === 'ecodesa') {
      setIsAdmin(true);
      setAdminPassword('');
      setPasswordError('');
      onNotify('success', 'Login berhasil. Mode Administrator Desa aktif.');
    } else {
      setPasswordError('Password salah. Silakan masukkan password administrator yang benar.');
      onNotify('error', 'Password administrator tidak sesuai.');
    }
  };

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto my-8 p-8 rounded-3xl bg-white border border-emerald-900/10 shadow-sm space-y-5">
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-extrabold text-[#0B1F16]">Login Administrator Desa</h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            Masukkan password pengurus desa untuk mengelola catatan laporan sampah, agenda gotong royong, dan materi edukasi.
          </p>
        </div>

        <form onSubmit={handleAdminLogin} className="space-y-4">
          <div>
            <label htmlFor="admin-pass" className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-2">
              Password Administrator
            </label>
            <input
              id="admin-pass"
              type="password"
              value={adminPassword}
              onChange={(e) => {
                setAdminPassword(e.target.value);
                if (passwordError) setPasswordError('');
              }}
              placeholder="Masukkan password admin..."
              className={`w-full px-4 py-3 rounded-xl border text-sm font-medium focus:outline-none ${
                passwordError ? 'border-red-400 bg-red-50/40' : 'border-slate-200 focus:border-[#176B45]'
              }`}
            />
            {passwordError && (
              <p className="text-xs text-red-600 font-semibold mt-1.5">{passwordError}</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-[#176B45] text-white text-xs font-extrabold uppercase tracking-wider hover:bg-[#125637] transition-colors shadow-sm"
          >
            Masuk ke Panel Admin
          </button>
        </form>
      </div>
    );
  }

  const handleCreateEdu = (e) => {
    e.preventDefault();
    if (!eduTitle.trim() || !eduSummary.trim()) {
      onNotify('error', 'Judul dan ringkasan materi edukasi wajib diisi.');
      return;
    }
    onAddEducation({
      title: eduTitle.trim(),
      category: eduCategory,
      readTime: '4 Menit Baca',
      summary: eduSummary.trim(),
      tips: eduTip.trim() ? [eduTip.trim()] : ['Terapkan pemilahan sampah secara konsisten di rumah.']
    });
    setEduTitle('');
    setEduSummary('');
    setEduTip('');
  };

  const handlePrintPdf = () => {
    setShowPrintPreview(true);
    setTimeout(() => {
      window.print();
    }, 250);
  };

  return (
    <div className="space-y-6">
      <style>{ECO_LANDING_CSS}</style>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-wider text-amber-800">
            Akses Pengurus Desa Aktif
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F16] tracking-tight mt-1">
            Dashboard Administrator ECO-DESA
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handlePrintPdf}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#176B45] text-white text-xs font-extrabold uppercase tracking-wider hover:bg-[#125637] shadow-xs transition-colors"
          >
            <Printer className="w-4 h-4" />
            Cetak Rekap Laporan (PDF)
          </button>
          <button
            type="button"
            onClick={() => setIsAdmin(false)}
            className="px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-extrabold uppercase tracking-wider hover:bg-slate-800"
          >
            Keluar Mode Admin
          </button>
        </div>
      </div>

      {/* MODAL / AREA PRATINJAU CETAK LAPORAN RESMI PDF */}
      {showPrintPreview && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div
            id="ecodesa-print-report"
            className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-10 space-y-6 shadow-2xl border border-slate-200 my-auto"
          >
            <div className="flex items-start justify-between border-b-2 border-[#0B1F16] pb-4">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-widest text-[#176B45]">
                  REKAPITULASI RESMI PENGELOLAAN SAMPAH DESA
                </span>
                <h2 className="text-2xl font-extrabold text-[#0B1F16] mt-1">
                  LAPORAN MONITORING ECO-DESA
                </h2>
                <p className="text-xs text-slate-600 mt-1">
                  Tanggal Cetak: {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPrintPreview(false)}
                className="no-print p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700"
                aria-label="Tutup pratinjau cetak"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Ringkasan Statistik Cetak */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                <span className="text-[11px] font-bold text-slate-500 block">Total Sampah</span>
                <strong className="text-lg font-extrabold text-[#0B1F16]">{metrics.totalWeight.toFixed(2)} kg</strong>
              </div>
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                <span className="text-[11px] font-bold text-slate-500 block">Potensi Terkelola</span>
                <strong className="text-lg font-extrabold text-[#176B45]">
                  {metrics.manageableWeight.toFixed(2)} kg ({metrics.manageableRate.toFixed(1)}%)
                </strong>
              </div>
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                <span className="text-[11px] font-bold text-slate-500 block">Rata-Rata Harian</span>
                <strong className="text-lg font-extrabold text-[#0B1F16]">{metrics.avgDaily.toFixed(2)} kg/hari</strong>
              </div>
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                <span className="text-[11px] font-bold text-slate-500 block">Jumlah Laporan</span>
                <strong className="text-lg font-extrabold text-[#0B1F16]">{records.length} Catatan</strong>
              </div>
            </div>

            {/* Rincian per Kategori */}
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-2">
                1. Komposisi Berdasarkan Kategori Sampah
              </h3>
              <table className="w-full text-left border-collapse border border-slate-300 text-xs">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="border border-slate-300 py-2 px-3 font-extrabold">Kategori</th>
                    <th className="border border-slate-300 py-2 px-3 font-extrabold">Berat Tercatat (kg)</th>
                    <th className="border border-slate-300 py-2 px-3 font-extrabold">Persentase</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.breakdown.map((b) => (
                    <tr key={b.name}>
                      <td className="border border-slate-300 py-2 px-3 font-bold">{b.name}</td>
                      <td className="border border-slate-300 py-2 px-3">{b.weight.toFixed(2)} kg</td>
                      <td className="border border-slate-300 py-2 px-3">{b.percentage.toFixed(2)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Daftar Catatan Laporan Warga */}
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-2">
                2. Rincian Catatan Pelaporan Warga ({records.length} Entri)
              </h3>
              {records.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-2">Belum ada catatan laporan sampah yang masuk.</p>
              ) : (
                <table className="w-full text-left border-collapse border border-slate-300 text-xs">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="border border-slate-300 py-2 px-3 font-extrabold">No</th>
                      <th className="border border-slate-300 py-2 px-3 font-extrabold">Tanggal</th>
                      <th className="border border-slate-300 py-2 px-3 font-extrabold">Pelapor / Kode KK</th>
                      <th className="border border-slate-300 py-2 px-3 font-extrabold">Kategori</th>
                      <th className="border border-slate-300 py-2 px-3 font-extrabold">Berat</th>
                      <th className="border border-slate-300 py-2 px-3 font-extrabold">Lokasi / Dusun</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((rec, i) => (
                      <tr key={rec.id}>
                        <td className="border border-slate-300 py-1.5 px-3">{i + 1}</td>
                        <td className="border border-slate-300 py-1.5 px-3">{formatDateID(rec.date)}</td>
                        <td className="border border-slate-300 py-1.5 px-3 font-bold">{rec.residentName}</td>
                        <td className="border border-slate-300 py-1.5 px-3">{rec.category}</td>
                        <td className="border border-slate-300 py-1.5 px-3 font-bold">{Number(rec.weight).toFixed(2)} kg</td>
                        <td className="border border-slate-300 py-1.5 px-3">{rec.location}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Tanda Tangan Pengesahan */}
            <div className="pt-6 flex justify-end text-xs">
              <div className="text-center w-56 space-y-12">
                <p className="font-bold text-slate-700">Mengetahui,<br />Pengurus Bank Sampah / Pemerintah Desa</p>
                <div className="border-t border-slate-400 pt-1 font-extrabold text-slate-800">
                  ( ........................................ )
                </div>
              </div>
            </div>

            {/* Tombol Aksi Cetak (Disembunyikan saat Print) */}
            <div className="no-print pt-4 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowPrintPreview(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-extrabold uppercase"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#176B45] text-white text-xs font-extrabold uppercase hover:bg-[#125637]"
              >
                <Printer className="w-4 h-4" />
                Simpan / Cetak PDF Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ringkasan Admin */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200">
          <span className="text-xs font-bold text-slate-500">Total Laporan Warga</span>
          <p className="text-2xl font-extrabold text-[#0B1F16] mt-1">{records.length} Catatan</p>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-slate-200">
          <span className="text-xs font-bold text-slate-500">Pengumuman Aktif</span>
          <p className="text-2xl font-extrabold text-[#176B45] mt-1">{announcements.length} Agenda</p>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-slate-200">
          <span className="text-xs font-bold text-slate-500">Modul Edukasi</span>
          <p className="text-2xl font-extrabold text-[#0B1F16] mt-1">{educationGuides.length} Artikel</p>
        </div>
      </div>

      {/* Koneksi Database Supabase */}
      <div className="p-6 rounded-2xl bg-white border border-emerald-900/10 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-extrabold text-[#0B1F16]">Konfigurasi Database Supabase</h2>
            <p className="text-xs text-slate-500">
              Masukkan Project URL dan Anon Public Key dari Dashboard Supabase (Settings → API).
            </p>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-extrabold ${
              isSupabaseConnected ? 'bg-emerald-100 text-[#176B45]' : 'bg-amber-100 text-amber-900'
            }`}
          >
            {isSupabaseConnected ? '● Terhubung' : '○ Belum Terhubung'}
          </span>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSaveSupabaseConfig(sbUrlInput, sbKeyInput);
          }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-3"
        >
          <input
            type="url"
            value={sbUrlInput}
            onChange={(e) => setSbUrlInput(e.target.value)}
            placeholder="https://xyzcompany.supabase.co"
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-mono"
          />
          <input
            type="password"
            value={sbKeyInput}
            onChange={(e) => setSbKeyInput(e.target.value)}
            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-mono"
          />
          <div className="sm:col-span-2 flex flex-wrap gap-2">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#176B45] text-white text-xs font-extrabold uppercase tracking-wider hover:bg-[#125637]"
            >
              Simpan &amp; Hubungkan Supabase
            </button>
            {isSupabaseConnected && (
              <button
                type="button"
                onClick={onSyncNow}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-extrabold uppercase tracking-wider text-slate-700 hover:bg-slate-50"
              >
                Sinkronkan Ulang Data
              </button>
            )}
          </div>
        </form>

        <details className="text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
          <summary className="font-extrabold text-slate-700 cursor-pointer">
            Lihat Skema SQL Tabel Supabase (Jalankan di SQL Editor Supabase jika tabel belum ada)
          </summary>
          <pre className="mt-2 p-3 rounded-lg bg-slate-900 text-emerald-300 overflow-x-auto text-[11px] leading-relaxed">
{`create table if not exists public.waste_records (
  id uuid default gen_random_uuid() primary key,
  resident_name text not null,
  report_date date not null,
  category text not null,
  weight numeric not null,
  location text not null,
  notes text,
  created_at timestamptz default now()
);

alter table public.waste_records enable row level security;
create policy "Public read write waste_records" on public.waste_records
  for all using (true) with check (true);`}
          </pre>
        </details>
      </div>

      {/* Kelola Materi Edukasi */}
      <div className="p-6 rounded-2xl bg-white border border-emerald-900/10 space-y-4">
        <h2 className="text-base font-extrabold text-[#0B1F16]">Tambah Materi Pusat Edukasi</h2>
        <form onSubmit={handleCreateEdu} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            type="text"
            value={eduTitle}
            onChange={(e) => setEduTitle(e.target.value)}
            placeholder="Judul Panduan Edukasi"
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm"
          />
          <input
            type="text"
            value={eduCategory}
            onChange={(e) => setEduCategory(e.target.value)}
            placeholder="Kategori (misal: Kompos Organik)"
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm"
          />
          <input
            type="text"
            value={eduSummary}
            onChange={(e) => setEduSummary(e.target.value)}
            placeholder="Ringkasan singkat materi..."
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm"
          />
          <input
            type="text"
            value={eduTip}
            onChange={(e) => setEduTip(e.target.value)}
            placeholder="Satu tips praktis utama..."
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm"
          />
          <button
            type="submit"
            className="sm:col-span-2 py-2.5 rounded-xl bg-[#176B45] text-white text-xs font-extrabold uppercase tracking-wider"
          >
            Simpan Materi Edukasi Baru
          </button>
        </form>

        <div className="divide-y divide-slate-100 pt-2">
          {educationGuides.map((g) => (
            <div key={g.id} className="py-2.5 flex items-center justify-between gap-3 text-sm">
              <div>
                <span className="font-bold text-[#0B1F16]">{g.title}</span>
                <span className="text-xs text-slate-500 ml-2">({g.category})</span>
              </div>
              <button
                type="button"
                onClick={() => onDeleteEducation(g.id)}
                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                title="Hapus Materi"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Tinjau & Hapus Laporan Warga (Nama Lengkap Terlihat untuk Admin) */}
      <div className="p-6 rounded-2xl bg-white border border-emerald-900/10 space-y-3">
        <h2 className="text-base font-extrabold text-[#0B1F16]">Tinjauan Laporan Warga (Identitas Penuh Admin)</h2>
        {records.length === 0 ? (
          <p className="text-sm text-slate-500">Belum ada laporan sampah yang masuk.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {records.map((r) => (
              <div key={r.id} className="py-3 flex items-center justify-between gap-3 text-sm">
                <div>
                  <span className="font-extrabold text-[#0B1F16]">{r.residentName}</span>
                  <span className="text-slate-500 ml-2">
                    — {r.weight} kg {r.category} ({r.location}, {formatDateID(r.date)})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onDeleteRecord(r.id)}
                  className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-bold hover:bg-red-100"
                >
                  Hapus
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
