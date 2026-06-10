'use client';

import { useRef, useState } from 'react';
import * as htmlToImage from 'html-to-image';

export interface CritiqueCardProps {
  persona: 'vance' | 'kiki' | 'oracle';
  imageUrl: string;
  rating: number;
  punchline: string;
  critique: string;
  onClose?: () => void;
}

// ─── Branding Footer (shared, adapts per theme) ───────────────────────────────
function BrandFooter({ theme }: { theme: 'vance' | 'kiki' | 'oracle' }) {
  const styles = {
    vance: 'flex items-center justify-between px-5 py-3 border-t border-white/10',
    kiki:  'flex items-center justify-between px-5 py-3',
    oracle:'flex items-center justify-between px-6 py-4 border-t border-gray-100',
  };
  const textStyles = {
    vance:  'text-white/40 text-[10px] tracking-[0.2em] uppercase font-mono',
    kiki:   'text-white/60 text-[10px] tracking-[0.15em] uppercase font-bold',
    oracle: 'text-gray-400 text-[10px] tracking-[0.2em] uppercase',
  };
  return (
    <div className={styles[theme]}>
      <div className="flex items-center gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="heyrate.me" crossOrigin="anonymous" className="h-5 w-auto object-contain opacity-80" />
        <span className={textStyles[theme]}>heyrate.me</span>
      </div>
      <span className={textStyles[theme]}>#heyrateme</span>
    </div>
  );
}

// ─── VANCE CARD ───────────────────────────────────────────────────────────────
// Aesthetic: Cold editorial. Dazed magazine meets film credits.
function VanceCard({ imageUrl, rating, punchline, critique, isVideo }: Omit<CritiqueCardProps, 'persona' | 'onClose'> & { isVideo: boolean }) {
  return (
    <div
      className="relative flex flex-col w-full max-w-[380px] overflow-hidden rounded-2xl"
      style={{ aspectRatio: '9/16', background: '#080808', fontFamily: "'Inter', sans-serif" }}
    >
      {/* Cold blue accent line */}
      <div style={{ height: 2, background: 'linear-gradient(90deg, transparent, #00BFFF 40%, transparent)', opacity: 0.7 }} />

      {/* Persona stamp */}
      <div className="px-5 pt-4 pb-2 flex items-center justify-between">
        <span style={{ fontSize: 10, letterSpacing: '0.35em', color: '#00BFFF', textTransform: 'uppercase', fontWeight: 700 }}>
          VANCE
        </span>
        <span style={{ fontSize: 9, letterSpacing: '0.2em', color: '#ffffff30', textTransform: 'uppercase' }}>
          The Sarcastic Elitist
        </span>
      </div>

      {/* Full-bleed image with bottom vignette */}
      <div className="relative w-full flex-1 overflow-hidden" style={{ minHeight: 0 }}>
        {isVideo ? (
          <video src={imageUrl} autoPlay loop muted playsInline crossOrigin="anonymous" className="w-full h-full object-cover" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="Post" crossOrigin="anonymous" className="w-full h-full object-cover" />
        )}
        {/* Vignette overlay */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 40%, #080808 100%)' }} />

        {/* Huge rating number over vignette */}
        <div className="absolute bottom-4 left-5 flex items-end gap-1.5">
          <span style={{ fontSize: 80, fontWeight: 800, lineHeight: 1, color: '#ffffff', letterSpacing: '-4px' }}>
            {rating.toFixed(1)}
          </span>
          <span style={{ fontSize: 14, color: '#ffffff60', marginBottom: 14, letterSpacing: '0.05em' }}>/&thinsp;5</span>
        </div>

        {/* Punchline over vignette */}
        <div className="absolute bottom-20 left-5 right-5">
          <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 17, color: '#ffffffcc', lineHeight: 1.4 }}>
            &ldquo;{punchline}&rdquo;
          </p>
        </div>
      </div>

      {/* Critique text */}
      <div className="px-5 pt-4 pb-3">
        <p style={{ fontFamily: "'Courier New', monospace", fontSize: 11, color: '#9ca3af', lineHeight: 1.7, letterSpacing: '0.02em' }}>
          {critique}
        </p>
      </div>

      <BrandFooter theme="vance" />
    </div>
  );
}

