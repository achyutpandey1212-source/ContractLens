import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MenuButton } from './LandingPage/MenuButton';
import { FullscreenMenu } from './LandingPage/FullscreenMenu';

export const Header: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <FullscreenMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />

      <header className="border-b border-black bg-white sticky top-0 z-40 h-[48px] md:h-[52px]">
        <div className="w-full h-full flex items-center justify-between">
          {/* Brand Logotype on left */}
          <div className="flex items-center pl-6 lg:pl-12">
            <Link
              to="/dashboard"
              className="text-black text-xs font-semibold tracking-[0.25em] uppercase hover:opacity-75 transition-opacity"
            >
              CONTRACTLENS
            </Link>
          </div>

          {/* Right Slot: Minimal Editorial Menu Button */}
          <div className="flex items-center h-full">
            <div className="relative h-full border-l border-black">
              <MenuButton onClick={() => setMenuOpen(true)} />
            </div>
          </div>
        </div>
      </header>
    </>
  );
};
