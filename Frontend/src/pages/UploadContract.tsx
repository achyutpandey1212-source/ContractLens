import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, FileText, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '../components/Button';
import { api } from '../services/api';

type AnalysisStep = 'idle' | 'uploading' | 'analyzing' | 'completed';

export const UploadContract: React.FC = () => {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [status, setStatus] = useState<AnalysisStep>('idle');
  const [error, setError] = useState<string | null>(null);
  const [contractId, setContractId] = useState<string | null>(null);

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
    setStatus('uploading');

    // Smooth UI transition to analyzing after initial network dispatch
    const analyzeTimer = setTimeout(() => {
      setStatus('analyzing');
    }, 1000);

    try {
      const response = await api.analyzeContract(selectedFile);
      clearTimeout(analyzeTimer);
      setStatus('completed');
      setContractId(response.contract.id);
      // Automatically navigate to contract details
      setTimeout(() => {
        navigate(`/contracts/${response.contract.id}`);
      }, 1200);
    } catch (err: any) {
      clearTimeout(analyzeTimer);
      setStatus('idle');
      setError(err?.message || 'Contract analysis failed. Please try again.');
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
          <div className="border border-neutral-200 rounded-lg p-4 bg-neutral-50 space-y-3">
            <h3 className="text-sm font-semibold text-neutral-900">Status</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                {status === 'uploading' ? (
                  <Loader2 className="w-4 h-4 animate-spin text-neutral-600" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                )}
                <span className={status === 'uploading' ? 'text-neutral-900 font-medium' : 'text-neutral-500'}>
                  Uploading...
                </span>
              </div>

              {(status === 'analyzing' || status === 'completed') && (
                <div className="flex items-center gap-2">
                  {status === 'analyzing' ? (
                    <Loader2 className="w-4 h-4 animate-spin text-neutral-600" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  )}
                  <span className={status === 'analyzing' ? 'text-neutral-900 font-medium' : 'text-neutral-500'}>
                    Analyzing contract...
                  </span>
                </div>
              )}

              {status === 'completed' && (
                <div className="flex items-center gap-2 text-emerald-700 font-medium pt-1 border-t border-neutral-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Analysis complete</span>
                </div>
              )}
            </div>

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
