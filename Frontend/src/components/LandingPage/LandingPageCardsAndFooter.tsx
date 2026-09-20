import React, { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useAuth } from '../../context/AuthContext';
import { AlertTriangle, ArrowUpRight } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export const LandingPageCardsAndFooter: React.FC = () => {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const sectionRef = useRef<HTMLDivElement | null>(null);
  const card1Ref = useRef<HTMLDivElement | null>(null);
  const card2Ref = useRef<HTMLDivElement | null>(null);
  const card3Ref = useRef<HTMLDivElement | null>(null);

  const handleStartUsing = () => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  useEffect(() => {
    const section = sectionRef.current;
    const c1 = card1Ref.current;
    const c2 = card2Ref.current;
    const c3 = card3Ref.current;
    if (!section || !c1 || !c2 || !c3) return;

    const ctx = gsap.context(() => {
      // Pin the section while the 3 cards stack on top of each other
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: '+=350%',
          pin: true,
          scrub: 0.8,
          anticipatePin: 1
        }
      });

      // Initial positions:
      // Card 1 is positioned at top
      // Card 2 and Card 3 start below viewport
      gsap.set(c1, { y: '0%', scale: 1 });
      gsap.set(c2, { y: '110%', scale: 0.96 });
      gsap.set(c3, { y: '110%', scale: 0.96 });

      // Card 2 (LIME) rises up and stacks over Card 1 with slight offset
      tl.to(c2, {
        y: '5vh',
        scale: 1,
        duration: 1.2,
        ease: 'power2.out'
      });
      // Card 1 scales down slightly to emphasize stacking depth
      tl.to(c1, {
        scale: 0.96,
        y: '-2vh',
        duration: 1.2,
        ease: 'power2.out'
      }, '<');

      // Hold Card 2
      tl.to({}, { duration: 0.4 });

      // Card 3 (BLACK) rises up and stacks over Card 2
      tl.to(c3, {
        y: '10vh',
        scale: 1,
        duration: 1.2,
        ease: 'power2.out'
      });
      // Card 2 scales down slightly
      tl.to(c2, {
        scale: 0.97,
        y: '3vh',
        duration: 1.2,
        ease: 'power2.out'
      }, '<');

      // Hold stacked cards before continuing scroll to footer
      tl.to({}, { duration: 0.6 });
    }, section);

    return () => {
      ctx.revert();
    };
  }, []);

  return (
    <div className="w-full bg-[#ffffff] text-black">
      {/* ── Section Narrative Header ─────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12 pt-28 pb-16 text-center">
        <span className="text-xs md:text-sm tracking-[0.28em] uppercase text-neutral-500 block mb-4 font-medium">
          SO WHAT DO YOU DO WITH IT?
        </span>
        <h2 className="text-4xl sm:text-6xl md:text-7xl font-medium tracking-tight uppercase leading-[0.95] text-black">
          SEE WHAT YOUR CONTRACT HIDES.
        </h2>
        <p className="mt-6 text-base md:text-xl text-neutral-600 max-w-2xl mx-auto font-normal">
          ContractLens reveals it → organizes it → helps you act on it before it costs you.
        </p>
      </div>

      {/* ── 3 Overlapping Stacking Cards Canvas ──────────── */}
      <div
        ref={sectionRef}
        className="relative w-full h-screen overflow-hidden flex items-center justify-center"
      >
        {/* CARD 01 — WHITE (01 / UNDERSTAND) */}
        <div
          ref={card1Ref}
          className="absolute w-[92vw] md:w-[88vw] max-w-6xl h-[78vh] bg-white text-black border-2 border-black p-6 md:p-12 flex flex-col justify-between shadow-2xl rounded-2xl md:rounded-3xl"
        >
          <div>
            <div className="flex items-center justify-between border-b border-black pb-4 mb-6">
              <span className="text-xs font-mono tracking-[0.22em] uppercase font-semibold text-black">
                01 / UNDERSTAND
              </span>
              <span className="text-[11px] tracking-[0.2em] uppercase text-neutral-500 font-medium">
                STEP 01
              </span>
            </div>

            <h3 className="text-4xl sm:text-6xl md:text-7xl font-medium tracking-tight uppercase leading-[0.92] text-black mb-6">
              SEE<br />THE RISK.
            </h3>

            <p className="text-base md:text-lg text-neutral-700 max-w-2xl font-normal leading-relaxed mb-8">
              Contracts bury important details in pages of legal language. ContractLens surfaces the clauses that deserve your attention.
            </p>

            {/* Editorial Mini Risk Preview */}
            <div className="border-t border-black pt-4 max-w-3xl">
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-neutral-400 block mb-3">
                RISK ANALYSIS PREVIEW
              </span>
              <div className="space-y-2.5">
                {[
                  { name: 'LIMITATION OF LIABILITY', level: 'CRITICAL', badge: 'bg-black text-white' },
                  { name: 'DATA PROTECTION', level: 'HIGH', badge: 'border border-black text-black' },
                  { name: 'SERVICE LEVEL', level: 'HIGH', badge: 'border border-black text-black' },
                  { name: 'TERMINATION', level: 'HIGH', badge: 'border border-black text-black' }
                ].map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-xs md:text-sm font-medium">
                    <span>{item.name}</span>
                    <span className={`text-[10px] px-2 py-0.5 tracking-wider uppercase font-semibold ${item.badge}`}>
                      {item.level}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-neutral-200 text-xs font-mono uppercase tracking-[0.22em] text-neutral-500">
            CLAUSES · RISK · RED FLAGS
          </div>
        </div>

        {/* CARD 02 — #D3FD50 LIME (02 / TRACK) */}
        <div
          ref={card2Ref}
          className="absolute w-[92vw] md:w-[88vw] max-w-6xl h-[78vh] bg-[#D3FD50] text-black border-2 border-black p-6 md:p-12 flex flex-col justify-between shadow-2xl rounded-2xl md:rounded-3xl"
        >
          <div>
            <div className="flex items-center justify-between border-b border-black pb-4 mb-6">
              <span className="text-xs font-mono tracking-[0.22em] uppercase font-semibold text-black">
                02 / TRACK
              </span>
              <span className="text-[11px] tracking-[0.2em] uppercase text-black/70 font-medium">
                STEP 02
              </span>
            </div>

            <h3 className="text-4xl sm:text-6xl md:text-7xl font-medium tracking-tight uppercase leading-[0.92] text-black mb-6">
              TRACK<br />WHAT'S DUE.
            </h3>

            <p className="text-base md:text-lg text-black/85 max-w-2xl font-normal leading-relaxed mb-8">
              Turn obligations buried inside a contract into actionable items you can actually follow and calendar.
            </p>

            {/* Editorial Mini Obligation List */}
            <div className="border-t border-black pt-4 max-w-3xl">
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-black/60 block mb-3">
                EXTRACTED OBLIGATIONS
              </span>
              <div className="space-y-3">
                {[
                  { party: 'VENDOR', text: 'Provide monthly service & SLA report', due: '30 SEP' },
                  { party: 'CLIENT', text: 'Payment of quarterly recurring invoice', due: '15 OCT' },
                  { party: 'VENDOR', text: 'Security incident notification window', due: 'ON EVENT' },
                  { party: 'CLIENT', text: 'Formal non-renewal notice window', due: '01 JUL' }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs md:text-sm font-medium border-b border-black/10 pb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 bg-black text-[#D3FD50]">
                        {item.party}
                      </span>
                      <span className="text-black font-normal">{item.text}</span>
                    </div>
                    <span className="font-mono text-xs font-semibold">{item.due}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-black/20 text-xs font-mono uppercase tracking-[0.22em] text-black/70">
            OBLIGATIONS · DEADLINES · RENEWALS
          </div>
        </div>

        {/* CARD 03 — BLACK (03 / ACT) */}
        <div
          ref={card3Ref}
          className="absolute w-[92vw] md:w-[88vw] max-w-6xl h-[78vh] bg-[#000000] text-white border-2 border-neutral-800 p-6 md:p-12 flex flex-col justify-between shadow-2xl rounded-2xl md:rounded-3xl"
        >
          <div>
            <div className="flex items-center justify-between border-b border-neutral-800 pb-4 mb-6">
              <span className="text-xs font-mono tracking-[0.22em] uppercase font-semibold text-[#D3FD50]">
                03 / ACT
              </span>
              <span className="text-[11px] tracking-[0.2em] uppercase text-neutral-400 font-medium">
                STEP 03
              </span>
            </div>

            <h3 className="text-4xl sm:text-6xl md:text-7xl font-medium tracking-tight uppercase leading-[0.92] text-white mb-6">
              ACT BEFORE<br />IT MATTERS.
            </h3>

            <p className="text-base md:text-lg text-neutral-300 max-w-2xl font-normal leading-relaxed mb-8">
              Get the signal when something needs attention — before a deadline, renewal, or risky clause becomes an expensive surprise.
            </p>

            {/* Notification Style Visual */}
            <div className="border border-neutral-800 bg-neutral-950 p-5 md:p-6 max-w-2xl">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-neutral-800">
                <div className="flex items-center gap-2.5 text-[#D3FD50]">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-xs font-mono uppercase tracking-widest font-semibold">
                    HIGH RISK ALERT
                  </span>
                </div>
                <span className="text-xs font-mono text-neutral-400">
                  SCORE: 78% / HIGH
                </span>
              </div>

              <p className="text-xs uppercase tracking-wider text-neutral-400 mb-3">
                4 ITEMS DESERVE IMMEDIATE ATTENTION:
              </p>
              <div className="space-y-1.5 text-xs md:text-sm text-neutral-200">
                <p className="flex items-center gap-2">
                  <span className="text-[#D3FD50]">→</span> Review liability cap against 3-month fees
                </p>
                <p className="flex items-center gap-2">
                  <span className="text-[#D3FD50]">→</span> Clarify data protection breach notification window
                </p>
                <p className="flex items-center gap-2">
                  <span className="text-[#D3FD50]">→</span> Calendar 120-day automatic renewal deadline
                </p>
                <p className="flex items-center gap-2">
                  <span className="text-[#D3FD50]">→</span> Review SLA outage remedies and dispute clauses
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-neutral-800 text-xs font-mono uppercase tracking-[0.22em] text-[#D3FD50]">
            ALERTS · REVIEW · DECISIONS
          </div>
        </div>
      </div>

      {/* ── Editorial Footer (Inspired by Converto Reference) ──────── */}
      <div className="w-full flex justify-center px-3 sm:px-6 py-16 md:py-24 bg-[#ffffff]">
        <div className="w-[95vw] rounded-3xl bg-[#000000] text-white p-8 md:p-16 relative overflow-hidden">
          {/* Top Section with Brand & Links Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16 relative z-10">
            {/* Brand Column */}
            <div className="md:col-span-4 space-y-4">
              <h4 className="text-2xl font-bold uppercase tracking-wider text-white">
                CONTRACTLENS
              </h4>
              <p className="text-sm text-neutral-400 leading-relaxed max-w-sm">
                AI-powered contract risk analysis and obligation intelligence. Turn dense legal agreements into structured, actionable insight.
              </p>
            </div>

            {/* Navigation Columns */}
            <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-8">
              {/* Quick Links */}
              <div>
                <p className="text-xs font-mono uppercase tracking-widest text-neutral-400 mb-4">
                  PRODUCT
                </p>
                <ul className="space-y-2.5 text-sm">
                  {isAuthenticated ? (
                    <>
                      <li>
                        <Link to="/dashboard" className="text-neutral-300 hover:text-[#D3FD50] transition-colors">
                          Dashboard
                        </Link>
                      </li>
                      <li>
                        <Link to="/upload" className="text-neutral-300 hover:text-[#D3FD50] transition-colors">
                          Upload Contract
                        </Link>
                      </li>
                      <li>
                        <button
                          onClick={handleLogout}
                          className="text-neutral-300 hover:text-[#FF4D4D] transition-colors cursor-pointer text-left"
                        >
                          Log Out
                        </button>
                      </li>
                    </>
                  ) : (
                    <>
                      <li>
                        <Link to="/login" className="text-neutral-300 hover:text-[#D3FD50] transition-colors">
                          Log In
                        </Link>
                      </li>
                      <li>
                        <Link to="/register" className="text-neutral-300 hover:text-[#D3FD50] transition-colors">
                          Register
                        </Link>
                      </li>
                      <li>
                        <button
                          onClick={handleStartUsing}
                          className="text-neutral-300 hover:text-[#D3FD50] transition-colors cursor-pointer text-left"
                        >
                          Start Using →
                        </button>
                      </li>
                    </>
                  )}
                </ul>
              </div>

              {/* Company */}
              <div>
                <p className="text-xs font-mono uppercase tracking-widest text-neutral-400 mb-4">
                  COMPANY
                </p>
                <ul className="space-y-2.5 text-sm">
                  <li>
                    <Link to="/about" className="text-neutral-300 hover:text-[#D3FD50] transition-colors">
                      About Us
                    </Link>
                  </li>
                  <li>
                    <a
                      href="https://www.linkedin.com/in/achyut-pandey-122a87323"
                      target="_blank"
                      rel="noreferrer"
                      className="text-neutral-300 hover:text-[#D3FD50] transition-colors inline-flex items-center gap-1"
                    >
                      Connect with Me
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </a>
                  </li>
                </ul>
              </div>

              {/* Legal / Meta */}
              <div>
                <p className="text-xs font-mono uppercase tracking-widest text-neutral-400 mb-4">
                  RESOURCES
                </p>
                <ul className="space-y-2.5 text-sm">
                  <li>
                    <Link to="/about" className="text-neutral-300 hover:text-[#D3FD50] transition-colors">
                      How It Works
                    </Link>
                  </li>
                  <li>
                    <span className="text-neutral-500">Privacy & Terms</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Divider and Copyright */}
          <div className="pt-8 border-t border-neutral-800 flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-400 gap-4 relative z-10">
            <span>© 2026 ContractLens. All rights reserved.</span>
            <span>Empowering human review with multi-agent AI.</span>
          </div>

          {/* Big Brand Accent Display fitting cleanly within 95vw card */}
          <div className="mt-12 select-none pointer-events-none overflow-hidden flex justify-center w-full">
            <h2 className="text-[12.8vw] font-black tracking-tight uppercase leading-none text-[#D3FD50] opacity-90 transition-opacity whitespace-nowrap text-center">
              CONTRACTLENS
            </h2>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPageCardsAndFooter;
