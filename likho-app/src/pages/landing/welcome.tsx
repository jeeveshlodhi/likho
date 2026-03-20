import { useRef, useEffect } from 'react';
import { useLocation } from 'react-router';
import { isTauri } from '@/utils/platform';
import TauriWelcome from '@/components/landing/TauriWelcome';
import Navbar from '@/components/landing/Navbar';
import Hero from '@/components/landing/Hero';
import Problem from '@/components/landing/Problem';
import Solution from '@/components/landing/Solution';
import FeatureNotes from '@/components/landing/FeatureNotes';
import FeatureKanban from '@/components/landing/FeatureKanban';
import FeatureCanvas from '@/components/landing/FeatureCanvas';
import TemplateGallery from '@/components/landing/TemplateGallery';
import ProductPreview from '@/components/landing/ProductPreview';
import UseCases from '@/components/landing/UseCases';
import FinalCTA from '@/components/landing/FinalCTA';
import Footer from '@/components/landing/Footer';

const Welcome = () => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  // Handle hash scrolling when navigating from other pages
  useEffect(() => {
    if (location.hash) {
      const element = document.querySelector(location.hash);
      if (element) {
        // Small delay to ensure DOM is ready
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }
  }, [location]);

  // Tauri (desktop app) gets a simple, focused welcome screen
  if (isTauri()) {
    return (
      <div className="h-full overflow-hidden" style={{ backgroundColor: '#ffffff' }}>
        <TauriWelcome />
      </div>
    );
  }

  // Browser gets the full landing page with all sections
  return (
    <div ref={scrollContainerRef} className="h-full overflow-y-auto overflow-x-hidden scroll-smooth" style={{ backgroundColor: '#ffffff' }}>
      <Navbar scrollContainerRef={scrollContainerRef} />
      <main>
        <Hero />
        <Problem />
        <Solution />
        <FeatureNotes />
        <FeatureKanban />
        <FeatureCanvas />
        <TemplateGallery />
        <ProductPreview />
        <UseCases />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
};

export default Welcome;
