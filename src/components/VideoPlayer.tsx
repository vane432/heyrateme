'use client';

import { useRef, useState, useEffect } from 'react';

interface VideoPlayerProps {
  src: string;
  className?: string;
  duration?: number;
}

export default function VideoPlayer({ src, className = '', duration }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPlayButton, setShowPlayButton] = useState(true);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Use Intersection Observer to play/pause based on visibility
  useEffect(() => {
    const video = videoRef.current;
    const container = containerRef.current;
    if (!video || !container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && hasInteracted) {
            video.play().catch(() => {});
          } else {
            video.pause();
          }
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(container);

    return () => observer.disconnect();
  }, [hasInteracted]);

  // Try to autoplay on load
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const tryAutoplay = async () => {
      try {
        await video.play();
        setIsPlaying(true);
        setShowPlayButton(false);
        setHasInteracted(true);
      } catch {
        // Autoplay blocked - show play button
        setShowPlayButton(true);
      }
    };

    // Small delay to ensure video is loaded
    const timer = setTimeout(tryAutoplay, 100);
    return () => clearTimeout(timer);
  }, []);

  const handlePlayClick = async (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const video = videoRef.current;
    if (!video) return;

    try {
      await video.play();
      setIsPlaying(true);
      setShowPlayButton(false);
      setHasInteracted(true);
    } catch (err) {
      console.error('Video play failed:', err);
    }
  };

  const handleVideoClick = (e: React.MouseEvent) => {
    // Don't interfere with the Link navigation
    if (!isPlaying) {
      e.preventDefault();
      handlePlayClick(e);
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full object-cover"
        muted
        playsInline
        loop
        preload="auto"
        onClick={handleVideoClick}
        onPlay={() => {
          setIsPlaying(true);
          setShowPlayButton(false);
        }}
        onPause={() => setIsPlaying(false)}
        onMouseEnter={() => {
          if (hasInteracted && videoRef.current) {
            videoRef.current.play().catch(() => {});
          }
        }}
        onMouseLeave={() => {
          if (videoRef.current) {
            videoRef.current.pause();
            videoRef.current.currentTime = 0;
          }
        }}
      />

      {/* Play button overlay */}
      {showPlayButton && !isPlaying && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-black/20 cursor-pointer"
          onClick={handlePlayClick}
          onTouchEnd={handlePlayClick}
        >
          <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
            <svg className="w-8 h-8 text-gray-900 ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      )}

      {/* Duration badge */}
      {duration && (
        <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
          {Math.floor(duration / 60)}:{String(duration % 60).padStart(2, '0')}
        </div>
      )}
    </div>
  );
}
