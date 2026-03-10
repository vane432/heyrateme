'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function LandingNavbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-b border-gray-200 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="text-2xl font-bold text-gray-900">
            HeyRateMe
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#how-it-works" className="text-gray-700 hover:text-gray-900 transition">
              How It Works
            </a>
            <a href="#top-posts" className="text-gray-700 hover:text-gray-900 transition">
              Top Posts
            </a>
            <Link href="/login" className="text-gray-700 hover:text-gray-900 transition">
              Sign In
            </Link>
            <Link
              href="/login"
              className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {isOpen && (
          <div className="md:hidden py-4 space-y-4">
            <a
              href="#how-it-works"
              className="block text-gray-700 hover:text-gray-900"
              onClick={() => setIsOpen(false)}
            >
              How It Works
            </a>
            <a
              href="#top-posts"
              className="block text-gray-700 hover:text-gray-900"
              onClick={() => setIsOpen(false)}
            >
              Top Posts
            </a>
            <Link href="/login" className="block text-gray-700 hover:text-gray-900">
              Sign In
            </Link>
            <Link
              href="/login"
              className="block bg-black text-white px-6 py-2 rounded-lg text-center hover:bg-gray-800"
            >
              Get Started
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
