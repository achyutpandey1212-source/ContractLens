import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';
import { FullscreenMenu } from '../components/LandingPage/FullscreenMenu';
import { MenuButton } from '../components/LandingPage/MenuButton';

export const Register: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Destination after successful register
  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setSubmitting(true);

    try {
      await register(email, password, confirmPassword);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-black font-lausanne selection:bg-[#D3FD50] selection:text-black flex flex-col justify-between">
      {/* ── Fullscreen Editorial Menu ──────────────────────── */}
      <FullscreenMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />

      {/* ── Top Bar ────────────────────────────────────────── */}
      <header className="border-b border-black h-[48px] md:h-[52px]">
        <div className="w-full h-full flex items-center justify-between">
          <div className="pl-6 lg:pl-12">
            <Link
              to="/"
              className="text-xs font-semibold tracking-[0.25em] uppercase hover:opacity-70 transition-opacity"
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

      {/* ── Main Form Container ────────────────────────────── */}
      <main className="max-w-md w-full mx-auto px-6 py-16 flex-1 flex flex-col justify-center">
        <div className="border border-black p-8 md:p-10 bg-white">
          <div className="mb-8">
            <span className="text-[10px] tracking-[0.28em] uppercase text-neutral-500 block mb-2">
              GET STARTED
            </span>
            <h1 className="text-3xl font-medium tracking-tight uppercase leading-none">
              CREATE ACCOUNT.
            </h1>
            <p className="text-xs text-neutral-500 mt-2">
              Start analyzing and managing contract risk today.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3 border border-black bg-neutral-50 text-xs text-black uppercase tracking-wider">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-[10px] tracking-[0.2em] uppercase text-neutral-600 mb-2"
              >
                EMAIL ADDRESS
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full border border-black px-4 py-2.5 text-sm rounded-none focus:outline-none focus:ring-1 focus:ring-[#000] focus:bg-[#fafafa]"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-[10px] tracking-[0.2em] uppercase text-neutral-600 mb-2"
              >
                PASSWORD
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full border border-black px-4 py-2.5 text-sm rounded-none focus:outline-none focus:ring-1 focus:ring-[#000] focus:bg-[#fafafa]"
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-[10px] tracking-[0.2em] uppercase text-neutral-600 mb-2"
              >
                CONFIRM PASSWORD
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className="w-full border border-black px-4 py-2.5 text-sm rounded-none focus:outline-none focus:ring-1 focus:ring-[#000] focus:bg-[#fafafa]"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 py-3.5 bg-black text-white text-xs tracking-[0.18em] uppercase font-medium hover:bg-[#D3FD50] hover:text-black transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>CREATING ACCOUNT...</span>
                </>
              ) : (
                <span>REGISTER →</span>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-neutral-200 text-center">
            <p className="text-xs text-neutral-500">
              ALREADY REGISTERED?{' '}
              <Link
                to="/login"
                state={{ from: (location.state as any)?.from }}
                className="text-black font-medium underline underline-offset-4 hover:text-neutral-600"
              >
                LOG IN
              </Link>
            </p>
          </div>
        </div>
      </main>

      {/* ── Minimal Footer ─────────────────────────────────── */}
      <footer className="border-t border-neutral-200 py-6 text-center text-[10px] tracking-[0.2em] uppercase text-neutral-400">
        CONTRACTLENS © 2026
      </footer>
    </div>
  );
};

export default Register;
