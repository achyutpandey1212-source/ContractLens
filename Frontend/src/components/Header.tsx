import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="border-b border-neutral-200 bg-white sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-neutral-900 font-semibold text-lg hover:text-neutral-700">
          <ShieldCheck className="w-5 h-5 text-neutral-700" />
          <span>ContractLens</span>
        </Link>
        <span className="text-xs text-neutral-500 font-mono uppercase tracking-wider">Phase 1 Prototype</span>
      </div>
    </header>
  );
};
