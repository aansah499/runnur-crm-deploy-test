import { MapPin } from 'lucide-react';

type Props = {
  name?: string | null;
  addressKey?: string | null;
  showBadge?: boolean;
};

export default function CustomerNameDisplay({ name, addressKey, showBadge = true }: Props) {
  if (name) {
    return <span className="font-medium text-white">{name}</span>;
  }

  return (
    <div className="flex flex-col gap-1">
      <span className="font-medium text-white flex items-center gap-1.5">
        <MapPin className="w-3.5 h-3.5 text-zinc-500" />
        {addressKey || 'Unknown Customer'}
      </span>
      {showBadge && (
        <span className="inline-flex w-fit items-center justify-center px-1.5 py-0.5 rounded-sm bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[10px] font-medium uppercase tracking-wider">
          Address-based record
        </span>
      )}
    </div>
  );
}
