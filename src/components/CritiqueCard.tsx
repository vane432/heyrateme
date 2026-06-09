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

  const isVideo = imageUrl.match(/\.(mp4|webm|mov|quicktime)$/i) || imageUrl.startsWith('data:video/');

  // Define distinct Spotify-Wrapped-style themes for each persona
  const themes = {
    vance: {
      wrapper: 'bg-gradient-to-br from-gray-900 via-gray-800 to-black text-gray-100 font-sans tracking-wide border border-gray-700 shadow-2xl',
      header: 'text-gray-400 uppercase tracking-widest text-xs font-bold',
      imageContainer: 'border-b border-gray-800',
      imageFilter: '', // Removed harsh filters
      ratingBadge: 'bg-black/80 backdrop-blur-md border border-gray-700 text-white shadow-lg rounded-full',
      punchline: 'text-white font-bold tracking-wide text-xl leading-tight',
      critique: 'text-gray-300 text-sm leading-relaxed',
      footer: 'text-gray-500 border-t border-gray-800/50',
      hashtag: 'bg-gray-800 text-gray-300'
    },
    kiki: {
      wrapper: 'bg-gradient-to-tr from-rose-100 via-teal-50 to-purple-100 text-gray-900 font-sans tracking-wide rounded-3xl shadow-xl',
      header: 'text-purple-500 font-bold tracking-widest text-xs uppercase',
      imageContainer: 'rounded-2xl mx-3 mt-3 overflow-hidden shadow-sm border border-white/50',
      imageFilter: '', // Removed harsh filters
      ratingBadge: 'bg-white/90 backdrop-blur-sm text-purple-600 font-black rounded-full shadow-lg border border-purple-100',
      punchline: 'text-gray-900 font-bold tracking-wide text-xl leading-tight',
      critique: 'text-gray-700 text-sm leading-relaxed font-semibold',
      footer: 'text-purple-400',
      hashtag: 'bg-purple-200 text-purple-700'
    },
    oracle: {
      wrapper: 'bg-white text-gray-900 font-sans tracking-wide border-[6px] border-gray-100 shadow-2xl rounded-sm',
      header: 'text-gray-400 tracking-[0.2em] uppercase text-xs font-bold text-center pt-6',
      imageContainer: 'border-b border-gray-100 mx-6',
      imageFilter: '', // Removed harsh filters
      ratingBadge: 'bg-gray-900 text-white font-sans tracking-wider text-lg font-medium px-6 rounded-none',
      punchline: 'text-gray-900 font-bold tracking-wide text-xl text-center leading-snug',
      critique: 'text-gray-600 text-sm leading-relaxed text-center',
      footer: 'text-gray-400 border-t border-gray-100',
      hashtag: 'bg-gray-100 text-gray-600'
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
          {isVideo ? (
            <video
              src={imageUrl}
              autoPlay
              loop
              muted
              playsInline
              className={`w-full h-full object-cover transition-all duration-700 ${theme.imageFilter}`}
            />
          ) : (
            <img
              src={imageUrl}
              alt="Outfit Preview"
              crossOrigin="anonymous"
              className={`w-full h-full object-cover transition-all duration-700 ${theme.imageFilter}`}
            />
          )}
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

        {/* Branding Footer */}
        <div className={`p-4 flex items-center justify-between mt-auto ${theme.footer}`}>
          <div className="flex items-center gap-2 font-bold tracking-wide text-sm">
            <img src="/logo.png" alt="heyrate.me logo" className="h-6 w-auto object-contain" crossOrigin="anonymous" />
            <span>heyrate.me</span>
          </div>
          <span className={`px-2 py-1 rounded text-[10px] font-bold tracking-wide uppercase ${theme.hashtag}`}>
            #heyrateme
          </span>
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
        {isDownloading ? 'Downloading...' : 'Download to Share'}
      </button>
    </div>
  );
}