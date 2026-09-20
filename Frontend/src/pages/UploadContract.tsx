import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FileText, ChevronDown } from 'lucide-react';
import { api, AnalysisError, RetryFailureResponse } from '../services/api';
import { AgentStatus, AgentState } from '../components/AgentStatus';

/* ── Types ───────────────────────────────────────────────────────────── */
type AnalysisStep = 'idle' | 'uploading' | 'analyzing' | 'completed' | 'failed' | 'retrying';

interface AgentStepInfo {
  id: string;
  name: string;
}

/* ── Agent stages — must match backend ids exactly ───────────────────── */
const AGENT_STAGES: AgentStepInfo[] = [
  { id: 'clause',     name: 'Clause Analysis'      },
  { id: 'risk',       name: 'Risk Analysis'         },
  { id: 'obligation', name: 'Obligation Tracking'   },
  { id: 'summary',    name: 'Executive Summary'     },
];

/* ── Derive per-stage visual state ───────────────────────────────────── */
function getStageState(
  stageId: string,
  status: AnalysisStep,
  failureInfo: RetryFailureResponse | null
): AgentState {
  const ids = AGENT_STAGES.map((s) => s.id);
  const stageIdx = ids.indexOf(stageId);

  if (!failureInfo) {
    /* No failure info yet — show sequential progress visually */
    if (status === 'completed') return 'complete';
    if (status === 'uploading') return 'waiting';
    if (status === 'analyzing') {
      /* Agents run sequentially — first one is most likely running */
      return stageIdx === 0 ? 'running' : 'waiting';
    }
    return 'waiting';
  }

  /* We have failure info from the backend */
  const failedIdx = ids.indexOf(failureInfo.resumeFrom);
  if (stageIdx < failedIdx) return 'complete';
  if (stageIdx === failedIdx) {
    if (status === 'retrying')  return 'retrying';
    if (status === 'completed') return 'complete';
    return 'failed';
  }
  return 'waiting';
}

