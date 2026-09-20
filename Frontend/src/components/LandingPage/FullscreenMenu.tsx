import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { useAuth } from '../../context/AuthContext';
import { X } from 'lucide-react';

interface FullscreenMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MenuItem {
  id: string;
  label: string;
  marqueeText: string;
  action: () => void;
  isLogout?: boolean;
}

export const FullscreenMenu: React.FC<FullscreenMenuProps> = ({ isOpen, onClose }) => {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const containerRef = useRef<HTMLDivElement | null>(null);
  const barsRef = useRef<(HTMLDivElement | null)[]>([]);
  const contentRef = useRef<HTMLDivElement | null>(null);

  // Active state to track when menu is visible in DOM
  const [mounted, setMounted] = useState(isOpen);
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);

  const handleNavigate = (path: string) => {
    handleClose(() => navigate(path));
  };

  const handleLogout = async () => {
    handleClose(async () => {
      await logout();
      navigate('/');
    });
  };

  // Build menu options based on auth state
  const unauthenticatedItems: MenuItem[] = [
    {
      id: 'login',
      label: 'LOGIN',
      marqueeText: '✦ LOG IN TO YOUR ACCOUNT ✦ CONTRACT INTELLIGENCE ✦ ACCESS DASHBOARD',
      action: () => handleNavigate('/login')
    },
    {
      id: 'register',
      label: 'REGISTER',
      marqueeText: '✦ CREATE AN ACCOUNT ✦ ZERO RISK OVERSIGHT ✦ GET STARTED TODAY',
      action: () => handleNavigate('/register')
    },
    {
      id: 'about',
      label: 'ABOUT US',
      marqueeText: '✦ WHY CONTRACTLENS ✦ OUR STORY ✦ EXPOSE HIDDEN RISKS',
      action: () => handleNavigate('/about')
    },
    {
      id: 'connect',
      label: 'CONNECT WITH ME',
      marqueeText: '✦ GET IN TOUCH ✦ SAY HELLO ✦ PARTNERSHIPS & COLLABORATION',
      action: () => {
        window.open('https://github.com', '_blank');
      }
    }
  ];

  const authenticatedItems: MenuItem[] = [
    {
      id: 'dashboard',
      label: 'DASHBOARD',
      marqueeText: '✦ CONTRACT OVERVIEW ✦ RISK SCORES ✦ ACTIVE AGREEMENTS',
      action: () => handleNavigate('/dashboard')
    },
    {
      id: 'upload',
      label: 'UPLOAD DOCUMENT',
      marqueeText: '✦ ANALYZE A CONTRACT ✦ MULTI-AGENT INGESTION ✦ EXTRACT CLAUSES',
      action: () => handleNavigate('/upload')
    },
    {
      id: 'about',
      label: 'ABOUT US',
      marqueeText: '✦ WHY CONTRACTLENS ✦ OUR STORY ✦ EXPOSE HIDDEN RISKS',
      action: () => handleNavigate('/about')
    },
    {
      id: 'connect',
      label: 'CONNECT WITH ME',
      marqueeText: '✦ GET IN TOUCH ✦ SAY HELLO ✦ PARTNERSHIPS & COLLABORATION',
      action: () => {
        window.open('https://github.com', '_blank');
      }
    },
    {
      id: 'logout',
      label: 'LOGOUT',
      marqueeText: '✦ SIGN OUT ✦ CLEAR SECURE SESSION ✦ SEE YOU SOON',
      action: handleLogout,
      isLogout: true
    }
  ];

  const currentItems = isAuthenticated ? authenticatedItems : unauthenticatedItems;

  // Open animation when isOpen becomes true
  useEffect(() => {
    if (isOpen) {
      setMounted(true);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!mounted || !containerRef.current) return;

    const bars = barsRef.current.filter(Boolean) as HTMLDivElement[];
    if (bars.length !== 5) return;

    const reversedBars = [...bars].reverse(); // Rightmost div comes down first

    if (isOpen) {
      // Staircase coming from top to bottom
      gsap.set(bars, { y: '-100%' });
      if (contentRef.current) gsap.set(contentRef.current, { autoAlpha: 0 });

      const tl = gsap.timeline();

      // Rightmost div comes down first (stagger 0.04s, duration 0.28s)
      tl.to(reversedBars, {
        y: '0%',
        duration: 0.28,
        ease: 'power3.inOut',
        stagger: 0.04
      });

      // Once bars cover screen, reveal content
      tl.to(contentRef.current, {
        autoAlpha: 1,
        duration: 0.2,
        ease: 'power2.out'
      });
    }
  }, [isOpen, mounted]);

  // Handle close sequence: bars go down to up (rightmost div goes up first)
  const handleClose = (callback?: () => void) => {
    const bars = barsRef.current.filter(Boolean) as HTMLDivElement[];
    if (bars.length !== 5 || !containerRef.current) {
      onClose();
      if (callback) callback();
      return;
    }

    const reversedBars = [...bars].reverse(); // Rightmost div goes up first
    const tl = gsap.timeline({
      onComplete: () => {
        setMounted(false);
        onClose();
        if (callback) callback();
      }
    });

    // Hide content immediately
    if (contentRef.current) {
      tl.to(contentRef.current, { autoAlpha: 0, duration: 0.15, ease: 'power2.in' });
    }

    // Rightmost div goes up first to -100%
    tl.to(reversedBars, {
      y: '-100%',
      duration: 0.28,
      ease: 'power3.inOut',
      stagger: 0.04
    });
  };

  if (!mounted) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[99999] overflow-hidden"
    >
      {/* 5 Vertical Rectangular Divs covering screen */}
      <div className="absolute inset-0 flex w-screen h-screen overflow-hidden pointer-events-none">
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

      {/* Menu Overlay Content */}
      <div
        ref={contentRef}
        className="relative z-10 w-full h-full bg-[#000000] text-white flex flex-col justify-between select-none"
        style={{ opacity: 0 }}
      >
        {/* Top Header Bar */}
        <div className="px-6 md:px-12 h-20 flex items-center justify-between border-b border-neutral-800">
          <span className="text-xl md:text-2xl font-black tracking-wider uppercase">
            CONTRACTLENS
          </span>

          {/* Close Button (Large X matching K72 design reference) */}
          <button
            onClick={() => handleClose()}
            className="w-12 h-12 flex items-center justify-center text-white hover:text-[#D3FD50] transition-colors cursor-pointer"
            aria-label="Close menu"
          >
            <X className="w-9 h-9" strokeWidth={1.5} />
          </button>
        </div>

        {/* Center Editorial Links with Marquee Hover Interaction */}
        <div className="flex-1 flex flex-col justify-center">
          <div className="border-t border-neutral-800">
            {currentItems.map((item) => {
              const isHovered = hoveredItemId === item.id;
              const isLogout = item.isLogout;

              // Hover styling:
              // Default item: bg-[#D3FD50], text-black
              // Logout item: bg-[#FF4D4D], text-black (a vibrant reddish shade complementing #D3FD50)
              const hoverBgClass = isLogout
                ? 'bg-[#FF4D4D] text-black'
                : 'bg-[#D3FD50] text-black';

              return (
                <div
                  key={item.id}
                  onClick={item.action}
                  onMouseEnter={() => setHoveredItemId(item.id)}
                  onMouseLeave={() => setHoveredItemId(null)}
                  className={`relative h-20 sm:h-24 md:h-28 border-b border-neutral-800 flex items-center overflow-hidden cursor-pointer transition-colors duration-150 ${
                    isHovered ? hoverBgClass : 'bg-transparent text-white'
                  }`}
                >
                  {/* Default State: Large Lausanne Centered Typography */}
                  <div
                    className={`w-full flex items-center justify-center transition-opacity duration-150 ${
                      isHovered ? 'opacity-0 pointer-events-none' : 'opacity-100'
                    }`}
                  >
                    <span className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-medium tracking-tight uppercase leading-none">
                      {item.label}
                    </span>
                  </div>

                  {/* Hovered State: Continuous Infinite Marquee Loop */}
                  {isHovered && (
                    <div className="absolute inset-0 flex items-center overflow-hidden pointer-events-none whitespace-nowrap">
                      <div className="animate-marquee flex items-center shrink-0">
                        {[0, 1, 2, 3].map((idx) => (
                          <span
                            key={idx}
                            className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-semibold uppercase tracking-tight mx-4 font-lausanne leading-none"
                          >
                            {item.marqueeText}
                          </span>
                        ))}
                      </div>
                      <div className="animate-marquee flex items-center shrink-0">
                        {[0, 1, 2, 3].map((idx) => (
                          <span
                            key={`copy-${idx}`}
                            className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-semibold uppercase tracking-tight mx-4 font-lausanne leading-none"
                          >
                            {item.marqueeText}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Metadata Bar matching Reference */}
        <div className="px-6 md:px-12 py-5 border-t border-neutral-800 flex flex-col sm:flex-row items-center justify-between text-[11px] tracking-[0.2em] uppercase text-neutral-400 gap-3">
          <span>AI-POWERED CONTRACT RISK PLATFORM</span>
          <div className="flex gap-6">
            <span className="hover:text-white transition-colors cursor-pointer" onClick={() => handleNavigate('/about')}>
              ABOUT
            </span>
            <span>CONTRACTLENS © 2026</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FullscreenMenu;
