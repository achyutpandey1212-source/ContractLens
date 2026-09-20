import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import gsap from 'gsap';

export const PageTransition: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const barsRef = useRef<(HTMLDivElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);
  
  // Track displayed content to swap route content while screen is covered
  const [displayLocation, setDisplayLocation] = useState(location);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (location.pathname === displayLocation.pathname) {
      return;
    }

    const bars = barsRef.current.filter(Boolean) as HTMLDivElement[];
    if (bars.length !== 5 || !containerRef.current) {
      setDisplayLocation(location);
      return;
    }

    // Enable pointer events while animating
    containerRef.current.style.pointerEvents = 'auto';

    // 5 bars ordered from 0 (left: 0%) to 4 (right: 80%)
    // The staircase must start from rightmost div coming down first.
    // So right-to-left order: indices [4, 3, 2, 1, 0]
    const reversedBars = [...bars].reverse();

    // Reset initial positions for entry: above screen
    gsap.set(bars, { y: '-100%', autoAlpha: 1 });

    const tl = gsap.timeline({
      onComplete: () => {
        if (containerRef.current) {
          containerRef.current.style.pointerEvents = 'none';
        }
      }
    });

    // Phase 1: Closing screen (top to bottom).
    // Rightmost bar starts first (stagger 0.05s, duration 0.28s ~ total ~0.35s)
    tl.to(reversedBars, {
      y: '0%',
      duration: 0.28,
      ease: 'power3.inOut',
      stagger: 0.04
    });

    // Midpoint: screen is now completely covered by the 5 black bars. Swap the visible page content.
    tl.add(() => {
      setDisplayLocation(location);
      window.scrollTo(0, 0);
    });

    // Small pause to settle
    tl.to({}, { duration: 0.03 });

    // Phase 2: Opening screen (down to up, exit towards top or bottom?
    // "subsequently make the divs go from down to up, again the rightmost div goes up first."
    // Going from 0% to -100% means moving upwards offscreen.
    // Rightmost bar goes up first again!
    tl.to(reversedBars, {
      y: '-100%',
      duration: 0.28,
      ease: 'power3.inOut',
      stagger: 0.04
    });

  }, [location, displayLocation.pathname]);

  return (
    <>
      {/* 5 Vertical Rectangular Divs covering screen */}
      <div
        ref={containerRef}
        className="fixed inset-0 z-[9999] pointer-events-none flex w-screen h-screen overflow-hidden"
        aria-hidden="true"
      >
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            ref={(el) => {
              barsRef.current[i] = el;
            }}
            className="w-[20vw] h-full bg-[#000000] shrink-0"
            style={{ transform: 'translateY(-100%)' }}
          />
        ))}
      </div>

      {children}
    </>
  );
};
