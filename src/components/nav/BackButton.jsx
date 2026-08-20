import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

const PRIMARY_ROOTS = ['/', '/explore', '/scan', '/collection', '/market'];

export default function BackButton({ className }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const isRoot = PRIMARY_ROOTS.includes(pathname);
  if (isRoot) return null;

  return (
    <button
      type="button"
      onClick={() => navigate(-1)}
      className={cn(
        'flex items-center gap-1 text-amethyst-glow hover:text-white transition select-none rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amethyst-glow/50',
        className
      )}
      aria-label="Go back"
    >
      <ChevronLeft size={22} />
      <span className="text-sm font-medium">Back</span>
    </button>
  );
}