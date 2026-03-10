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
  return (
    <div className="h-full overflow-y-auto overflow-x-hidden bg-background scroll-smooth">
      <Navbar />
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
