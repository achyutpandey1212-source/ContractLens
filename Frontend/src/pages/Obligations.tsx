import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { api, ObligationItem } from '../services/api';

export const Obligations: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [obligations, setObligations] = useState<ObligationItem[]>([]);
  const [loading, setLoading]         = useState<boolean>(true);
  const [error, setError]             = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let isMounted = true;
    setLoading(true);
    api
      .getContractObligations(id)
      .then((data) => {
        if (isMounted) {
          setObligations(data.obligations ?? []);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setError('Failed to load obligations.');
          setLoading(false);
        }
      });
    return () => { isMounted = false; };
  }, [id]);

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-12 py-12 md:py-16">

      {/* Back to Contract */}
      <Link
        to={`/contracts/${id}`}
        className="inline-flex items-center gap-1.5 text-[11px] tracking-[0.14em] uppercase text-neutral-500 hover:text-black transition-colors mb-8"
      >
        ← CONTRACT
      </Link>

      {/* Page Headline */}
      <div className="mb-10">
        <h1 className="text-4xl md:text-5xl lg:text-[3.5rem] font-medium tracking-tight leading-none text-black">
          OBLIGATIONS.
        </h1>
        {!loading && !error && (
          <p className="text-sm text-neutral-500 mt-3">
            {obligations.length} TOTAL OBLIGATION
            {obligations.length !== 1 ? 'S' : ''} IDENTIFIED
          </p>
        )}
      </div>

      <hr className="border-black mb-8" />

      {/* ── Loading ──────────────────────────────── */}
      {loading && (
        <div className="py-20 flex items-center gap-3 text-neutral-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-[11px] tracking-[0.2em] uppercase animate-pulse">
            LOADING OBLIGATIONS...
          </span>
        </div>
      )}

      {/* ── Error ────────────────────────────────── */}
      {!loading && error && (
        <div className="border border-black p-8">
          <p className="text-[10px] tracking-[0.2em] uppercase text-neutral-500 mb-2">ERROR</p>
          <p className="text-sm text-black">{error}</p>
        </div>
      )}

      {/* ── Empty ────────────────────────────────── */}
      {!loading && !error && obligations.length === 0 && (
        <div className="py-20 border border-dashed border-neutral-200 text-center">
          <p className="text-[11px] tracking-[0.22em] uppercase text-neutral-400">
            NO OBLIGATIONS FOUND FOR THIS CONTRACT.
          </p>
        </div>
      )}

      {/* ── Table ────────────────────────────────── */}
      {!loading && !error && obligations.length > 0 && (
        <div>
          {/* Column headers */}
          <div className="grid grid-cols-12 gap-4 pb-3 border-b border-black">
            <div className="col-span-2">
              <span className="text-[10px] tracking-[0.22em] uppercase text-neutral-500">PARTY</span>
            </div>
            <div className="col-span-7">
              <span className="text-[10px] tracking-[0.22em] uppercase text-neutral-500">
                OBLIGATION
              </span>
            </div>
            <div className="col-span-3 text-right">
              <span className="text-[10px] tracking-[0.22em] uppercase text-neutral-500">STATUS</span>
            </div>
          </div>

          {/* Rows */}
          {obligations.map((item, idx) => {
            const party = (item.responsible_party ?? '').toUpperCase();
            const isVendor = party === 'VENDOR';

            return (
              <div
                key={idx}
                className="grid grid-cols-12 gap-4 py-5 border-b border-neutral-100 hover:border-[#D3FD50] hover:bg-[#D3FD50]/5 transition-all"
              >
                {/* Party badge */}
                <div className="col-span-2 flex items-start pt-0.5">
                  <span
                    className={`inline-block text-[10px] tracking-[0.12em] uppercase px-2 py-0.5 border font-medium ${
                      isVendor
                        ? 'border-black text-black'
                        : 'border-neutral-400 text-neutral-600'
                    }`}
                  >
                    {party || '—'}
                  </span>
                </div>

                {/* Obligation text */}
                <div className="col-span-7 flex items-start">
                  <p className="text-sm text-black leading-relaxed">{item.obligation_text}</p>
                </div>

                {/* Status */}
                <div className="col-span-3 flex items-start justify-end">
                  <span className="text-[10px] tracking-[0.12em] uppercase text-neutral-500 border border-neutral-200 px-2 py-0.5">
                    {(item.status ?? 'PENDING').toUpperCase()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
