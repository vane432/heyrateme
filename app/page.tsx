import LandingNavbar from '@/components/landing/LandingNavbar';
import HeroSection from '@/components/landing/HeroSection';
import HowItWorks from '@/components/landing/HowItWorks';
import Features from '@/components/landing/Features';
import Categories from '@/components/landing/Categories';
import TopPostsPreview from '@/components/landing/TopPostsPreview';
import CTASection from '@/components/landing/CTASection';
import Footer from '@/components/landing/Footer';

export default function LandingPage() {
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
