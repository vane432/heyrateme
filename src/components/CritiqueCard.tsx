'use client';

import { useRef, useState } from 'react';
import * as htmlToImage from 'html-to-image';

export interface CritiqueCardProps {
  persona: 'vance' | 'kiki' | 'oracle';
  imageUrl: string;
  rating: number;
  punchline: string;
  critique: string;
}

export default function CritiqueCard({
  persona,
  imageUrl,
  rating,
  punchline,
  critique,
}: CritiqueCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // Define distinct Spotify-Wrapped-style themes for each persona
  const themes = {
    vance: {
      wrapper:
        'bg-slate-950 text-cyan-50 font-mono border border-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.3)]',
      header: 'text-cyan-400 uppercase tracking-[0.2em] text-xs',
      imageContainer: 'border-b-2 border-cyan-500',
      imageFilter: 'grayscale contrast-125 brightness-90',
      ratingBadge:
        'bg-cyan-950 border border-cyan-500 text-cyan-400 shadow-[4px_4px_0px_#06b6d4]',
      punchline: 'text-white font-bold text-xl uppercase tracking-tight',
      critique: 'text-cyan-100/80 text-sm leading-relaxed',
      footer: 'text-cyan-600 border-t border-cyan-900/50',
    },
    kiki: {
      wrapper:
        'bg-gradient-to-br from-fuchsia-600 via-pink-500 to-orange-400 text-white font-sans rounded-3xl border-4 border-yellow-300 shadow-[8px_8px_0_#fde047]',
      header: 'text-yellow-300 font-black italic tracking-wider text-sm drop-shadow-md',
      imageContainer: 'border-4 border-yellow-300 rounded-2xl rotate-1 mx-2 mt-2',
      imageFilter: 'saturate-150 contrast-110',
      ratingBadge:
        'bg-yellow-300 text-fuchsia-900 font-black rounded-full -rotate-3 border-2 border-fuchsia-900',
      punchline: 'text-white font-black text-2xl drop-shadow-lg uppercase italic leading-tight',
      critique: 'text-white text-base font-bold leading-tight drop-shadow-sm',
      footer: 'text-yellow-200 font-bold',
    },
    oracle: {
      wrapper:
        'bg-[#FDFBF7] text-emerald-950 font-serif border border-emerald-900/20 rounded-t-full shadow-xl',
      header: 'text-emerald-800 tracking-[0.3em] uppercase text-xs text-center pt-8',
      imageContainer: 'rounded-t-full border-b border-emerald-900/20 mx-4',
      imageFilter: 'sepia-[0.3] contrast-90 brightness-110',
      ratingBadge:
        'bg-emerald-900 text-[#FDFBF7] font-sans tracking-widest text-lg font-light',
      punchline: 'text-emerald-950 font-medium text-2xl italic text-center',
      critique: 'text-emerald-800/80 text-sm leading-loose text-center',
      footer: 'text-emerald-900/40 border-t border-emerald-900/10',
    },
  };

  const theme = themes[persona];

  // Formatter for persona display names
  const displayNames = {
    vance: 'Vance (The Sarcastic Elitist)',
    kiki: 'Kiki (The Chaos Hype-Beast)',
    oracle: 'The Oracle (Fashion Psychoanalyst)',
  };

  const handleDownload = async () => {
    if (!cardRef.current) return;
    
    try {
      setIsDownloading(true);
      
      // Export high-quality PNG (3x pixel density handles retina/high-DPI displays)
      const dataUrl = await htmlToImage.toPng(cardRef.current, {
        quality: 1.0,
        pixelRatio: 3,
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
    <div className="w-full flex flex-col items-center gap-6 p-4">
      {/* Main Shareable Card Container */}
      <div
        ref={cardRef}
        className={`relative flex flex-col w-full max-w-[380px] aspect-[9/16] overflow-hidden ${theme.wrapper}`}
      >
        {/* Header */}
        <div className="p-4 z-10 w-full text-center">
          <span className={theme.header}>Critique by {displayNames[persona]}</span>
        </div>

        {/* Outfit Preview */}
        <div className={`relative w-full aspect-[4/5] overflow-hidden z-0 flex-shrink-0 ${theme.imageContainer}`}>
          <img
            src={imageUrl}
            alt="Outfit Preview"
            className={`w-full h-full object-cover transition-all duration-700 ${theme.imageFilter}`}
          />
        </div>

        {/* Star Rating Badge (Overlapping Image) */}
        <div className="flex justify-center -mt-6 z-20">
          <div className={`px-6 py-2 inline-flex items-center gap-1 ${theme.ratingBadge}`}>
            <span className="text-2xl">{rating.toFixed(1)}</span>
            <span className="text-sm opacity-80 mt-1">/ 5.0 ★</span>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex flex-col flex-1 p-6 gap-4 z-10">
          <h2 className={theme.punchline}>"{punchline}"</h2>
          <p className={theme.critique}>{critique}</p>
        </div>

        {/* Watermark Footer */}
        <div className={`p-4 text-center text-[10px] tracking-widest uppercase mt-auto ${theme.footer}`}>
          heyrate.me • Get Real Feedback
        </div>
      </div>

      {/* Download Button */}
      <button
        onClick={handleDownload}
        disabled={isDownloading}
        className="flex items-center gap-2 px-6 py-3 bg-black text-white font-bold rounded-full hover:bg-gray-800 disabled:opacity-50 transition-all shadow-lg"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        {isDownloading ? 'Saving Image...' : 'Save Image'}
      </button>
    </div>
  );
}