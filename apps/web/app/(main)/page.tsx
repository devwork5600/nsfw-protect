import NetworkBackground from './components/background/NetworkBackground';
import CTASection from './components/sections/CTA-section';
import FeatureSection from './components/sections/Feature-section';
import HeroSection from './components/sections/Hero-section';
import QualitySection from './components/sections/Quality-section';
import { TestingSection } from './components/sections/Testing-section';

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center min-h-screen scrollbar-hide">
      <NetworkBackground />
      <HeroSection />
      <FeatureSection />
      <QualitySection />
      <TestingSection />
      <CTASection />
    </div>
  );
}
