'use client';

import { useRef, useState, useEffect } from 'react';
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
        <img src="/logo.png" alt="heyrate.me" className="h-5 w-auto object-contain opacity-80" />
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
          <video src={imageUrl} autoPlay loop muted playsInline className="w-full h-full object-cover" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="Post" crossOrigin={imageUrl.startsWith('data:') ? undefined : "anonymous"} className="w-full h-full object-cover" />
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
          <video src={imageUrl} autoPlay loop muted playsInline className="w-full h-full object-cover" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="Post" crossOrigin={imageUrl.startsWith('data:') ? undefined : "anonymous"} className="w-full h-full object-cover" />
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
          <video src={imageUrl} autoPlay loop muted playsInline className="w-full h-full object-cover" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="Post" crossOrigin={imageUrl.startsWith('data:') ? undefined : "anonymous"} className="w-full h-full object-cover" />
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Capture a single frame from a video element as a base64 PNG data URL
function captureVideoFrame(videoEl: HTMLVideoElement): string {
  const canvas = document.createElement('canvas');
  canvas.width = videoEl.videoWidth || 640;
  canvas.height = videoEl.videoHeight || 1136;
  const ctx = canvas.getContext('2d');
  ctx?.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/png');
}

// Fetch an external image and convert to base64 to avoid canvas taint
async function toBase64(url: string): Promise<string> {
  const res = await fetch(url, { mode: 'cors', cache: 'no-cache' });
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// ─── Save to Photos on iOS ────────────────────────────────────────────────────
// iOS Safari/Chrome won't save to the Camera Roll via <a download>.
// The only reliable cross-platform approach is to open the image in a new
// tab — on iOS the user can then long-press → "Add to Photos".
// On Android/desktop the direct download still works fine.
function isIOS(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    /iPad|iPhone|iPod/.test(navigator.userAgent) &&
    !(window as any).MSStream
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
  const [showIOSHint, setShowIOSHint] = useState(false);
  // Pre-resolved base64 image — loaded eagerly to avoid canvas taint at export time
  const [resolvedImageUrl, setResolvedImageUrl] = useState<string | null>(null);
  const [imageReady, setImageReady] = useState(false);

  const isVideo = Boolean(
    imageUrl.match(/\.(mp4|webm|mov|quicktime)$/i) || imageUrl.startsWith('data:video/')
  );

  // ── Pre-load image as base64 as soon as the card mounts ──────────────────
  // This runs once on mount so the image is ready before the user taps download
  useEffect(() => {
    if (!isVideo && imageUrl && !imageUrl.startsWith('data:')) {
      toBase64(imageUrl)
        .then(b64 => {
          setResolvedImageUrl(b64);
          setImageReady(true);
        })
        .catch(() => setImageReady(true)); // fall back gracefully
    } else {
      setImageReady(true);
    }
  }, [imageUrl, isVideo]);

  const handleDownload = async () => {
    if (!cardRef.current) return;
    try {
      setIsDownloading(true);

      // ── Videos: capture current frame ────────────────────────────────────
      if (isVideo) {
        const videoEl = cardRef.current.querySelector('video');
        if (videoEl) {
          const frameDataUrl = captureVideoFrame(videoEl);
          setResolvedImageUrl(frameDataUrl);
          await new Promise(r => setTimeout(r, 150));
        }
      } else if (!resolvedImageUrl) {
        // Fallback: if pre-load didn't finish, fetch now
        const b64 = await toBase64(imageUrl);
        setResolvedImageUrl(b64);
        await new Promise(r => setTimeout(r, 150));
      }

      // Give React time to re-render with base64 image before capture
      await new Promise(r => setTimeout(r, 100));

      const dataUrl = await htmlToImage.toPng(cardRef.current, {
        quality: 1.0,
        pixelRatio: 3,
        fetchRequestInit: { mode: 'cors', cache: 'no-cache' },
      });

      if (isIOS()) {
        // ── iOS: open in new tab so user can save to Photos ───────────────
        const newTab = window.open();
        if (newTab) {
          newTab.document.write(`
            <html>
              <head>
                <meta name="viewport" content="width=device-width,initial-scale=1">
                <title>Save to Photos</title>
                <style>
                  body { margin: 0; background: #000; display: flex; flex-direction: column;
                         align-items: center; justify-content: center; min-height: 100vh; }
                  img { max-width: 100%; border-radius: 16px; }
                  p { color: white; font-family: -apple-system, sans-serif; font-size: 14px;
                      text-align: center; margin-top: 16px; opacity: 0.7; padding: 0 20px; }
                </style>
              </head>
              <body>
                <img src="${dataUrl}" alt="Hey Rate Me critique card" />
                <p>Press and hold the image, then tap "Add to Photos" to save to your gallery</p>
              </body>
            </html>
          `);
          newTab.document.close();
        }
        setShowIOSHint(true);
        setTimeout(() => setShowIOSHint(false), 4000);
      } else {
        // ── Android / Desktop: direct download ───────────────────────────
        const link = document.createElement('a');
        link.download = `heyrate-${persona}-critique.png`;
        link.href = dataUrl;
        link.click();
      }
    } catch (err) {
      console.error('Failed to generate image download:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  // Use resolved base64 URL if available, else original
  const cardProps = {
    imageUrl: resolvedImageUrl || imageUrl,
    rating,
    punchline,
    critique,
    isVideo: isVideo && !resolvedImageUrl,
  };

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

      {/* iOS hint message */}
      {showIOSHint && (
        <div className="w-full max-w-[380px] bg-black/80 text-white text-xs text-center 
                        px-4 py-3 rounded-xl backdrop-blur-sm">
          Press and hold the image in the new tab, then tap "Add to Photos" 📸
        </div>
      )}

      {/* ── Download button — always coral so it's visible on any background ── */}
      <button
        onClick={handleDownload}
        disabled={isDownloading}
        className="flex items-center gap-2 px-7 py-3.5 rounded-full font-bold text-sm
                   text-white transition-all active:scale-95 disabled:opacity-50
                   shadow-lg shadow-[#FF385C]/30"
        style={{
          background: 'linear-gradient(135deg, #FF385C, #FF7043)',
          minWidth: 200,
          justifyContent: 'center',
        }}
      >
        {isDownloading ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
            Preparing...
          </>
        ) : (
          <>
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {isIOS() ? 'Save to Photos' : 'Download to Share'}
          </>
        )}
      </button>
    </div>
  );
}