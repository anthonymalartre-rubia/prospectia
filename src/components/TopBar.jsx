'use client';

import { useState } from 'react';
import { getSupabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { LogOut, Menu, Loader2, Sun, Moon, Globe } from 'lucide-react';
import { useTheme } from '@/lib/theme';
import { useI18n } from '@/lib/i18n';
import NotificationBell from '@/components/NotificationBell';
import ModuleSwitcher from '@/components/ModuleSwitcher';
import { LogoIcon } from '@/components/ui';

export default function TopBar({ user, onToggleSidebar, searchProgress, isSearching }) {
  const router = useRouter();
  const supabase = getSupabase();
  const [loggingOut, setLoggingOut] = useState(false);
  const { theme, toggle } = useTheme();
  const { t, locale, setLocale } = useI18n();

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
    <div className="sticky top-0 z-50 w-full border-b border-line bg-surface-base/90 backdrop-blur-xl">
      <div className="flex h-14 items-center justify-between px-4">
        {/* Left: hamburger + logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-content-tertiary hover:text-content-primary hover:bg-surface-elevated active:scale-95 transition-all"
            aria-label={t('topbar.openMenu')}
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-3">
            <LogoIcon size="sm" />
            <span className="text-sm font-semibold text-content-primary hidden lg:block tracking-tight">
              Volia<span className="text-violet-400">.fr</span>
            </span>
          </div>
          {/* Module switcher (Prospection / Campagnes / CRM) — visible
              uniquement pour les users authentifiés (qui ont user défini). */}
          {user && (
            <div className="hidden sm:flex items-center pl-1">
              <span className="text-content-muted text-sm mr-2" aria-hidden="true">/</span>
              <ModuleSwitcher />
            </div>
          )}
          {/* Mobile : juste l'icône module sans séparateur */}
          {user && (
            <div className="sm:hidden flex items-center">
              <ModuleSwitcher />
            </div>
          )}
        </div>

        {/* Center: progress indicator when searching */}
        {isSearching && (
          <div className="hidden sm:flex items-center gap-3 flex-1 max-w-md mx-8 animate-in fade-in">
            <div className="flex-1 h-1.5 bg-surface-elevated rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-violet-600 to-indigo-600 transition-all duration-500 ease-out rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs text-content-muted font-mono whitespace-nowrap tabular-nums">
              {searchProgress?.current}/{searchProgress?.total}
            </span>
          </div>
        )}

        {/* Right: lang toggle + theme toggle + user */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setLocale(locale === 'fr' ? 'en' : 'fr')}
            className="p-2.5 rounded-lg text-content-muted hover:text-content-primary hover:bg-surface-elevated active:scale-95 transition-all flex items-center gap-1.5"
            title={locale === 'fr' ? 'Switch to English' : 'Passer en francais'}
            aria-label={locale === 'fr' ? 'Switch to English' : 'Passer en francais'}
          >
            <Globe size={16} />
            <span className="text-xs font-semibold">{locale === 'fr' ? 'FR' : 'EN'}</span>
          </button>
          <button
            onClick={toggle}
            className="p-2.5 rounded-lg text-content-muted hover:text-content-primary hover:bg-surface-elevated active:scale-95 transition-all"
            title={theme === 'dark' ? t('topbar.lightMode') : t('topbar.darkMode')}
            aria-label={theme === 'dark' ? t('topbar.switchLight') : t('topbar.switchDark')}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          {user && <NotificationBell />}
          {user && (
            <>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-card border border-line">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center ring-2 ring-indigo-500/20">
                  <span className="text-[10px] font-bold text-white">
                    {user.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-xs text-content-secondary hidden sm:block max-w-[160px] truncate" title={user.email}>
                  {user.email}
                </span>
              </div>
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="p-2.5 rounded-lg text-content-muted hover:text-red-400 hover:bg-red-500/10 active:scale-95 transition-all disabled:opacity-50"
                title={t('topbar.logout')}
                aria-label={t('topbar.logout')}
              >
                {loggingOut ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Mobile progress bar */}
      {isSearching && (
        <div className="sm:hidden h-1 bg-surface-elevated">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}
