import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MenuButton } from './LandingPage/MenuButton';
import { FullscreenMenu } from './LandingPage/FullscreenMenu';

export const Header: React.FC = () => {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <>
      <FullscreenMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />

      <header className="border-b border-black bg-white sticky top-0 z-40 h-[48px] md:h-[52px]">
        <div className="w-full h-full flex items-center justify-between">
          {/* Logotype on left with responsive padding */}
          <div className="flex items-center pl-6 lg:pl-12">
            <Link
              to="/dashboard"
              className="text-black text-xs font-semibold tracking-[0.25em] uppercase hover:opacity-75 transition-opacity"
            >
              CONTRACTLENS
            </Link>
          </div>

          {/* Center Navigation on Desktop */}
          <nav className="hidden md:flex items-center gap-8">
            <Link
              to="/dashboard"
              className={`text-[11px] tracking-[0.2em] uppercase transition-colors pb-0.5 ${
                isActive('/dashboard')
                  ? 'text-black border-b border-black'
                  : 'text-neutral-500 hover:text-black'
              }`}
            >
              DASHBOARD
            </Link>
            <Link
              to="/upload"
              className={`text-[11px] tracking-[0.2em] uppercase transition-colors pb-0.5 ${
                isActive('/upload')
                  ? 'text-black border-b border-black'
                  : 'text-neutral-500 hover:text-black'
              }`}
            >
              UPLOAD CONTRACT
            </Link>
            <Link
              to="/about"
              className={`text-[11px] tracking-[0.2em] uppercase transition-colors pb-0.5 ${
                isActive('/about')
                  ? 'text-black border-b border-black'
                  : 'text-neutral-500 hover:text-black'
              }`}
            >
              ABOUT
            </Link>
          </nav>

          {/* Right Action: Analyze CTA + Reusable Menu Button */}
          <div className="flex items-center h-full">
            <Link
              to="/upload"
              className="hidden lg:inline-flex items-center gap-1.5 text-[11px] tracking-[0.16em] uppercase px-4 h-full border-l border-black text-black hover:bg-[#D3FD50] transition-colors"
            >
              <span>+</span>
              <span>ANALYZE</span>
            </Link>
            
            {/* The Unified Editorial Menu Button */}
            <div className="relative h-full border-l border-black">
              <MenuButton onClick={() => setMenuOpen(true)} />
            </div>
          </div>
        </div>
      </header>
    </>
  );
};
