interface KPICardProps {
  label: string;
  value: string | number;
  sub?: string;
  highlight?: boolean;
  onClick?: () => void;
}

export default function KPICard({
  label,
  value,
  sub,
  highlight,
  onClick,
}: KPICardProps) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-3xl p-6 border shadow-sm transition-all hover:border-green-200 hover:shadow-lg hover:shadow-green-900/[0.03] flex flex-col justify-center h-40${
        onClick ? ' cursor-pointer active:scale-[0.98]' : ''
      }`}
    >
      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">
        {label}
      </span>
      <div className="flex items-baseline gap-2">
        <span
          className={`text-4xl font-black tracking-tighter ${
            highlight ? 'text-green-600' : 'text-gray-900'
          }`}
        >
          {value}
        </span>
      </div>
      {sub && (
        <p className="text-xs font-medium text-gray-400 mt-2 uppercase tracking-wide">
          {sub}
        </p>
      )}
    </div>
  );
}
