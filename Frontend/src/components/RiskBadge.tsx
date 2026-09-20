import React from 'react';
import { RiskLevel } from '../data/mockData';

interface RiskBadgeProps {
  level: RiskLevel;
  className?: string;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ level, className = '' }) => {
  const getBadgeStyles = (lvl: RiskLevel) => {
    switch (lvl) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-900 border-red-300 font-semibold';
      case 'HIGH':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'MEDIUM':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'LOW':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getBadgeStyles(
        level
      )} ${className}`}
    >
      {level}
    </span>
  );
};
