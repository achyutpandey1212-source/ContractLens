import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, Shield, Zap, ArrowRight } from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-white text-black">
      {/* Hero Section */}
      <section className="flex-1 flex items-center justify-center px-6 lg:px-12 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl lg:text-[5rem] font-medium tracking-tight leading-[1.05] text-black mb-8">
            CONTRACT LENS
          </h1>
          <p className="text-xl md:text-2xl text-neutral-500 max-w-2xl mx-auto mb-12 leading-relaxed">
            AI-powered contract analysis that spots risks, extracts obligations, and keeps you in control.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-20">
            <Link
              to="/upload"
              className="group inline-flex items-center gap-3 text-[11px] tracking-[0.14em] uppercase bg-black text-white px-8 py-4 hover:bg-[#D3FD50] hover:text-black hover:border-[#D3FD50] border border-black transition-colors"
            >
              ANALYZE A CONTRACT
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-3 text-[11px] tracking-[0.14em] uppercase border border-black px-8 py-4 text-black bg-white hover:bg-neutral-100 transition-colors"
            >
              VIEW DASHBOARD
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t border-neutral-200 py-20 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-[11px] tracking-[0.22em] uppercase text-neutral-500 text-center mb-16">
            WHY CONTRACT LENS
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            <div className="p-6 border border-neutral-200 hover:border-[#D3FD50] transition-colors">
              <div className="w-12 h-12 bg-black text-white flex items-center justify-center mb-6">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-medium text-black mb-3">INSTANT ANALYSIS</h3>
              <p className="text-neutral-500 text-base leading-relaxed">
                Upload any contract and get a comprehensive risk assessment in seconds, not hours.
              </p>
            </div>

            <div className="p-6 border border-neutral-200 hover:border-[#D3FD50] transition-colors">
              <div className="w-12 h-12 bg-black text-white flex items-center justify-center mb-6">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-medium text-black mb-3">RISK DETECTION</h3>
              <p className="text-neutral-500 text-base leading-relaxed">
                AI identifies critical clauses, unfavorable terms, and compliance gaps with precision scoring.
              </p>
            </div>

            <div className="p-6 border border-neutral-200 hover:border-[#D3FD50] transition-colors">
              <div className="w-12 h-12 bg-black text-white flex items-center justify-center mb-6">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-medium text-black mb-3">OBLIGATION TRACKING</h3>
              <p className="text-neutral-500 text-base leading-relaxed">
                Never miss a deadline. Automatic extraction of key dates, renewals, and deliverables.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-200 py-8 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[11px] tracking-[0.18em] uppercase text-neutral-400">
            CONTRACT LENS 2025
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-[11px] tracking-[0.14em] uppercase text-neutral-500 hover:text-black transition-colors">
              PRIVACY
            </a>
            <a href="#" className="text-[11px] tracking-[0.14em] uppercase text-neutral-500 hover:text-black transition-colors">
              TERMS
            </a>
            <a href="#" className="text-[11px] tracking-[0.14em] uppercase text-neutral-500 hover:text-black transition-colors">
              CONTACT
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};