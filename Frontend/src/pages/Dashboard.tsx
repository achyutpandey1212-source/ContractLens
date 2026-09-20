import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { api, ContractListItem } from '../services/api';
import { Metric } from '../components/Metric';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [contracts, setContracts] = useState<ContractListItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    api
      .getContracts()
      .then((data) => {
        if (isMounted) {
          setContracts(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setError('Failed to load contracts.');
          setLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr)
        .toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })
        .toUpperCase();
    } catch {
      return dateStr.toUpperCase();
    }
  };

  /* Computed metrics from real data */
  const total = contracts.length;
  const highRisk = contracts.filter(
    (c) => c.riskLevel === 'HIGH' || c.riskLevel === 'CRITICAL'
  ).length;
  const active = total - highRisk;

  const riskTextStyle = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return 'text-black font-semibold';
      case 'HIGH':
        return 'text-neutral-900 font-medium';
      case 'MEDIUM':
        return 'text-neutral-600';
      case 'LOW':
        return 'text-neutral-400';
      default:
        return 'text-neutral-500';
    }
  };

  /* Time-aware greeting */
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'GOOD MORNING.' : hour < 18 ? 'GOOD AFTERNOON.' : 'GOOD EVENING.';

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-12 py-12 md:py-16">

      {/* ── Headline ─────────────────────────────────── */}
      <div className="mb-10 md:mb-14">
        <h1 className="text-4xl md:text-5xl lg:text-[3.5rem] font-medium tracking-tight leading-[1.1] text-black">
          {greeting}
          <br />
          <span className="text-neutral-400">YOUR CONTRACTS ARE UNDER CONTROL.</span>
        </h1>
      </div>

      <hr className="border-black mb-10" />

      {/* ── Metrics Strip ─────────────────────────────── */}
      {!loading && !error && (
        <div className="flex flex-wrap items-start gap-12 md:gap-20 mb-12">
          <Metric value={total}   label="Total Contracts" />
          <Metric value={highRisk} label="High Risk"       />
          <Metric value={active}  label="Active Contracts" />
        </div>
      )}

      {/* Loading metric placeholder */}
      {loading && (
        <div className="flex items-center gap-3 mb-12 text-neutral-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-[11px] tracking-[0.2em] uppercase">LOADING...</span>
        </div>
      )}

      <hr className="border-neutral-200 mb-10" />

      {/* ── Recent Contracts ──────────────────────────── */}
      <div>
        {/* Section header */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-[11px] tracking-[0.24em] uppercase text-neutral-500 font-medium">
            RECENT CONTRACTS
          </h2>
          <button
            onClick={() => navigate('/upload')}
            className="text-[11px] tracking-[0.16em] uppercase border border-black px-4 py-2 text-black bg-white hover:bg-[#D3FD50] hover:border-black transition-colors cursor-pointer"
          >
            + ANALYZE NEW
          </button>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="py-20 text-center">
            <p className="text-[11px] tracking-[0.22em] uppercase text-neutral-400 animate-pulse">
              LOADING CONTRACTS...
            </p>
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div className="py-14 border border-black text-center px-8">
            <p className="text-[11px] tracking-[0.2em] uppercase text-neutral-500 mb-2">
              UNABLE TO LOAD
            </p>
            <p className="text-sm text-black">{error}</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && contracts.length === 0 && (
          <div className="py-24 border border-dashed border-neutral-300 text-center">
            <p className="text-2xl font-medium text-black mb-2">NO CONTRACTS YET.</p>
            <p className="text-[11px] tracking-[0.18em] uppercase text-neutral-500 mb-8">
              Upload a contract to begin analysis.
            </p>
            <button
              onClick={() => navigate('/upload')}
              className="text-[11px] tracking-[0.16em] uppercase bg-black text-white px-6 py-3.5 hover:bg-[#D3FD50] hover:text-black transition-colors cursor-pointer"
            >
              ANALYZE A CONTRACT →
            </button>
          </div>
        )}

        {/* Contract list — Editorial Document Index */}
        {!loading && !error && contracts.length > 0 && (
          <div>
            {/* Column headers */}
            <div className="grid grid-cols-12 gap-4 pb-3 border-b border-black text-[10px] tracking-[0.22em] uppercase text-neutral-500 font-medium">
              <span className="col-span-6">
                CONTRACT
              </span>
              <span className="col-span-2">
                RISK
              </span>
              <span className="col-span-2">
                SCORE
              </span>
              <span className="col-span-2 text-right">
                DATE
              </span>
            </div>

            {/* Rows */}
            {contracts.map((contract) => (
              <div
                key={contract.id}
                onClick={() => navigate(`/contracts/${contract.id}`)}
                className="grid grid-cols-12 gap-4 py-5 border-b border-neutral-200 hover:bg-[#D3FD50] hover:border-black cursor-pointer transition-all duration-150 group px-2 -mx-2"
              >
                <div className="col-span-6 flex items-center">
                  <span className="text-sm md:text-base font-medium text-black transition-transform duration-150 group-hover:translate-x-1.5 leading-snug">
                    {contract.name.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="col-span-2 flex items-center">
                  <span
                    className={`text-[11px] tracking-[0.14em] uppercase ${riskTextStyle(
                      contract.riskLevel
                    )}`}
                  >
                    {contract.riskLevel}
                  </span>
                </div>
                <div className="col-span-2 flex items-center">
                  <span className="text-sm md:text-base tabular-nums font-mono font-medium text-black">
                    {contract.riskScore}%
                  </span>
                </div>
                <div className="col-span-2 flex items-center justify-end gap-2">
                  <span className="text-xs font-mono text-neutral-500 group-hover:text-black transition-colors">
                    {formatDate(contract.createdAt)}
                  </span>
                  <span className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150 text-black font-medium text-sm">
                    →
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
