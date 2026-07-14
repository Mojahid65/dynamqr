import { HeroSection } from '../components/blocks/hero-section-1';

const Landing = () => {
  return (
    <div className="min-h-screen bg-background text-foreground antialiased selection:bg-foreground selection:text-background">
      <HeroSection />
    </div>
  );
};

export default Landing;
