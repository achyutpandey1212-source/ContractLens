import React, { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useAuth } from '../../context/AuthContext';
import { ArrowRight, AlertTriangle, FileText, Clock } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export const EditorialScrollCard: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const containerRef = useRef<HTMLDivElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);

  // Checkpoints refs
  const ch1Ref = useRef<HTMLDivElement | null>(null);
  const ch2Ref = useRef<HTMLDivElement | null>(null);
  const ch3Ref = useRef<HTMLDivElement | null>(null);
  const ch4Ref = useRef<HTMLDivElement | null>(null);
  const ch5Ref = useRef<HTMLDivElement | null>(null);
  const ch6Ref = useRef<HTMLDivElement | null>(null);
  const ch7Ref = useRef<HTMLDivElement | null>(null);

  const handleStartUsing = () => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  useEffect(() => {
    const card = cardRef.current;
    const container = containerRef.current;
    if (!card || !container) return;

    // Timeline for card arrival + chapter transitions pinned in viewport
    const ctx = gsap.context(() => {
      // 1. First: Entry animation of the 95vw white card rising over the video
      // Card starts translation from 100vh down to top: 4vh
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: container,
          start: 'top top',
          end: '+=600%', // 6 screen heights of smooth scrubbed narrative
          scrub: 0.8,
          pin: true,
          anticipatePin: 1
        }
      });

      // Initial state of card: offscreen bottom
      gsap.set(card, { y: '100vh', opacity: 0.95 });

      // Initial state of chapters
      const chapters = [
        ch1Ref.current,
        ch2Ref.current,
        ch3Ref.current,
        ch4Ref.current,
        ch5Ref.current,
        ch6Ref.current,
        ch7Ref.current
      ];

      // Chapter 1 starts invisible until card enters ~25%
      gsap.set(chapters, { autoAlpha: 0, y: 30, display: 'none' });
      gsap.set(ch1Ref.current, { autoAlpha: 0, y: 30, display: 'block' });

      // Step 1: Card rises up into view (leaves 4vh space at top, rounded top corners)
      tl.to(card, {
        y: '4vh',
        opacity: 1,
        duration: 1.2,
        ease: 'power2.out'
      });

      // Chapter 1 fades in when card is established
      tl.to(ch1Ref.current, {
        autoAlpha: 1,
        y: 0,
        duration: 0.8,
        ease: 'power2.out'
      }, '-=0.4');

      // Hold Chapter 1 briefly
      tl.to({}, { duration: 0.5 });

      // Transition Ch1 -> Ch2 (The Pain)
      tl.to(ch1Ref.current, { autoAlpha: 0, y: -20, duration: 0.4, ease: 'power2.in' })
        .set(ch1Ref.current, { display: 'none' })
        .set(ch2Ref.current, { display: 'block' })
        .fromTo(ch2Ref.current, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power2.out' });

      // Stagger rows in Chapter 2
      const painRows = ch2Ref.current?.querySelectorAll('.pain-row');
      if (painRows && painRows.length) {
        tl.fromTo(painRows, 
          { autoAlpha: 0, x: -20 },
          { autoAlpha: 1, x: 0, stagger: 0.25, duration: 0.8, ease: 'power2.out' }
        );
      }

      // Hold Chapter 2
      tl.to({}, { duration: 0.6 });

      // Transition Ch2 -> Ch3 (Introduce ContractLens)
      tl.to(ch2Ref.current, { autoAlpha: 0, y: -20, duration: 0.4, ease: 'power2.in' })
        .set(ch2Ref.current, { display: 'none' })
        .set(ch3Ref.current, { display: 'block' })
        .fromTo(ch3Ref.current, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power2.out' });

      // Hold Chapter 3
      tl.to({}, { duration: 0.5 });

      // Transition Ch3 -> Ch4 (Show the Intelligence)
      tl.to(ch3Ref.current, { autoAlpha: 0, y: -20, duration: 0.4, ease: 'power2.in' })
        .set(ch3Ref.current, { display: 'none' })
        .set(ch4Ref.current, { display: 'block' })
        .fromTo(ch4Ref.current, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power2.out' });

      // Sequential reveal of analysis: 78% -> CRITICAL -> HIGH -> HIGH -> HIGH
      const riskScoreEl = ch4Ref.current?.querySelector('.analysis-score');
      const analysisRows = ch4Ref.current?.querySelectorAll('.analysis-row');
      if (riskScoreEl) {
        tl.fromTo(riskScoreEl, { scale: 0.9, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.5, ease: 'back.out(1.4)' });
      }
      if (analysisRows && analysisRows.length) {
        tl.fromTo(analysisRows,
          { autoAlpha: 0, y: 15 },
          { autoAlpha: 1, y: 0, stagger: 0.25, duration: 0.7, ease: 'power2.out' }
        );
      }

      // Hold Chapter 4
      tl.to({}, { duration: 0.6 });

      // Transition Ch4 -> Ch5 (From Documents -> Action)
      tl.to(ch4Ref.current, { autoAlpha: 0, y: -20, duration: 0.4, ease: 'power2.in' })
        .set(ch4Ref.current, { display: 'none' })
        .set(ch5Ref.current, { display: 'block' })
        .fromTo(ch5Ref.current, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power2.out' });

      // Stagger action pillars
      const actionPillars = ch5Ref.current?.querySelectorAll('.action-pillar');
      if (actionPillars && actionPillars.length) {
        tl.fromTo(actionPillars,
          { autoAlpha: 0, y: 20 },
          { autoAlpha: 1, y: 0, stagger: 0.2, duration: 0.7, ease: 'power2.out' }
        );
      }

      // Hold Chapter 5
      tl.to({}, { duration: 0.5 });

      // Transition Ch5 -> Ch6 (The Money Connection)
      tl.to(ch5Ref.current, { autoAlpha: 0, y: -20, duration: 0.4, ease: 'power2.in' })
        .set(ch5Ref.current, { display: 'none' })
        .set(ch6Ref.current, { display: 'block' })
        .fromTo(ch6Ref.current, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power2.out' });

      // Hold Chapter 6
      tl.to({}, { duration: 0.5 });

      // Transition Ch6 -> Ch7 (End the card with the CTA)
      tl.to(ch6Ref.current, { autoAlpha: 0, y: -20, duration: 0.4, ease: 'power2.in' })
        .set(ch6Ref.current, { display: 'none' })
        .set(ch7Ref.current, { display: 'block' })
        .fromTo(ch7Ref.current, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power2.out' });

      // Hold Chapter 7
      tl.to({}, { duration: 0.8 });
    }, container);

    return () => {
      ctx.revert();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-screen pointer-events-none z-30 flex justify-center"
    >
      {/* ── 95vw White Editorial Canvas ────────────────── */}
      <div
        ref={cardRef}
        className="w-[95vw] h-[92vh] max-w-7xl bg-white text-black shadow-2xl rounded-t-2xl md:rounded-t-3xl border-t border-x border-neutral-200 pointer-events-auto flex flex-col justify-between overflow-hidden relative"
      >
        {/* Top Minimal Bar */}
        <div className="h-12 border-b border-black px-6 md:px-10 flex items-center justify-between shrink-0">
          <span className="text-[10px] tracking-[0.25em] uppercase font-medium">
            CHAPTER 01 / WHY CONTRACTLENS
          </span>
          <span className="text-[10px] tracking-[0.25em] uppercase text-neutral-400">
            SCROLL TO EXPLORE
          </span>
        </div>

        {/* Content Container (Houses the scrubbed narrative checkpoints) */}
        <div className="flex-1 px-6 md:px-16 py-6 md:py-10 flex flex-col justify-center relative overflow-hidden">
          
          {/* ── 01: THE INTERRUPTION ─────────────────────── */}
          <div ref={ch1Ref} className="w-full max-w-4xl">
            <span className="text-xs md:text-sm tracking-[0.28em] uppercase text-neutral-500 block mb-4 font-medium">
              CONTRACTS ARE EVERYWHERE.
            </span>
            <h2 className="text-5xl sm:text-6xl md:text-8xl lg:text-[7.5rem] font-medium tracking-tight uppercase leading-[0.9] text-black">
              THE DETAILS<br />AREN’T.
            </h2>
            <p className="mt-8 text-base md:text-xl text-neutral-600 max-w-2xl font-normal leading-relaxed">
              Important obligations, deadlines, and risks are often buried inside documents nobody has time to read twice.
            </p>
          </div>

          {/* ── 02: THE PAIN ─────────────────────────────── */}
          <div ref={ch2Ref} className="w-full max-w-5xl">
            <h2 className="text-3xl sm:text-4xl md:text-6xl font-medium tracking-tight uppercase leading-[1.05] mb-8 text-black">
              ONE MISSED CLAUSE<br />
              <span className="text-neutral-400">CAN COST MORE THAN THE CONTRACT.</span>
            </h2>

            <div className="border-t border-black">
              {[
                { num: '01', title: 'MISSED RENEWAL', desc: 'Auto-renewal clauses trigger unwanted annual terms before anyone notices.' },
                { num: '02', title: 'UNCLEAR LIABILITY', desc: 'Uncapped or unbalanced indemnity clauses shift existential risk onto your team.' },
                { num: '03', title: 'UNTRACKED OBLIGATION', desc: 'Audit deliverables and service commitments forgotten in the fine print.' },
                { num: '04', title: 'HIDDEN COST', desc: 'Early termination fees and escalating rates quietly eroding margins.' }
              ].map((item) => (
                <div
                  key={item.num}
                  className="pain-row py-3.5 md:py-4 border-b border-neutral-200 flex flex-col md:flex-row md:items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-mono text-neutral-400">{item.num}</span>
                    <span className="text-base sm:text-lg md:text-xl font-medium uppercase tracking-tight text-black">
                      {item.title}
                    </span>
                  </div>
                  <span className="text-xs md:text-sm text-neutral-500 max-w-md font-normal">
                    {item.desc}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ── 03: INTRODUCE CONTRACTLENS ───────────────── */}
          <div ref={ch3Ref} className="w-full max-w-4xl">
            <span className="text-xs md:text-sm tracking-[0.28em] uppercase text-neutral-500 block mb-4 font-medium">
              SO WE BUILT CONTRACTLENS.
            </span>
            <h2 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-medium tracking-tight uppercase leading-[0.95] text-black">
              TURN CONTRACTS<br />
              INTO SOMETHING<br />
              <span className="underline decoration-4 underline-offset-8 decoration-[#D3FD50]">YOU CAN ACT ON.</span>
            </h2>
            <p className="mt-8 text-base md:text-xl text-neutral-700 max-w-2xl font-normal leading-relaxed">
              Upload a contract. ContractLens uses AI to identify important clauses, risks, obligations, and deadlines — and turns them into structured intelligence.
            </p>
          </div>

          {/* ── 04: SHOW THE INTELLIGENCE ─────────────────── */}
          <div ref={ch4Ref} className="w-full max-w-5xl">
            <div className="flex items-center justify-between border-b border-black pb-3 mb-6">
              <span className="text-[11px] tracking-[0.22em] uppercase font-medium text-black">
                CONTRACT ANALYSIS
              </span>
              <span className="text-[11px] tracking-[0.22em] uppercase text-neutral-400">
                01 / 04 — CLOUD SERVICES AGREEMENT
              </span>
            </div>

            {/* Editorial Score Banner */}
            <div className="analysis-score flex items-baseline gap-4 mb-6">
              <span className="text-5xl sm:text-6xl md:text-7xl font-medium tracking-tight leading-none text-black">
                78%
              </span>
              <span className="text-xs md:text-sm uppercase tracking-[0.2em] font-medium px-3 py-1 bg-black text-[#D3FD50]">
                HIGH RISK DETECTED
              </span>
            </div>

            {/* Editorial Clause List */}
            <div className="border-t border-black">
              {[
                {
                  idx: '01',
                  name: 'LIABILITY',
                  level: 'CRITICAL',
                  badgeBg: 'bg-black text-white',
                  text: 'Liability capped at previous three months’ fees. Disproportionate exposure.'
                },
                {
                  idx: '02',
                  name: 'DATA PROTECTION',
                  level: 'HIGH',
                  badgeBg: 'border border-black text-black',
                  text: 'Security obligations and breach notification windows are insufficiently defined.'
                },
                {
                  idx: '03',
                  name: 'SERVICE LEVEL',
                  level: 'HIGH',
                  badgeBg: 'border border-black text-black',
                  text: 'No meaningful financial or termination remedy for missed uptime targets.'
                },
                {
                  idx: '04',
                  name: 'TERMINATION',
                  level: 'HIGH',
                  badgeBg: 'border border-black text-black',
                  text: 'Automatic renewal with rigid 120-day written notice requirement.'
                }
              ].map((row) => (
                <div
                  key={row.idx}
                  className="analysis-row py-3 md:py-3.5 border-b border-neutral-200 grid grid-cols-12 gap-4 items-center"
                >
                  <div className="col-span-4 md:col-span-3 flex items-center gap-3">
                    <span className="text-xs font-mono text-neutral-400">{row.idx}</span>
                    <span className="text-sm md:text-base font-medium uppercase tracking-tight text-black">
                      {row.name}
                    </span>
                  </div>
                  <div className="col-span-8 md:col-span-7">
                    <p className="text-xs md:text-sm text-neutral-600 leading-snug">
                      {row.text}
                    </p>
                  </div>
                  <div className="col-span-12 md:col-span-2 flex md:justify-end mt-1 md:mt-0">
                    <span className={`text-[10px] tracking-[0.15em] uppercase font-medium px-2 py-0.5 ${row.badgeBg}`}>
                      {row.level}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── 05: FROM DOCUMENTS -> ACTION ─────────────── */}
          <div ref={ch5Ref} className="w-full max-w-5xl">
            <h2 className="text-4xl sm:text-5xl md:text-7xl font-medium tracking-tight uppercase leading-none mb-10 text-black">
              KNOW WHAT<br />
              <span className="text-neutral-400">NEEDS YOUR ATTENTION.</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  title: 'SEE',
                  desc: 'Find the clauses that matter across hundreds of dense pages in seconds.',
                  icon: FileText
                },
                {
                  title: 'TRACK',
                  desc: 'Know who owes what, exact milestones, deliverables, and calendar dates.',
                  icon: Clock
                },
                {
                  title: 'ACT',
                  desc: 'Get alerted to non-standard liabilities before agreements become expensive.',
                  icon: AlertTriangle
                }
              ].map((col) => {
                const IconComponent = col.icon;
                return (
                  <div
                    key={col.title}
                    className="action-pillar border border-black p-6 md:p-8 flex flex-col justify-between hover:bg-[#D3FD50]/10 transition-colors"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-6">
                        <span className="text-2xl font-medium uppercase tracking-tight text-black">
                          {col.title}
                        </span>
                        <IconComponent className="w-6 h-6 text-black" strokeWidth={1.5} />
                      </div>
                      <p className="text-sm md:text-base text-neutral-600 leading-relaxed font-normal">
                        {col.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 flex flex-wrap gap-4 text-xs font-mono uppercase tracking-[0.2em] text-neutral-400">
              <span>[ RISK ]</span>
              <span>[ OBLIGATIONS ]</span>
              <span>[ DEADLINES ]</span>
              <span>[ ALERTS ]</span>
            </div>
          </div>

          {/* ── 06: THE MONEY CONNECTION ─────────────────── */}
          <div ref={ch6Ref} className="w-full max-w-5xl">
            <span className="text-xs md:text-sm tracking-[0.28em] uppercase text-neutral-500 block mb-4 font-medium">
              MEASURABLE CLARITY
            </span>
            <h2 className="text-3xl sm:text-5xl md:text-7xl font-medium tracking-tight uppercase leading-[0.98] mb-8 text-black">
              THE CHEAPEST CONTRACT REVIEW<br />
              IS THE ONE YOU DON’T HAVE TO REPEAT.
            </h2>
            <p className="text-base md:text-lg text-neutral-700 max-w-2xl font-normal leading-relaxed mb-8">
              ContractLens helps teams spend less time searching through agreements and reduces the chance of missed deadlines, overlooked obligations, and costly surprises.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-black pt-6">
              <div>
                <p className="text-xs font-mono text-neutral-400 uppercase tracking-widest">TIME</p>
                <p className="text-lg font-medium text-black mt-1">Manual Review ↓</p>
                <p className="text-xs text-neutral-500 mt-0.5">Automated clause extraction</p>
              </div>
              <div>
                <p className="text-xs font-mono text-neutral-400 uppercase tracking-widest">RISK</p>
                <p className="text-lg font-medium text-black mt-1">Missed Details ↓</p>
                <p className="text-xs text-neutral-500 mt-0.5">High-confidence benchmarks</p>
              </div>
              <div>
                <p className="text-xs font-mono text-neutral-400 uppercase tracking-widest">COST</p>
                <p className="text-lg font-medium text-black mt-1">Avoidable Surprises ↓</p>
                <p className="text-xs text-neutral-500 mt-0.5">Proactive calendar notifications</p>
              </div>
            </div>

            <p className="mt-8 text-xl md:text-2xl font-medium tracking-tight uppercase text-black">
              LESS SEARCHING. MORE KNOWING.
            </p>
          </div>

          {/* ── 07: END WITH CTA ─────────────────────────── */}
          <div ref={ch7Ref} className="w-full max-w-4xl">
            <span className="text-xs md:text-sm tracking-[0.28em] uppercase text-neutral-500 block mb-3 font-medium">
              START LISTENING
            </span>
            <h2 className="text-4xl sm:text-6xl md:text-8xl font-medium tracking-tight uppercase leading-[0.9] text-black mb-8">
              YOUR CONTRACTS<br />ARE ALREADY TALKING.
            </h2>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-4">
              <button
                onClick={handleStartUsing}
                className="cursor-pointer px-8 py-4 bg-black text-white text-xs md:text-sm tracking-[0.18em] uppercase font-medium hover:bg-[#D3FD50] hover:text-black transition-colors flex items-center justify-center gap-3"
              >
                <span>START USING</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <Link
                to="/about"
                className="px-8 py-4 border border-black text-black text-xs md:text-sm tracking-[0.18em] uppercase font-medium hover:bg-neutral-100 transition-colors flex items-center justify-center"
              >
                ABOUT US →
              </Link>
            </div>
          </div>

        </div>

        {/* Bottom Editorial Footer */}
        <div className="h-12 border-t border-neutral-200 px-6 md:px-10 flex items-center justify-between text-[10px] tracking-[0.2em] uppercase text-neutral-400 shrink-0">
          <span>CONTRACTLENS INTELLIGENCE</span>
          <span>EST. 2026</span>
        </div>
      </div>
    </div>
  );
};

export default EditorialScrollCard;
