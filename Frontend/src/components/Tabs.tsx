import React from 'react';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
}

interface TabsProps {
  tabs: TabItem[];
  active: string;
  onChange: (id: string) => void;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, active, onChange }) => {
  return (
    <div className="flex border-b border-black">
      {tabs.map(tab => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`
              px-5 py-3 text-[11px] tracking-[0.16em] uppercase font-medium
              transition-colors cursor-pointer border-b-2 -mb-[1px]
              ${isActive
                ? 'border-black text-black bg-[#D3FD50]'
                : 'border-transparent text-neutral-500 hover:text-black hover:bg-neutral-50'
              }
            `}
          >
            {tab.label}
            {tab.count !== undefined && ` (${tab.count})`}
          </button>
        );
      })}
    </div>
  );
};
