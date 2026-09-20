import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { FullscreenMenu } from '../components/LandingPage/FullscreenMenu';
import { MenuButton } from '../components/LandingPage/MenuButton';

export const AboutUs: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleStartUsing = () => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-white text-black font-lausanne selection:bg-[#D3FD50] selection:text-black">
      {/* ── Fullscreen Editorial Menu ──────────────────────── */}
      <FullscreenMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />

      {/* ── Editorial Top Navigation ────────────────────────── */}
      <header className="border-b border-black sticky top-0 z-40 bg-white/95 backdrop-blur-sm h-[48px] md:h-[52px]">
        <div className="w-full h-full flex items-center justify-between">
          <div className="pl-6 lg:pl-12">
            <Link
              to="/"
              className="text-xs font-semibold tracking-[0.25em] uppercase hover:opacity-75 transition-opacity"
            >
              CONTRACTLENS
            </Link>
          </div>

          <div className="flex items-center h-full">
            {/* Menu Trigger */}
            <div className="relative h-full border-l border-black">
              <MenuButton onClick={() => setMenuOpen(true)} />
            </div>
          </div>
        </div>
      </header>

      {/* ── Hero / Statement ────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 lg:px-12 pt-20 pb-16 md:pt-28 md:pb-24">
        <p className="text-[11px] tracking-[0.28em] uppercase text-neutral-500 mb-6">
          ABOUT CONTRACTLENS
        </p>
        <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-[5.5rem] font-medium tracking-tight leading-[0.98] uppercase max-w-5xl">
          EVERY AGREEMENT HOLDS A PROMISE. AND OFTEN, A TRAP.
        </h1>
        <p className="mt-8 md:mt-12 text-lg sm:text-xl md:text-2xl text-neutral-600 max-w-3xl leading-relaxed font-normal">
          ContractLens is an AI-powered intelligence platform built to expose hidden risks, 
          track obligations, and give teams clarity before signing or renewing routine business contracts.
        </p>
      </section>

      <hr className="border-black max-w-7xl mx-auto px-6 lg:px-12" />

      {/* ── Section 1: The Problem ───────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 lg:px-12 py-20 md:py-28">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          <div className="lg:col-span-4">
            <span className="text-[11px] tracking-[0.28em] uppercase text-neutral-500 block mb-3">
              01 / THE PROBLEM
            </span>
            <h2 className="text-3xl md:text-4xl font-medium tracking-tight uppercase leading-tight">
              BURIED IN 40 PAGES OF FINE PRINT.
            </h2>
          </div>

          <div className="lg:col-span-8 space-y-6 text-base md:text-lg text-neutral-700 leading-relaxed font-normal">
            <p>
              Businesses deal with contracts constantly. SOWs, vendor agreements, NDAs, Master Service 
              Agreements, SaaS subscriptions, and client contracts.
            </p>
            <p>
              The most critical commercial details are routinely buried inside long, dense documents:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 pb-4">
              {[
                'Silent auto-renewal dates',
                'Uncapped liability exposures',
                'Accelerated payment commitments',
                'Onerous termination conditions',
                'Strict SLA penalties & remedies',
                'Data protection & audit liabilities'
              ].map((item, idx) => (
                <div key={idx} className="border-l-2 border-black pl-4 py-1 text-sm md:text-base text-black font-medium">
                  {item}
                </div>
              ))}
            </div>
            <p>
              Manually reading every page takes hours that founders, finance leads, and operations teams simply do not have.
              And missing even a single overlooked clause is expensive:
            </p>
            <div className="bg-black text-white p-6 md:p-8 space-y-2 mt-4">
              <p className="text-[#D3FD50] text-[11px] tracking-[0.22em] uppercase font-medium">
                THE COST OF AN OVERSIGHT
              </p>
              <p className="text-xl md:text-2xl font-normal leading-snug">
                A missed renewal notice. An unexpected penalty. A weak indemnity limit. A deadline nobody recorded.
              </p>
            </div>
          </div>
        </div>
      </section>

      <hr className="border-neutral-200 max-w-7xl mx-auto px-6 lg:px-12" />

      {/* ── Section 2: The Solution ──────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 lg:px-12 py-20 md:py-28">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          <div className="lg:col-span-4">
            <span className="text-[11px] tracking-[0.28em] uppercase text-neutral-500 block mb-3">
              02 / THE SOLUTION
            </span>
            <h2 className="text-3xl md:text-4xl font-medium tracking-tight uppercase leading-tight">
              FROM UNSTRUCTURED PDF TO ACTIONABLE INTELLIGENCE.
            </h2>
          </div>

          <div className="lg:col-span-8 space-y-6 text-base md:text-lg text-neutral-700 leading-relaxed font-normal">
            <p>
              ContractLens turns raw legal documents into structured, prioritized insights in seconds. 
              Our multi-agent pipeline parses every paragraph to surface:
            </p>
            <ul className="space-y-3 pt-2">
              {[
                'High-risk and non-standard liability terms',
                'Concrete financial and operational obligations',
                'Exact renewal deadlines, effective dates, and milestones',
                'Clear responsibility assignments per counterparty',
                'Actionable recommendations to negotiate or clarify'
              ].map((point, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-black shrink-0 mt-1" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
            <div className="border border-neutral-300 p-6 mt-6">
              <p className="text-xs uppercase tracking-[0.2em] text-neutral-500 mb-1">
                OUR PHILOSOPHY
              </p>
              <p className="text-black font-medium text-base md:text-lg">
                The goal is not to replace legal counsel. The goal is to help human teams understand agreements faster, 
                spot red flags before signature, and bring the right attention where it counts.
              </p>
            </div>
          </div>
        </div>
      </section>

      <hr className="border-neutral-200 max-w-7xl mx-auto px-6 lg:px-12" />

      {/* ── Section 3: The Value ─────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 lg:px-12 py-20 md:py-28 bg-[#fafafa]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          <div className="lg:col-span-4">
            <span className="text-[11px] tracking-[0.28em] uppercase text-neutral-500 block mb-3">
              03 / MEASURABLE VALUE
            </span>
            <h2 className="text-3xl md:text-4xl font-medium tracking-tight uppercase leading-tight">
              PRACTICAL IMPACT, NOT HYPERBOLE.
            </h2>
          </div>

          <div className="lg:col-span-8 space-y-6 text-base md:text-lg text-neutral-700 leading-relaxed font-normal">
            <p>
              We do not claim ContractLens will magically save your business millions overnight. 
              Instead, we deliver real, daily operational clarity:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
              <div className="border border-black bg-white p-6">
                <p className="text-xs uppercase tracking-[0.2em] text-neutral-500 mb-2">TIME</p>
                <h3 className="text-lg font-medium text-black mb-2">Cut Routine Review Time</h3>
                <p className="text-sm text-neutral-600">
                  Spend minutes rather than hours parsing boilerplate to locate non-standard language.
                </p>
              </div>
              <div className="border border-black bg-white p-6">
                <p className="text-xs uppercase tracking-[0.2em] text-neutral-500 mb-2">RISK</p>
                <h3 className="text-lg font-medium text-black mb-2">Catch Risks Earlier</h3>
                <p className="text-sm text-neutral-600">
                  Identify ambiguous indemnities or one-sided termination rights before signing.
                </p>
              </div>
              <div className="border border-black bg-white p-6">
                <p className="text-xs uppercase tracking-[0.2em] text-neutral-500 mb-2">CONTROL</p>
                <h3 className="text-lg font-medium text-black mb-2">No Missed Deadlines</h3>
                <p className="text-sm text-neutral-600">
                  Keep active track of deliverables, renewal windows, and payment triggers across contracts.
                </p>
              </div>
              <div className="border border-black bg-white p-6">
                <p className="text-xs uppercase tracking-[0.2em] text-neutral-500 mb-2">VISIBILITY</p>
                <h3 className="text-lg font-medium text-black mb-2">Reduce Blindspots</h3>
                <p className="text-sm text-neutral-600">
                  Give leadership and finance teams an instant bird’s-eye view of all company commitments.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 4: Who It Is For ─────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 lg:px-12 py-20 md:py-28">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          <div className="lg:col-span-4">
            <span className="text-[11px] tracking-[0.28em] uppercase text-neutral-500 block mb-3">
              04 / WHO IT IS FOR
            </span>
            <h2 className="text-3xl md:text-4xl font-medium tracking-tight uppercase leading-tight">
              DESIGNED FOR TEAMS THAT MOVE FAST.
            </h2>
          </div>

          <div className="lg:col-span-8">
            <p className="text-base md:text-lg text-neutral-700 leading-relaxed font-normal mb-8">
              ContractLens is purposefully engineered for organizations and operators who need clarity without friction:
            </p>
            <div className="flex flex-wrap gap-2.5">
              {[
                'Startups & Scaleups',
                'Founders & Executives',
                'Operations Leads',
                'Finance & Accounting Teams',
                'Procurement Specialists',
                'In-house Counsel & Legal Ops',
                'Agencies & Consultancies',
                'Freelancers Signing High-Value Deals'
              ].map((audience, idx) => (
                <span
                  key={idx}
                  className="border border-black px-4 py-2 text-xs md:text-sm uppercase tracking-[0.14em] font-medium bg-white hover:bg-[#D3FD50] transition-colors"
                >
                  {audience}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <hr className="border-neutral-200 max-w-7xl mx-auto px-6 lg:px-12" />

      {/* ── Section 5: How It Works ──────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 lg:px-12 py-20 md:py-28">
        <div className="mb-14">
          <span className="text-[11px] tracking-[0.28em] uppercase text-neutral-500 block mb-3">
            05 / THE PROCESS
          </span>
          <h2 className="text-3xl md:text-5xl font-medium tracking-tight uppercase leading-none">
            HOW IT WORKS.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              step: '01',
              title: 'UPLOAD',
              desc: 'Drop in your contract PDF. Instant ingestion and text extraction begin automatically.'
            },
            {
              step: '02',
              title: 'ANALYZE',
              desc: 'Specialized AI agents review clauses, compare benchmarks, and detect risk patterns.'
            },
            {
              step: '03',
              title: 'UNDERSTAND',
              desc: 'Review structured risks, extracted obligations, counterparty terms, and overall health.'
            },
            {
              step: '04',
              title: 'ACT',
              desc: 'Export recommendations, renegotiate critical clauses, and calendar important renewal dates.'
            }
          ].map((item) => (
            <div
              key={item.step}
              className="border border-black p-6 md:p-8 flex flex-col justify-between hover:border-[#D3FD50] hover:bg-[#D3FD50]/5 transition-all group"
            >
              <div>
                <span className="text-3xl font-medium text-black group-hover:text-[#88af12] transition-colors block mb-4">
                  {item.step}
                </span>
                <h3 className="text-xl font-medium uppercase tracking-tight text-black mb-3">
                  {item.title}
                </h3>
                <p className="text-sm text-neutral-600 leading-relaxed font-normal">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Section 6: Editorial Final CTA ───────────────────── */}
      <section className="border-t border-black bg-black text-white py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 text-center flex flex-col items-center">
          <p className="text-[#D3FD50] text-xs md:text-sm tracking-[0.3em] uppercase mb-4 font-medium">
            READY FOR TOTAL CONTRACT CLARITY
          </p>
          <h2 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-medium tracking-tight uppercase leading-[0.95] max-w-4xl mb-10">
            STOP SEARCHING THROUGH CONTRACTS.
          </h2>
          <button
            onClick={handleStartUsing}
            className="cursor-pointer inline-flex items-center gap-3 px-8 py-4 bg-[#D3FD50] text-black text-sm md:text-base tracking-[0.16em] uppercase font-medium hover:bg-white transition-colors"
          >
            <span>START USING</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* ── Editorial Footer ─────────────────────────────────── */}
      <footer className="border-t border-neutral-800 bg-black text-neutral-500 py-8">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] tracking-[0.2em] uppercase">
          <span>CONTRACTLENS © 2026</span>
          <div className="flex gap-6">
            <Link to="/" className="hover:text-white transition-colors">HOME</Link>
            <button onClick={handleStartUsing} className="hover:text-white transition-colors cursor-pointer">START USING</button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AboutUs;
