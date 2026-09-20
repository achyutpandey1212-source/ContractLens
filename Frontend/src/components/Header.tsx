import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Header: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname.startsWith(path);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className="border-b border-black bg-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 h-14 flex items-center justify-between gap-8">

        {/* Logotype */}
        <Link
          to="/dashboard"
          className="text-black text-xs font-medium tracking-[0.25em] uppercase hover:text-black shrink-0"
        >
          CONTRACTLENS
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-7 flex-1">
          <Link
            to="/dashboard"
            className={`text-[11px] tracking-[0.18em] uppercase transition-colors pb-0.5 ${
              isActive('/dashboard')
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

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-5 shrink-0">
          <Link
            to="/upload"
            className="inline-flex items-center gap-1.5 text-[11px] tracking-[0.14em] uppercase px-4 py-2 bg-black text-white hover:bg-[#D3FD50] hover:text-black transition-colors shrink-0"
          >
            <span>+</span>
            <span>ANALYZE</span>
          </Link>
          <button
            onClick={handleLogout}
            className="text-[11px] tracking-[0.18em] uppercase text-neutral-500 hover:text-black transition-colors cursor-pointer"
          >
            LOG OUT
          </button>
        </div>

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
            { to: '/dashboard', label: 'DASHBOARD' },
            { to: '/upload', label: 'UPLOAD CONTRACT' },
          ].map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMenuOpen(false)}
              className="block px-6 py-4 text-[11px] tracking-[0.18em] uppercase border-b border-neutral-100 hover:bg-[#D3FD50] hover:border-[#D3FD50] transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <button
            onClick={() => {
              setMenuOpen(false);
              handleLogout();
            }}
            className="w-full text-left px-6 py-4 text-[11px] tracking-[0.18em] uppercase border-b border-neutral-100 text-neutral-600 hover:bg-neutral-100 transition-colors cursor-pointer"
          >
            LOG OUT
          </button>
        </div>
      )}
    </header>
  );
};
