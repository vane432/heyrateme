'use client';

import { useRef, useState } from "react";
import * as htmlToImage from 'html-to-image';

export interface CritiqueCardProps {
  persona: 'vance' | 'kiki' | 'oracle';
  imageUrl: string;
  rating: number;
  punchline: string;
  critique: string;
  onClose?: () => void;
}

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

  const isVideo = imageUrl.match(/\.(mp4|webm|mov|quicktime)$/i) || imageUrl.startsWith('data:video/');

  const themes = {
    vance: {
      wrapper: 'bg-gradient-to-b from-[#0F0F12] via-[#050507] to-black text-white border border-zinc-800 shadow-2xl rounded-3xl',
      header: 'text-zinc-500 uppercase tracking-[0.3em] text-[10px] font-black',
      imageContainer: 'border border-zinc-800 rounded-2xl bg-black p-1',
      ratingBadge: 'bg-zinc-900 border border-zinc-700 text-white font-mono font-bold rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.5)]',
      punchline: 'text-red-500 font-black tracking-tight text-xl leading-tight uppercase border-l-4 border-red-500 pl-3',
      critique: 'text-zinc-300 text-sm leading-relaxed font-normal tracking-wide',
      footer: 'border-t border-zinc-900',
      hashtag: 'bg-zinc-900 text-zinc-400 border border-zinc-800'
    },
    kiki: {
      wrapper: 'bg-gradient-to-br from-[#FF3B96] via-[#9146FF] to-[#00F0FF] text-white shadow-2xl rounded-3xl',
      header: 'text-yellow-300 font-black tracking-widest text-[11px] uppercase drop-shadow',
      imageContainer: 'border-2 border-white/40 rounded-2xl shadow-inner',
      ratingBadge: 'bg-yellow-300 text-black font-black rounded-full shadow-md rotate-[-2deg]',
      punchline: 'text-white font-black tracking-wide text-2xl uppercase italic drop-shadow-md',
      critique: 'text-white font-bold text-sm leading-snug drop-shadow-sm',
      footer: 'border-t border-white/20',
      hashtag: 'bg-black/30 text-white'
    },
    oracle: {
      wrapper: 'bg-gradient-to-b from-[#FAF8F5] to-[#F3EDE2] text-[#1C1C1C] border border-[#DCD6CD] shadow-2xl rounded-3xl',
      header: 'text-[#8A8477] tracking-[0.3em] uppercase text-[10px] font-bold',
      imageContainer: 'border border-[#DCD6CD] rounded-2xl bg-white p-1.5 shadow-sm',
      ratingBadge: 'bg-[#1C1C1C] text-[#FAF8F5] font-serif tracking-widest text-xs font-semibold rounded-md shadow-md',
      punchline: 'text-[#1C1C1C] font-serif text-xl italic font-semibold leading-snug text-center px-2 border-y border-[#DCD6CD]/60 py-2',
      critique: 'text-[#4A4A4A] text-sm leading-relaxed font-serif text-center px-1',
      footer: 'border-t border-[#DCD6CD]',
      hashtag: 'bg-[#1C1C1C]/5 text-[#1C1C1C] border border-[#1C1C1C]/10'
    },
  };

  const theme = themes[persona];

  const displayNames = {
    vance: 'VANCE (THE SARCASTIC ELITIST)',
    kiki: 'KIKI (THE CHAOS HYPE-BEAST)',
    oracle: 'THE ORACLE (FASHION PSYCHOANALYST)',
  };

  const handleDownload = async () => {
    if (!cardRef.current) return;
    try {
      setIsDownloading(true);
      const dataUrl = await htmlToImage.toPng(cardRef.current, {
        quality: 0.95,
        pixelRatio: 2,
        skipFonts: true,
      });
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

  return (
    <div className="w-full relative flex flex-col items-center gap-4 p-4 pt-12">
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-2 right-4 text-white/50 hover:text-white transition-all font-semibold uppercase text-xs p-2 z-50 flex items-center gap-1"
        >
          ✕ Close
        </button>
      )}

      {/* Main Container Shell */}
      <div
        ref={cardRef}
        className={`relative flex flex-col w-full max-w-[370px] min-h-[660px] p-5 justify-between box-border ${theme.wrapper}`}
      >
        {/* Style Report Header */}
        <div className="w-full text-center pb-3">
          <span className={theme.header}>STYLE REPORT // {displayNames[persona]}</span>
        </div>

        {/* Unified Outfit Preview Frame - Force-loaded on ALL personas */}
        <div className={`relative w-full aspect-[1/1] overflow-hidden flex-shrink-0 mb-4 ${theme.imageContainer}`}>
          {isVideo ? (
            <video src={imageUrl} autoPlay loop muted playsInline crossOrigin="anonymous" className="w-full h-full object-cover" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt="Outfit Preview" crossOrigin="anonymous" className="w-full h-full object-cover" />
          )}
          
          {/* Rating Numerical Badge Layer */}
          <div className="absolute bottom-3 right-3 shadow-xl z-20">
            <div className={`px-4 py-1.5 inline-flex items-center gap-0.5 font-bold text-sm ${theme.ratingBadge}`}>
              <span>{rating.toFixed(1)}</span>
              <span className="text-[10px] opacity-60 font-medium">/5.0 ★</span>
            </div>
          </div>
        </div>

        {/* Structured Critique Copy Area */}
        <div className="flex flex-col gap-4 flex-1 pb-4 justify-center">
          <h2 className={theme.punchline}>&quot;{punchline}&quot;</h2>
          <p className={theme.critique}>{critique}</p>
        </div>

        {/* Global Unified Logo Footer */}
        <div className={`pt-4 flex items-center justify-between ${theme.footer}`}>
          <div className="flex items-center gap-2 font-black tracking-tight text-xs uppercase opacity-90">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="logo" className="h-5 w-5 object-contain rounded bg-white" crossOrigin="anonymous" />
            <span className={persona === 'oracle' ? 'text-[#1C1C1C]' : 'text-white'}>heyrate.me</span>
          </div>
          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-wider ${theme.hashtag}`}>
            #heyrateme
          </span>
        </div>
      </div>

      {/* Share Exporter Button */}
      <button
        onClick={handleDownload}
        disabled={isDownloading}
        className="flex items-center gap-2 px-6 py-2.5 bg-white text-black hover:bg-white/90 disabled:opacity-50 transition-all shadow-xl font-bold rounded-xl text-sm"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        {isDownloading ? 'Generating PNG...' : 'Download Card'}
      </button>
    </div>
  );
}