// ─── KIKI CARD ────────────────────────────────────────────────────────────────
// Aesthetic: Loud Gen-Z chaos. i-D magazine meets concert poster.
function KikiCard({ imageUrl, rating, punchline, critique, isVideo }: Omit<CritiqueCardProps, 'persona' | 'onClose'> & { isVideo: boolean }) {
  const getEmojis = (r: number) => {
    if (r >= 4) return ['🔥', '💅', '✨'];
    if (r >= 2.5) return ['🤔', '✨', '😅'];
    return ['💀', '😬', '🫠'];
  };
  const emojis = getEmojis(rating);

  return (
    <div
      className="relative flex flex-col w-full max-w-[380px] overflow-hidden rounded-2xl"
      style={{
        aspectRatio: '9/16',
        background: 'linear-gradient(135deg, #FF3CAC 0%, #784BA0 50%, #2B86C5 100%)',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Background noise / star pattern */}
      <div className="absolute inset-0 pointer-events-none" style={{ opacity: 0.07 }}>
        {[...Array(18)].map((_, i) => (
          <span key={i} style={{
            position: 'absolute',
            left: `${(i * 37 + 10) % 90}%`,
            top: `${(i * 53 + 5) % 90}%`,
            fontSize: i % 3 === 0 ? 28 : 16,
            color: 'white',
            transform: `rotate(${i * 22}deg)`,
          }}>★</span>
        ))}
      </div>

      {/* Persona stamp */}
      <div className="px-5 pt-5 pb-1">
        <span style={{ fontSize: 11, letterSpacing: '0.3em', color: 'rgba(255,255,255,0.9)', textTransform: 'uppercase', fontWeight: 900 }}>
          KIKI ★
        </span>
        <span style={{ fontSize: 9, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginLeft: 8 }}>
          Chaos Hype-Beast
        </span>
      </div>

      {/* Floating image with thick border */}
      <div className="relative mx-4 mt-2 rounded-3xl overflow-hidden" style={{ border: '4px solid rgba(255,255,255,0.9)', boxShadow: '0 20px 60px rgba(0,0,0,0.4)', aspectRatio: '4/5' }}>
        {isVideo ? (
          <video src={imageUrl} autoPlay loop muted playsInline crossOrigin="anonymous" className="w-full h-full object-cover" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="Post" crossOrigin="anonymous" className="w-full h-full object-cover" />
        )}
        {/* Rotated rating badge */}
        <div className="absolute top-3 right-3 flex items-center justify-center"
          style={{ width: 64, height: 64, borderRadius: '50%', background: 'white', transform: 'rotate(12deg)', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
          <div className="text-center">
            <div style={{ fontSize: 20, fontWeight: 900, color: '#FF3CAC', lineHeight: 1 }}>{rating.toFixed(1)}</div>
            <div style={{ fontSize: 8, fontWeight: 700, color: '#784BA0', letterSpacing: '0.05em' }}>/ 5.0</div>
          </div>
        </div>
      </div>

      {/* Punchline */}
      <div className="px-5 pt-4">
        <p style={{ fontSize: 20, fontWeight: 900, color: 'white', textTransform: 'uppercase', lineHeight: 1.15, letterSpacing: '-0.5px', wordBreak: 'break-word' }}>
          {punchline}
        </p>
      </div>

      {/* Emoji row */}
      <div className="px-5 pt-2 flex gap-2">
        {emojis.map((e, i) => <span key={i} style={{ fontSize: 22 }}>{e}</span>)}
      </div>

      {/* Critique */}
      <div className="px-5 pt-2 flex-1">
        <p style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.85)', lineHeight: 1.6 }}>
          {critique}
        </p>
      </div>

      <BrandFooter theme="kiki" />
    </div>
  );
}

// ─── ORACLE CARD ──────────────────────────────────────────────────────────────
// Aesthetic: Luxury minimal. Vogue meets museum exhibit label.
function OracleCard({ imageUrl, rating, punchline, critique, isVideo }: Omit<CritiqueCardProps, 'persona' | 'onClose'> & { isVideo: boolean }) {
  const stars = Array.from({ length: 5 }, (_, i) => i < Math.round(rating));

  return (
    <div
      className="relative flex flex-col w-full max-w-[380px] overflow-hidden rounded-2xl"
      style={{ aspectRatio: '9/16', background: '#FAFAF8', fontFamily: "'Georgia', serif" }}
    >
      {/* Watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        <span style={{
          fontSize: 120,
          fontWeight: 900,
          color: '#00000008',
          transform: 'rotate(-30deg)',
          whiteSpace: 'nowrap',
          letterSpacing: '-4px',
          userSelect: 'none',
        }}>
          ORACLE
        </span>
      </div>

      {/* Persona stamp — centered */}
      <div className="pt-6 pb-4 text-center">
        <div style={{ fontSize: 9, letterSpacing: '0.4em', color: '#9ca3af', textTransform: 'uppercase', fontFamily: "'Inter', sans-serif" }}>
          THE ORACLE
        </div>
        <div style={{ fontSize: 8, letterSpacing: '0.25em', color: '#d1d5db', textTransform: 'uppercase', fontFamily: "'Inter', sans-serif", marginTop: 3 }}>
          Fashion Psychoanalyst
        </div>
      </div>

      {/* Full-width image — museum exhibit style */}
      <div className="w-full flex-1 overflow-hidden" style={{ borderTop: '1px solid #e5e5e5', borderBottom: '1px solid #e5e5e5', minHeight: 0 }}>
        {isVideo ? (
          <video src={imageUrl} autoPlay loop muted playsInline crossOrigin="anonymous" className="w-full h-full object-cover" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="Post" crossOrigin="anonymous" className="w-full h-full object-cover" />
        )}
      </div>

      {/* Star rating — centered */}
      <div className="flex justify-center gap-1.5 pt-5">
        {stars.map((filled, i) => (
          <span key={i} style={{ fontSize: 18, color: filled ? '#111' : '#e5e5e5' }}>★</span>
        ))}
      </div>

      {/* Punchline — centered serif */}
      <div className="px-8 pt-3 text-center">
        <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 16, color: '#1a1a1a', lineHeight: 1.5 }}>
          — {punchline} —
        </p>
      </div>

      {/* Critique — centered light */}
      <div className="px-8 pt-3 pb-2 text-center flex-shrink-0">
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, fontWeight: 300, color: '#6b7280', lineHeight: 1.75 }}>
          {critique}
        </p>
      </div>

      <BrandFooter theme="oracle" />
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export default function CritiqueCard({
  persona,
  imageUrl,
  rating,
  punchline,
  critique,
  onClose,
}: CritiqueCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const isVideo = Boolean(
    imageUrl.match(/\.(mp4|webm|mov|quicktime)$/i) || imageUrl.startsWith('data:video/')
  );

  const handleDownload = async () => {
    if (!cardRef.current) return;
    try {
      setIsDownloading(true);
      const dataUrl = await htmlToImage.toPng(cardRef.current, {
        quality: 0.9,
        pixelRatio: 2,
        skipFonts: true,
        cacheBust: true,
        allowTaint: true,
      } as any);
      const link = document.createElement('a');
      link.download = `heyrate-${persona}-critique.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to generate image download:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  // Per-persona download button style
  const downloadBtn = {
    vance:  { background: '#080808', color: 'white', border: '1px solid #ffffff20' },
    kiki:   { background: 'linear-gradient(135deg, #FF3CAC, #784BA0)', color: 'white', border: 'none' },
    oracle: { background: 'transparent', color: '#111', border: '1px solid #111' },
  }[persona];

  const cardProps = { imageUrl, rating, punchline, critique, isVideo };

  return (
    <div className="w-full relative flex flex-col items-center gap-6 p-4 pt-10">
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-0 right-2 text-white/70 hover:text-white transition-all font-bold tracking-widest uppercase text-xs p-2 hover:scale-105 z-50 flex items-center gap-1.5"
        >
          ✕ Close
        </button>
      )}

      <div ref={cardRef} className="w-full flex justify-center">
        {persona === 'vance'  && <VanceCard  {...cardProps} />}
        {persona === 'kiki'   && <KikiCard   {...cardProps} />}
        {persona === 'oracle' && <OracleCard {...cardProps} />}
      </div>

      <button
        onClick={handleDownload}
        disabled={isDownloading}
        style={{ ...downloadBtn, borderRadius: 999, padding: '12px 28px', fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', opacity: isDownloading ? 0.5 : 1, transition: 'opacity 0.2s' }}
      >
        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        {isDownloading ? 'Downloading...' : 'Download to Share'}
      </button>
    </div>
  );
}
