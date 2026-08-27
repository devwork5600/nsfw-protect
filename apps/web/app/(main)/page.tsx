import { ForceField } from '@/components/canvasui/ForceField';
import CTASection from './components/sections/CTA-section';
import FeatureSection from './components/sections/Feature-section';
import HeroSection from './components/sections/Hero-section';
import QualitySection from './components/sections/Quality-section';
import { TestingSection } from './components/sections/Testing-section';

export default function Home() {
  return (
    // h-dvh (not min-h-screen): ForceField's content wrapper is height:100% +
    // overflow:auto, which needs a definite height on this parent to resolve
    // against. Page scrolling still works as one continuous gesture: this
    // inner overflow:auto div scroll-chains to the window once it hits its
    // own bottom, so the footer below it still scrolls into view normally.
    <ForceField
      className="flex flex-col flex-1 items-center justify-center h-dvh scrollbar-hide"
      shape="hexagon"
      color={[0.15, 0.68, 1]}
      cellScale={26}
      gridReveal="always"
      gridOpacity={0.2}
      hoverGlow={0}
      hoverCharge={0}
      clickRipples={false}
      refraction={0}
      opacity={0.35}
    >
      <HeroSection />
      <FeatureSection />
      <TestingSection />
      <QualitySection />
      <CTASection />
    </ForceField>
  );
}
