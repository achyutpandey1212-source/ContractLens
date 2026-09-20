import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, FileText, CheckCircle2, Loader2, AlertCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '../components/Button';
import { api, AnalysisError, RetryFailureResponse } from '../services/api';

type AnalysisStep = 'idle' | 'uploading' | 'analyzing' | 'completed' | 'failed' | 'retrying';

interface AgentStepInfo {
  id: string;
  name: string;
}

const AGENT_STAGES: AgentStepInfo[] = [
  { id: 'clause', name: 'Clause Analysis' },
  { id: 'risk', name: 'Risk Analysis' },
  { id: 'obligation', name: 'Obligation Tracking' },
  { id: 'summary', name: 'Executive Summary' }
];

export const UploadContract: React.FC = () => {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [status, setStatus] = useState<AnalysisStep>('idle');
  const [error, setError] = useState<string | null>(null);
  const [contractId, setContractId] = useState<string | null>(null);
  const [failureInfo, setFailureInfo] = useState<RetryFailureResponse | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        setSelectedFile(file);
        setStatus('idle');
        setError(null);
      } else {
        alert('Please select a valid PDF file.');
      }
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;

    setError(null);
    setFailureInfo(null);
    setStatus('uploading');

    const analyzeTimer = setTimeout(() => {
      setStatus('analyzing');
    }, 1000);

    try {
      const response = await api.analyzeContract(selectedFile);
      clearTimeout(analyzeTimer);
      setStatus('completed');
      setContractId(response.contract.id);
      setTimeout(() => {
        navigate(`/contracts/${response.contract.id}`);
      }, 1200);
    } catch (err: any) {
      clearTimeout(analyzeTimer);
      if (err instanceof AnalysisError && err.failureData) {
        setStatus('failed');
        setFailureInfo(err.failureData);
        setContractId(err.failureData.contractId);
        setError(null);
      } else {
        setStatus('idle');
        setError(err?.message || 'Contract analysis failed. Please try again.');
      }
    }
  };

  const handleRetry = async () => {
    if (!contractId && !failureInfo?.contractId) return;
    const targetContractId = contractId || failureInfo!.contractId;
    const failedStage = failureInfo?.resumeFrom || 'summary';

    setError(null);
    setStatus('retrying');

    try {
      const response = await api.retryContract(targetContractId, failedStage);
      setStatus('completed');
      setFailureInfo(null);
      setContractId(response.contract.id);
      setTimeout(() => {
        navigate(`/contracts/${response.contract.id}`);
      }, 1200);
    } catch (err: any) {
      if (err instanceof AnalysisError && err.failureData) {
        setStatus('failed');
        setFailureInfo(err.failureData);
      } else {
        setStatus('failed');
        setError(err?.message || 'Contract retry failed. Please try again.');
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Button to="/" variant="outline" className="gap-2 mb-4 text-xs py-1.5 px-3">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Dashboard</span>
        </Button>
        <h1 className="text-2xl font-semibold text-neutral-900">Upload Contract</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Select a PDF contract for risk evaluation and obligation extraction.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-6 shadow-xs">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Contract Document (.PDF only)
          </label>
          <div className="border-2 border-dashed border-neutral-300 rounded-lg p-6 text-center hover:border-neutral-400 transition-colors bg-neutral-50/50">
            <input
              type="file"
              id="pdf-upload"
              accept=".pdf,application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />
            <label
              htmlFor="pdf-upload"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50 cursor-pointer shadow-xs"
            >
              <Upload className="w-4 h-4 text-neutral-500" />
              <span>Choose PDF</span>
            </label>
            <p className="text-xs text-neutral-500 mt-2">Only PDF files are supported</p>
          </div>
        </div>

        {selectedFile && (
          <div className="p-4 rounded-lg bg-neutral-50 border border-neutral-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-neutral-600" />
              <div>
                <p className="text-xs text-neutral-500 uppercase tracking-wide font-medium">Selected:</p>
                <p className="text-sm font-medium text-neutral-800">{selectedFile.name}</p>
              </div>
            </div>
            <span className="text-xs text-neutral-500 font-mono">
              {(selectedFile.size / 1024).toFixed(1)} KB
            </span>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 flex items-center gap-2 text-rose-700 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {selectedFile && status === 'idle' && (
          <Button onClick={handleAnalyze} className="w-full">
            Analyze Contract
          </Button>
        )}

        {status !== 'idle' && (
          <div className="border border-neutral-200 rounded-lg p-5 bg-neutral-50 space-y-4">
            <h3 className="text-sm font-semibold text-neutral-900 border-b border-neutral-200 pb-2">
              Contract Analysis
            </h3>

            {/* If simple upload or analyzing without specific failure yet */}
            {(status === 'uploading' || status === 'analyzing') && !failureInfo && (
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  {status === 'uploading' ? (
                    <Loader2 className="w-4 h-4 animate-spin text-neutral-600" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  )}
                  <span className={status === 'uploading' ? 'text-neutral-900 font-medium' : 'text-neutral-500'}>
                    Uploading contract...
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {status === 'analyzing' ? (
                    <Loader2 className="w-4 h-4 animate-spin text-neutral-600" />
                  ) : (
                    <span className="w-4 h-4 rounded-full border border-neutral-300" />
                  )}
                  <span className={status === 'analyzing' ? 'text-neutral-900 font-medium' : 'text-neutral-500'}>
                    Analyzing clauses, risks & obligations...
                  </span>
                </div>
              </div>
            )}

            {/* Recoverable failure / retry view */}
            {(status === 'failed' || status === 'retrying' || (status === 'completed' && failureInfo)) && failureInfo && (
              <div className="space-y-4">
                <div className="space-y-2 text-sm">
                  {AGENT_STAGES.map(stage => {
                    const failedIndex = AGENT_STAGES.findIndex(s => s.id === failureInfo.resumeFrom);
                    const currentIndex = AGENT_STAGES.findIndex(s => s.id === stage.id);
                    const isPrior = currentIndex < failedIndex;
                    const isFailedStage = currentIndex === failedIndex;
                    const isSubsequent = currentIndex > failedIndex;

                    if (isPrior) {
                      return (
                        <div key={stage.id} className="flex items-center gap-2 text-emerald-700">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="font-medium">{stage.name}</span>
                        </div>
                      );
                    }

                    if (isFailedStage) {
                      if (status === 'retrying') {
                        return (
                          <div key={stage.id} className="flex items-center gap-2 text-neutral-900 pt-1">
                            <RefreshCw className="w-4 h-4 text-neutral-700 animate-spin shrink-0" />
                            <span className="font-semibold">{stage.name}</span>
                          </div>
                        );
                      }
                      return (
                        <div key={stage.id} className="flex items-center gap-2 text-amber-800 pt-1">
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                          <span className="font-semibold">{stage.name}</span>
                        </div>
                      );
                    }

                    if (isSubsequent) {
                      return (
                        <div key={stage.id} className="flex items-center gap-2 text-neutral-400">
                          <span className="w-4 h-4 rounded-full border border-neutral-300 inline-block shrink-0" />
                          <span>{stage.name}</span>
                        </div>
                      );
                    }

                    return null;
                  })}
                </div>

                {status === 'failed' && (
                  <div className="rounded-lg bg-amber-50/80 border border-amber-200/80 p-4 space-y-2 text-left">
                    <p className="text-sm font-medium text-amber-900">
                      The agent stumbled on a stone.
                    </p>
                    <p className="text-xs text-amber-700 leading-relaxed">
                      The AI service temporarily ran into a problem. Your completed analysis is safe.
                    </p>
                    <div className="pt-2">
                      <Button onClick={handleRetry} className="gap-2 text-xs py-2 px-4">
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Try Again</span>
                      </Button>
                    </div>
                  </div>
                )}

                {status === 'retrying' && (
                  <div className="text-xs text-neutral-600 italic flex items-center gap-2 pt-1">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-neutral-500" />
                    <span>Getting the agent back on its feet...</span>
                  </div>
                )}
              </div>
            )}

            {status === 'completed' && (
              <div className="flex items-center gap-2 text-emerald-700 font-medium pt-2 border-t border-neutral-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Analysis complete</span>
              </div>
            )}

            {status === 'completed' && contractId && (
              <div className="pt-2">
                <Button to={`/contracts/${contractId}`} className="w-full">
                  View Contract Details
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
