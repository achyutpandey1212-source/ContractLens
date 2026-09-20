import React from 'react';
import { Link } from 'react-router-dom';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'outline' | 'link';
  to?: string;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  to,
  className = '',
  ...props
}) => {
  const base =
    'inline-flex items-center justify-center gap-2 text-[11px] tracking-[0.14em] uppercase font-medium transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed';

  const variants: Record<string, string> = {
    primary:
      'px-5 py-2.5 bg-black text-white hover:bg-[#D3FD50] hover:text-black',
    ghost:
      'px-5 py-2.5 border border-black text-black bg-white hover:bg-[#D3FD50] hover:border-[#D3FD50]',
    // outline is aliased to ghost for backward compatibility
    outline:
      'px-5 py-2.5 border border-black text-black bg-white hover:bg-[#D3FD50] hover:border-[#D3FD50]',
    link: 'text-black underline-offset-2 hover:underline px-0 py-0',
  };

  const combined = `${base} ${variants[variant] ?? variants.primary} ${className}`;

  if (to) {
    return (
      <Link to={to} className={combined}>
        {children}
      </Link>
    );
  }

  return (
    <button className={combined} {...props}>
      {children}
    </button>
  );
};
