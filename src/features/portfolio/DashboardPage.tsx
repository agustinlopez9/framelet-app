import { DashboardOverview } from './DashboardOverview';
import { ImageList } from './ImageList';

export function DashboardPage() {
  return (
    <div className="space-y-6">
      <DashboardOverview />
      <ImageList />
    </div>
  );
}
