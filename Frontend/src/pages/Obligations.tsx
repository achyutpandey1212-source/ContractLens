import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '../components/Button';
import { api, ObligationItem } from '../services/api';

export const Obligations: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [obligations, setObligations] = useState<ObligationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let isMounted = true;
    setLoading(true);
    api
      .getContractObligations(id)
      .then((data) => {
        if (isMounted) {
          setObligations(data.obligations || []);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setError('Failed to load obligations.');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  return (
    <div className="space-y-6">
      <div>
        <Button to={'/contracts/' + id} variant="outline" className="gap-2 mb-4 text-xs py-1.5 px-3">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Contract</span>
        </Button>
        <h1 className="text-2xl font-semibold text-neutral-900">Obligations</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Key operational and contractual obligations extracted for Contract ID: {id}
        </p>
      </div>

      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-neutral-200">
          <h2 className="text-base font-semibold text-neutral-900">Contractual Obligations</h2>
        </div>

        {loading ? (
          <div className="p-8 flex items-center justify-center gap-2 text-neutral-500 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Loading obligations...</span>
          </div>
        ) : error ? (
          <div className="p-8 flex items-center justify-center gap-2 text-rose-600 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        ) : obligations.length === 0 ? (
          <div className="p-8 text-center text-neutral-500 text-sm">
            No specific obligations found for this contract.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-50 text-neutral-600 border-b border-neutral-200 text-xs uppercase tracking-wider">
                <tr>
                  <th scope="col" className="px-6 py-3 font-medium">Party</th>
                  <th scope="col" className="px-6 py-3 font-medium">Obligation</th>
                  <th scope="col" className="px-6 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {obligations.map((item, index) => (
                  <tr key={index} className="hover:bg-neutral-50/70 transition-colors">
                    <td className="px-6 py-4 font-semibold text-neutral-800 whitespace-nowrap">
                      <span className="inline-block px-2 py-0.5 rounded text-xs border bg-neutral-100 text-neutral-800 border-neutral-300">
                        {item.responsible_party || 'Assigned Party'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-neutral-700">
                      {item.obligation_text}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                        {item.status || 'pending'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
