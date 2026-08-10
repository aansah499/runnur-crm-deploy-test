import { Award } from 'lucide-react';

type LTVBadgeProps = {
  band?: string | null;
  className?: string;
};

export default function LTVBadge({ band, className = '' }: LTVBadgeProps) {
  if (!band) return null;

  let colorClasses = '';
  switch (band.toLowerCase()) {
    case 'bronze':
      colorClasses = 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      break;
    case 'silver':
      colorClasses = 'bg-zinc-300/10 text-zinc-300 border-zinc-300/20';
      break;
    case 'gold':
      colorClasses = 'bg-brand/10 text-brand border-brand/20';
      break;
    case 'platinum':
      colorClasses = 'bg-white/10 text-white border-white/20 shadow-[0_0_10px_rgba(255,255,255,0.2)]';
      break;
    default:
      return null;
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium ${colorClasses} ${className}`}>
      <Award className="w-3.5 h-3.5" />
      {band}
    </span>
  );
}
