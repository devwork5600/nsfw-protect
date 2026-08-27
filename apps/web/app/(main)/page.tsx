import CTASection from './components/sections/CTA-section';
import FeatureSection from './components/sections/Feature-section';
import HeroSection from './components/sections/Hero-section';
import QualitySection from './components/sections/Quality-section';
import { TestingSection } from './components/sections/Testing-section';

export default function Home() {
  return (
    <>
      <HeroSection />
      <FeatureSection />
      <TestingSection />
      <QualitySection />
      <CTASection />
    </>
  );
}
