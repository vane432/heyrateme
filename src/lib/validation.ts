// Content validation utilities for Phase 1 anti-spam measures

// File size limits
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
export const MAX_VIDEO_SIZE = 200 * 1024 * 1024; // 200MB
export const MAX_VIDEO_DURATION = 5 * 60; // 5 minutes in seconds

// Caption limits
export const MAX_CAPTION_LENGTH = 500;
export const MAX_URL_COUNT = 1;

// Supported file types
export const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
export const SUPPORTED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime']; // quicktime = .mov

// Spam patterns
const SPAM_DOMAINS = ['bit.ly', 't.co', 'tinyurl.com', 'goo.gl'];

export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Validate file type and size
 */
export function validateMediaFile(
  file: File,
  mediaType: 'image' | 'video'
): ValidationError | null {
  const supportedTypes = mediaType === 'image' ? SUPPORTED_IMAGE_TYPES : SUPPORTED_VIDEO_TYPES;

  // Check file type
  if (!supportedTypes.includes(file.type)) {
    return {
      field: 'file',
      message: `Unsupported ${mediaType} format. Supported: ${
        mediaType === 'image' ? 'JPEG, PNG, WebP, GIF' : 'MP4, WebM, MOV'
      }`
    };
  }

  // Check file size
  const maxSize = mediaType === 'image' ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE;
  if (file.size > maxSize) {
    const maxMB = Math.round(maxSize / (1024 * 1024));
    return {
      field: 'file',
      message: `${mediaType === 'image' ? 'Image' : 'Video'} must be under ${maxMB}MB`
    };
  }

  return null;
}

/**
 * Validate video duration (client-side check using HTML5 video element)
 */
export async function validateVideoDuration(file: File): Promise<ValidationError | null> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';

    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);

      if (video.duration > MAX_VIDEO_DURATION) {
        const maxMinutes = Math.floor(MAX_VIDEO_DURATION / 60);
        resolve({
          field: 'video',
          message: `Video must be under ${maxMinutes} minutes`
        });
      } else {
        resolve(null);
      }
    };

    video.onerror = () => {
      resolve({
        field: 'video',
        message: 'Could not read video file. Please try another file.'
      });
    };

    video.src = URL.createObjectURL(file);
  });
}

/**
 * Validate caption for spam patterns
 */
export function validateCaption(caption: string): ValidationError | null {
  const trimmed = caption.trim();

  // Empty check
  if (!trimmed) {
    return { field: 'caption', message: 'Caption cannot be empty' };
  }

  // Length check
  if (trimmed.length > MAX_CAPTION_LENGTH) {
    return {
      field: 'caption',
      message: `Caption must be ${MAX_CAPTION_LENGTH} characters or less`
    };
  }

  // URL count check
  const urlPattern = /(https?:\/\/[^\s]+)/gi;
  const urls = trimmed.match(urlPattern) || [];

  if (urls.length > MAX_URL_COUNT) {
    return {
      field: 'caption',
      message: `Only 1 link allowed per post`
    };
  }

  // Spam domain check (shortened URL services often used for spam)
  const hasSpamDomain = urls.some(url =>
    SPAM_DOMAINS.some(domain => url.toLowerCase().includes(domain))
  );

  if (hasSpamDomain) {
    return {
      field: 'caption',
      message: 'Shortened URL services (bit.ly, t.co, etc.) are not allowed'
    };
  }

  // Repeated character spam detection (e.g., "RATE MEEEEEEE!!!!")
  // 5+ repeated characters is a strong spam signal
  const repeatedPattern = /(.)\1{4,}/g;

  if (repeatedPattern.test(trimmed)) {
    return {
      field: 'caption',
      message: 'Please avoid excessive repeated characters'
    };
  }

  return null;
}
