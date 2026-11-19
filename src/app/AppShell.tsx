import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '@/auth/AuthContext';

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 px-4 pt-4 sm:px-6">
        <nav className="glass mx-auto flex h-14 max-w-5xl items-center justify-between rounded-full px-3 pl-5 shadow-soft">
          <Link to="/" className="flex items-center gap-2 font-display text-xl font-semibold text-ink">
            <img src="/mellow.svg" alt="" className="h-8 w-8" />
            Mellowood
          </Link>
          <UserMenu />
        </nav>
      </header>
      <div className="mx-auto max-w-5xl px-4 pb-24 pt-6 sm:px-6">{children}</div>
    </div>
  );
}

function UserMenu() {
  const { user, auth } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', close);
    };
  }, [open]);

  if (!user) return null;
  const initial = (user.displayName || user.email).charAt(0).toUpperCase();

  const logout = async () => {
    setOpen(false);
    await auth.signOut();
    navigate('/login', { replace: true });
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="Account menu"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-blush to-lavender font-display text-lg font-semibold text-ink shadow-pop transition hover:scale-105 active:translate-y-[2px] active:shadow-none"
      >
        {initial}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="glass absolute right-0 mt-2 w-56 origin-top-right rounded-squish p-2 shadow-soft"
          >
            <p className="truncate px-3 py-2 text-xs font-bold text-ink-soft">{user.email}</p>
            <MenuLink to="/settings" onClick={() => setOpen(false)}>
              Settings
            </MenuLink>
            <button
              role="menuitem"
              type="button"
              onClick={logout}
              className="w-full rounded-xl px-3 py-2 text-left font-semibold text-berry hover:bg-blush/30"
            >
              Log out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MenuLink({ to, children, onClick }: { to: string; children: ReactNode; onClick: () => void }) {
  return (
    <Link role="menuitem" to={to} onClick={onClick} className="block rounded-xl px-3 py-2 font-semibold hover:bg-lavender/20">
      {children}
    </Link>
  );
}
