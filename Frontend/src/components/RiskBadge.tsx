import React from 'react';
import { RiskLevel } from '../data/mockData';

interface RiskBadgeProps {
  level: RiskLevel;
  className?: string;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ level, className = '' }) => {
  const styles: Record<RiskLevel, string> = {
    CRITICAL: 'bg-black text-white border-black',
    HIGH:     'bg-white text-black border-black',
    MEDIUM:   'bg-white text-neutral-600 border-neutral-400',
    LOW:      'bg-white text-neutral-400 border-neutral-300',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 text-[10px] tracking-[0.14em] uppercase font-medium border ${styles[level]} ${className}`}
    >
      {level}
    </span>
  );
};
