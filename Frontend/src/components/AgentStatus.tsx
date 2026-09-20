import React from 'react';
import { CheckCircle2, Loader2, AlertTriangle, RefreshCw } from 'lucide-react';

export type AgentState = 'complete' | 'running' | 'waiting' | 'failed' | 'retrying';

interface AgentStatusProps {
  index: number;
  name: string;
  state: AgentState;
}

const STATE_LABELS: Record<AgentState, string> = {
  complete: 'COMPLETE',
  running:  'RUNNING',
  retrying: 'RETRYING',
  failed:   'FAILED',
  waiting:  'WAITING',
};

const STATE_BG: Record<AgentState, string> = {
  complete: '',
  running:  'bg-[#D3FD50]',
  retrying: 'bg-[#D3FD50]',
  failed:   'bg-neutral-50',
  waiting:  '',
};

const STATE_TEXT: Record<AgentState, string> = {
  complete: 'text-black',
  running:  'text-black',
  retrying: 'text-black',
  failed:   'text-black',
  waiting:  'text-neutral-400',
};

export const AgentStatus: React.FC<AgentStatusProps> = ({ index, name, state }) => {
  const num = String(index).padStart(2, '0');

  const Icon = () => {
    switch (state) {
      case 'complete':
        return <CheckCircle2 className="w-4 h-4 text-black shrink-0" />;
      case 'running':
        return <Loader2 className="w-4 h-4 animate-spin text-black shrink-0" />;
      case 'retrying':
        return <RefreshCw className="w-4 h-4 animate-spin text-black shrink-0" />;
      case 'failed':
        return <AlertTriangle className="w-4 h-4 text-black shrink-0" />;
      case 'waiting':
        return (
          <span className="w-4 h-4 border border-neutral-300 inline-block shrink-0" />
        );
    }
  };

  return (
    <div
      className={`flex items-center gap-4 px-5 py-3.5 border-b border-neutral-100 last:border-0 transition-colors ${STATE_BG[state]}`}
    >
      {/* Step number */}
      <span className="text-[10px] tracking-[0.18em] text-neutral-400 font-medium tabular-nums w-5 shrink-0">
        {num}
      </span>

      {/* Agent name */}
      <span className={`text-xs tracking-[0.12em] uppercase font-medium flex-1 ${STATE_TEXT[state]}`}>
        {name}
      </span>

      {/* State indicator */}
      <div className="flex items-center gap-2 shrink-0">
        <Icon />
        <span
          className={`text-[10px] tracking-[0.12em] uppercase font-medium ${
            state === 'waiting' ? 'text-neutral-400' : 'text-black'
          }`}
        >
          {STATE_LABELS[state]}
        </span>
      </div>
    </div>
  );
};
