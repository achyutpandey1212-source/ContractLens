import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

export const Header: React.FC = () => {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  return (
    <header className="border-b border-black bg-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 h-14 flex items-center justify-between gap-8">

        {/* Logotype */}
        <Link
          to="/"
          className="text-black text-xs font-medium tracking-[0.25em] uppercase hover:text-black shrink-0"
        >
          CONTRACTLENS
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-7 flex-1">
          <Link
            to="/"
            className={`text-[11px] tracking-[0.18em] uppercase transition-colors pb-0.5 ${
              isActive('/')
                ? 'text-black border-b border-black'
                : 'text-neutral-500 hover:text-black'
            }`}
          >
            DASHBOARD
          </Link>
          <Link
            to="/upload"
            className={`text-[11px] tracking-[0.18em] uppercase transition-colors pb-0.5 ${
              isActive('/upload')
                ? 'text-black border-b border-black'
                : 'text-neutral-500 hover:text-black'
            }`}
          >
            UPLOAD CONTRACT
          </Link>
        </nav>

        {/* Desktop CTA */}
        <Link
          to="/upload"
          className="hidden md:inline-flex items-center gap-1.5 text-[11px] tracking-[0.14em] uppercase px-4 py-2 bg-black text-white hover:bg-[#D3FD50] hover:text-black transition-colors shrink-0"
        >
          <span>+</span>
          <span>ANALYZE</span>
        </Link>

        {/* Mobile Toggle */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden p-1 text-black hover:text-neutral-600 transition-colors"
          aria-label="Toggle menu"
        >
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-black bg-white">
          {[
            { to: '/', label: 'DASHBOARD' },
            { to: '/upload', label: 'UPLOAD CONTRACT' },
          ].map(link => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMenuOpen(false)}
              className="block px-6 py-4 text-[11px] tracking-[0.18em] uppercase border-b border-neutral-100 hover:bg-[#D3FD50] hover:border-[#D3FD50] transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
};
