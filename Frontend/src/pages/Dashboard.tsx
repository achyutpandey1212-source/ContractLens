import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '../components/Button';
import { RiskBadge } from '../components/RiskBadge';
import { api, ContractListItem } from '../services/api';

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
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-neutral-200">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">ContractLens</h1>
          <p className="text-sm text-neutral-500 mt-1">Overview of analyzed contracts and risk profiles</p>
        </div>
        <Button to="/upload" className="gap-2 self-start sm:self-auto">
          <Plus className="w-4 h-4" />
          <span>Upload Contract</span>
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-neutral-200">
          <h2 className="text-base font-semibold text-neutral-900">Recent Contracts</h2>
        </div>

        {loading ? (
          <div className="p-8 flex items-center justify-center gap-2 text-neutral-500 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Loading contracts...</span>
          </div>
        ) : error ? (
          <div className="p-8 flex items-center justify-center gap-2 text-rose-600 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        ) : contracts.length === 0 ? (
          <div className="p-8 text-center text-neutral-500 text-sm">
            No contracts analyzed yet. Click "Upload Contract" to begin.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-50 text-neutral-600 border-b border-neutral-200 text-xs uppercase tracking-wider">
                <tr>
                  <th scope="col" className="px-6 py-3 font-medium">Contract Name</th>
                  <th scope="col" className="px-6 py-3 font-medium">Risk</th>
                  <th scope="col" className="px-6 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {contracts.map((contract) => (
                  <tr
                    key={contract.id}
                    onClick={() => navigate(`/contracts/${contract.id}`)}
                    className="hover:bg-neutral-50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 font-medium text-neutral-900 hover:text-neutral-600">
                      {contract.name}
                    </td>
                    <td className="px-6 py-4">
                      <RiskBadge level={contract.riskLevel} />
                    </td>
                    <td className="px-6 py-4 text-neutral-500">
                      {formatDate(contract.createdAt)}
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
