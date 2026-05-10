import { HeroSection } from './components/HeroSection';
import { AudienceSection } from './components/AudienceSection';
import { HowItWorksSection } from './components/HowItWorksSection';
import { PricingSection } from './components/PricingSection';
import { LandingFooter } from './components/LandingFooter';

export function LandingPage() {
  return (
    <div className="-mt-px">
      <HeroSection />
      <AudienceSection />
      <HowItWorksSection />
      <PricingSection />
      <LandingFooter />
    </div>
  );
}
