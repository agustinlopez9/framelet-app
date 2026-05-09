import { HeroSection } from './sections/HeroSection';
import { AudienceSection } from './sections/AudienceSection';
import { HowItWorksSection } from './sections/HowItWorksSection';
import { PricingSection } from './sections/PricingSection';
import { LandingFooter } from './sections/LandingFooter';

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
