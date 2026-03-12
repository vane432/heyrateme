'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import LandingNavbar from '@/components/landing/LandingNavbar';
import HeroSection from '@/components/landing/HeroSection';
import HowItWorks from '@/components/landing/HowItWorks';
import Features from '@/components/landing/Features';
import Categories from '@/components/landing/Categories';
import TopPostsPreview from '@/components/landing/TopPostsPreview';
import CTASection from '@/components/landing/CTASection';
import Footer from '@/components/landing/Footer';
import FeedView from '@/components/FeedView';

export default function LandingPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    // If Supabase redirected back with tokens in the hash (www vs non-www mismatch),
    // forward to the auth callback page to handle the session properly
    if (typeof window !== 'undefined' && window.location.hash.includes('access_token')) {
      router.replace('/auth/callback' + window.location.hash);
      return;
    }

    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsLoggedIn(!!user);
    });
  }, [router]);

  // Still checking auth
  if (isLoggedIn === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600" />
      </div>
    );
  }

  // Logged-in user sees the feed
  if (isLoggedIn) {
    return <FeedView />;
  }

  // Guest sees the landing page
  return (
    <div className="min-h-screen bg-white">
      <LandingNavbar />
      <HeroSection />
      <HowItWorks />
      <Features />
      <Categories />
      <TopPostsPreview />
      <CTASection />
      <Footer />
    </div>
  );
}

