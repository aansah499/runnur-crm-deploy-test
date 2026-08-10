import DashboardInsights from '@/components/DashboardInsights';

export const revalidate = 0;

export default function InsightsPage() {
  return (
    <div className="space-y-8">
      <DashboardInsights />
    </div>
  );
}
