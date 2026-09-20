import React from 'react';

interface MetricProps {
  value: string | number;
  label: string;
  highlight?: boolean;
}

export const Metric: React.FC<MetricProps> = ({ value, label, highlight = false }) => {
  const displayValue =
    typeof value === 'number' ? String(value).padStart(2, '0') : value;

  return (
    <div className={`flex flex-col gap-1.5 ${highlight ? 'bg-[#D3FD50] px-5 py-4' : ''}`}>
      <span className="text-5xl md:text-6xl font-medium tracking-tight leading-none tabular-nums text-black">
        {displayValue}
      </span>
      <span className="text-[10px] tracking-[0.22em] uppercase text-neutral-500 font-medium">
        {label}
      </span>
    </div>
  );
};
