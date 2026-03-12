'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LandingNavbar from '@/components/landing/LandingNavbar';
import HeroSection from '@/components/landing/HeroSection';
import HowItWorks from '@/components/landing/HowItWorks';
import Features from '@/components/landing/Features';
import Categories from '@/components/landing/Categories';
import TopPostsPreview from '@/components/landing/TopPostsPreview';
import CTASection from '@/components/landing/CTASection';
import Footer from '@/components/landing/Footer';

export default function LandingPage() {
  const router = useRouter();

  useEffect(() => {
    // If Supabase redirected back with tokens in the hash (www vs non-www mismatch),
    // forward to the auth callback page to handle the session properly
    if (typeof window !== 'undefined' && window.location.hash.includes('access_token')) {
      router.replace('/auth/callback' + window.location.hash);
    }
  }, [router]);

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