/* ── Component ───────────────────────────────────────────────────────── */
export const UploadContract: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [status, setStatus]             = useState<AnalysisStep>('idle');
  const [error, setError]               = useState<string | null>(null);
  const [contractId, setContractId]     = useState<string | null>(null);
  const [failureInfo, setFailureInfo]   = useState<RetryFailureResponse | null>(null);
  const [isDragging, setIsDragging]     = useState(false);
  const [showTechError, setShowTechError] = useState(false);

  /* ── File selection ─────────────────────────────── */
  const acceptFile = (file: File) => {
    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      setSelectedFile(file);
      setStatus('idle');
      setError(null);
      setFailureInfo(null);
      setShowTechError(false);
    } else {
      alert('Please select a valid PDF file.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) acceptFile(e.target.files[0]);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.[0]) acceptFile(e.dataTransfer.files[0]);
  };

  /* ── Analyze ────────────────────────────────────── */
  const handleAnalyze = async () => {
    if (!selectedFile) return;
    setError(null);
    setFailureInfo(null);
    setStatus('uploading');

    const analyzeTimer = setTimeout(() => setStatus('analyzing'), 1000);

    try {
      const response = await api.analyzeContract(selectedFile);
      clearTimeout(analyzeTimer);
      setStatus('completed');
      setContractId(response.contract.id);
      setTimeout(() => navigate(`/contracts/${response.contract.id}`), 1500);
    } catch (err: unknown) {
      clearTimeout(analyzeTimer);
      if (err instanceof AnalysisError && err.failureData) {
        setStatus('failed');
        setFailureInfo(err.failureData);
        setContractId(err.failureData.contractId);
        setError(null);
      } else {
        setStatus('idle');
        setError(
          err instanceof Error ? err.message : 'Contract analysis failed. Please try again.'
        );
      }
    }
  };

  /* ── Retry ──────────────────────────────────────── */
  const handleRetry = async () => {
    const targetId  = contractId ?? failureInfo?.contractId;
    const failedStage = failureInfo?.resumeFrom ?? 'summary';
    if (!targetId) return;

    setError(null);
    setStatus('retrying');

    try {
      const response = await api.retryContract(targetId, failedStage);
      setStatus('completed');
      setFailureInfo(null);
      setContractId(response.contract.id);
      setTimeout(() => navigate(`/contracts/${response.contract.id}`), 1500);
    } catch (err: unknown) {
      if (err instanceof AnalysisError && err.failureData) {
        setStatus('failed');
        setFailureInfo(err.failureData);
      } else {
        setStatus('failed');
        setError(
          err instanceof Error ? err.message : 'Contract retry failed. Please try again.'
        );
      }
    }
  };

  const isProcessing      = status === 'uploading' || status === 'analyzing' || status === 'retrying';
  const showAnalysisPanel = status !== 'idle' || !!failureInfo;

  /* ── Render ─────────────────────────────────────── */
  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-12 py-12 md:py-16">

      {/* Back */}
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-[11px] tracking-[0.14em] uppercase text-neutral-500 hover:text-black transition-colors mb-8"
      >
        ← DASHBOARD
      </Link>

      {/* Page Headline */}
      <div className="mb-10">
        <h1 className="text-4xl md:text-5xl lg:text-[3.5rem] font-medium tracking-tight leading-none text-black">
          ANALYZE A CONTRACT.
        </h1>
        <p className="mt-3 text-sm text-neutral-500">
          Drop your PDF here. Our four specialized AI agents will handle the rest.
        </p>
      </div>

      <hr className="border-black mb-10" />

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">

        {/* ── LEFT: Upload Zone ─────────────────────── */}
        <div className="space-y-6">

          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => !isProcessing && fileInputRef.current?.click()}
            className={`
              border border-dashed transition-all
              flex flex-col items-center justify-center text-center
              py-16 px-8 min-h-[280px]
              ${isDragging
                ? 'border-black bg-[#D3FD50]/20 border-solid'
                : isProcessing
                ? 'border-neutral-200 bg-neutral-50 cursor-not-allowed opacity-60'
                : 'border-neutral-300 hover:border-black hover:bg-[#D3FD50]/5 cursor-pointer'
              }
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              id="pdf-upload"
              accept=".pdf,application/pdf"
              onChange={handleFileChange}
              className="hidden"
              disabled={isProcessing}
            />

            {selectedFile ? (
              <div className="space-y-3">
                <FileText className="w-8 h-8 text-black mx-auto" />
                <div>
                  <p className="text-sm font-medium text-black">{selectedFile.name}</p>
                  <p className="text-xs text-neutral-500 mt-1 font-mono">
                    PDF · {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                {!isProcessing && (
                  <p className="text-[10px] tracking-[0.14em] uppercase text-neutral-400 mt-2">
                    CLICK TO CHANGE FILE
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="w-12 h-12 border border-dashed border-neutral-300 flex items-center justify-center mx-auto">
                  <span className="text-neutral-400 text-xl leading-none">+</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-black">Drop your PDF here.</p>
                  <p className="text-xs text-neutral-500 mt-1">
                    or{' '}
                    <span className="underline cursor-pointer hover:text-black transition-colors">
                      choose a file
                    </span>
                  </p>
                </div>
                <p className="text-[10px] tracking-[0.16em] uppercase text-neutral-400">
                  PDF FILES ONLY
                </p>
              </div>
            )}
          </div>

          {/* General error */}
          {error && (
            <div className="border border-black p-4">
              <p className="text-[10px] tracking-[0.14em] uppercase text-neutral-500 mb-1">ERROR</p>
              <p className="text-sm text-black">{error}</p>
            </div>
          )}

          {/* Primary CTA */}
          {selectedFile && status === 'idle' && (
            <button
              onClick={handleAnalyze}
              className="w-full py-4 text-[11px] tracking-[0.18em] uppercase font-medium bg-black text-white hover:bg-[#D3FD50] hover:text-black transition-colors"
            >
              ANALYZE CONTRACT →
            </button>
          )}

          {/* View contract CTA after completion */}
          {status === 'completed' && contractId && (
            <button
              onClick={() => navigate(`/contracts/${contractId}`)}
              className="w-full py-4 text-[11px] tracking-[0.18em] uppercase font-medium bg-black text-white hover:bg-[#D3FD50] hover:text-black transition-colors"
            >
              VIEW CONTRACT →
            </button>
          )}
        </div>

        {/* ── RIGHT: Analysis Panel ─────────────────── */}
        {showAnalysisPanel && (
          <div className="space-y-6">

            {/* Panel heading */}
            <div className="flex items-baseline justify-between">
              <h2 className="text-[11px] tracking-[0.22em] uppercase text-neutral-500">
                ANALYZING CONTRACT
              </h2>
              {selectedFile && (
                <span className="text-[10px] tracking-[0.12em] uppercase text-neutral-400 font-mono">
                  {selectedFile.name}
                </span>
              )}
            </div>

            {/* Agent stage list */}
            <div className="border border-neutral-200">
              {AGENT_STAGES.map((stage, idx) => (
                <AgentStatus
                  key={stage.id}
                  index={idx + 1}
                  name={stage.name}
                  state={getStageState(stage.id, status, failureInfo)}
                />
              ))}
            </div>

            {/* ── Failure State ─────────────── */}
            {status === 'failed' && failureInfo && (
              <div className="border border-black p-6 space-y-5">
                <div>
                  <p className="text-[10px] tracking-[0.16em] uppercase text-neutral-500 mb-2">
                    {(failureInfo.resumeFrom ?? 'AGENT').replace(/_/g, ' ').toUpperCase()} · STAGE INTERRUPTED
                  </p>
                  <h3 className="text-xl font-medium text-black leading-snug">
                    THE AGENT STUMBLED ON A STONE.
                  </h3>
                  <p className="text-sm text-neutral-600 mt-2 leading-relaxed">
                    The AI service temporarily ran into a request limit. Your completed
                    analysis is safe. Only the failed stage will be retried.
                  </p>
                </div>

                <hr className="border-neutral-200" />

                {/* Collapsible technical error */}
                <div>
                  <button
                    onClick={() => setShowTechError(!showTechError)}
                    className="flex items-center gap-1.5 text-[10px] tracking-[0.14em] uppercase text-neutral-400 hover:text-black transition-colors"
                  >
                    <ChevronDown
                      className={`w-3 h-3 transition-transform ${showTechError ? 'rotate-180' : ''}`}
                    />
                    TECHNICAL DETAILS
                  </button>
                  {showTechError && (
                    <p className="mt-3 text-xs font-mono text-neutral-500 bg-neutral-50 border border-neutral-200 p-3 leading-relaxed">
                      {failureInfo.error ?? 'Agent execution error. See server logs for details.'}
                    </p>
                  )}
                </div>

                <button
                  onClick={handleRetry}
                  className="text-[11px] tracking-[0.16em] uppercase font-medium bg-black text-white px-5 py-3 hover:bg-[#D3FD50] hover:text-black transition-colors"
                >
                  TRY AGAIN →
                </button>
              </div>
            )}

            {/* ── Retrying State ────────────── */}
            {status === 'retrying' && (
              <div className="border border-[#D3FD50] bg-[#D3FD50]/10 p-5">
                <p className="text-[11px] tracking-[0.16em] uppercase text-black font-medium">
                  ⟳ GETTING THE AGENT BACK ON ITS FEET...
                </p>
                <p className="text-xs text-neutral-700 mt-1.5 leading-relaxed">
                  Retrying only the failed stage. Your completed analysis will not be repeated.
                </p>
              </div>
            )}

            {/* ── Uploading / Analyzing status ─ */}
            {(status === 'uploading' || status === 'analyzing') && !failureInfo && (
              <div className="bg-neutral-50 border border-neutral-200 p-4">
                <p className="text-[11px] tracking-[0.18em] uppercase text-neutral-600 animate-pulse">
                  {status === 'uploading'
                    ? 'UPLOADING DOCUMENT...'
                    : 'AI AGENTS ARE PROCESSING YOUR CONTRACT...'}
                </p>
              </div>
            )}

            {/* ── Completed state ───────────── */}
            {status === 'completed' && !failureInfo && (
              <div className="border border-black bg-[#D3FD50] p-5">
                <p className="text-[11px] tracking-[0.16em] uppercase text-black font-medium">
                  ✓ ANALYSIS COMPLETE
                </p>
                <p className="text-xs text-black/70 mt-1">Redirecting to contract details...</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
