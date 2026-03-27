'use client';

import { useState } from 'react';
import { getSupabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { LogOut, Menu, Loader2 } from 'lucide-react';

export default function TopBar({ user, onToggleSidebar, searchProgress, isSearching }) {
  const router = useRouter();
  const supabase = getSupabase();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const progress = isSearching && searchProgress?.total > 0
    ? (searchProgress.current / searchProgress.total) * 100
    : 0;

  return (
    <div className="sticky top-0 z-50 w-full border-b border-[#1e1e24] bg-[#09090b]/90 backdrop-blur-xl">
      <div className="flex h-14 items-center justify-between px-4">
        {/* Left: hamburger + logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2.5 rounded-lg text-[#71717a] hover:text-[#fafafa] hover:bg-[#1e1e24] active:scale-95 transition-all"
            aria-label="Ouvrir le menu"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20">
              <span className="text-xs font-bold text-white">P</span>
            </div>
            <span className="text-sm font-semibold text-[#fafafa] hidden sm:block tracking-tight">Prospectia<span className="text-rose-400">.ai</span></span>
          </div>
        </div>

        {/* Center: progress indicator when searching */}
        {isSearching && (
          <div className="hidden sm:flex items-center gap-3 flex-1 max-w-md mx-8 animate-in fade-in">
            <div className="flex-1 h-1.5 bg-[#1e1e24] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500 ease-out rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs text-[#52525b] font-mono whitespace-nowrap tabular-nums">
              {searchProgress?.current}/{searchProgress?.total}
            </span>
          </div>
        )}

        {/* Right: user */}
        {user && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#111114] border border-[#1e1e24]">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center ring-2 ring-indigo-500/20">
                <span className="text-[10px] font-bold text-white">
                  {user.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-xs text-[#a1a1aa] hidden sm:block max-w-[160px] truncate" title={user.email}>
                {user.email}
              </span>
            </div>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="p-2.5 rounded-lg text-[#52525b] hover:text-red-400 hover:bg-red-500/10 active:scale-95 transition-all disabled:opacity-50"
              title="Se déconnecter"
              aria-label="Se déconnecter"
            >
              {loggingOut ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
            </button>
          </div>
        )}
      </div>

      {/* Mobile progress bar */}
      {isSearching && (
        <div className="sm:hidden h-1 bg-[#1e1e24]">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}
