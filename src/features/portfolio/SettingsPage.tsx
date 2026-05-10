import { usePortfolioContext } from '@/context/PortfolioContext';
import { HandleCard } from './components/SettingsPage/HandleCard';
import { MetadataCard } from './components/SettingsPage/MetadataCard';
import { ThemeCard } from './components/SettingsPage/ThemeCard';
import { FontCard } from './components/SettingsPage/FontCard';
import { SocialLinksCard } from './components/SettingsPage/SocialLinksCard';

export function SettingsPage() {
  const { portfolio, user } = usePortfolioContext();
  return (
    <div className="space-y-6">
      <HandleCard portfolio={portfolio} user={user} />
      <MetadataCard portfolio={portfolio} />
      <ThemeCard portfolio={portfolio} />
      <FontCard portfolio={portfolio} />
      <SocialLinksCard portfolio={portfolio} />
    </div>
  );
}
