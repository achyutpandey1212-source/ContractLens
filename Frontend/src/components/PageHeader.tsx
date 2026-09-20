import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  backTo?: string;
  backLabel?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  backTo,
  backLabel = 'BACK',
}) => {
  return (
    <div className="space-y-6">
      {backTo && (
        <Link
          to={backTo}
          className="inline-flex items-center gap-1.5 text-[11px] tracking-[0.14em] uppercase text-neutral-500 hover:text-black transition-colors"
        >
          <ArrowLeft className="w-3 h-3" />
          {backLabel}
        </Link>
      )}
      <div>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight leading-none text-black">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-3 text-sm text-neutral-500 leading-relaxed">{subtitle}</p>
        )}
      </div>
    </div>
  );
};
