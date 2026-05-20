'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabase } from '@/lib/supabase';
import { PLANS } from '@/lib/plans';
import {
  User, Lock, CreditCard, Trash2, Shield, Mail, Calendar,
  Eye, EyeOff, ArrowLeft, RefreshCw, AlertTriangle, CheckCircle, X, Sun, Moon,
  BookOpen, BarChart3, ArrowUpRight, ShieldAlert, Filter, Globe,
  ChevronRight, Settings as SettingsIcon, Sparkles, Zap, SlidersHorizontal,
} from 'lucide-react';
import { useTheme } from '@/lib/theme';
import { useI18n } from '@/lib/i18n';

// ─── Composants UI réutilisables (refonte settings UX) ──────────────────
function SectionHeader({ icon, title, subtitle }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex-shrink-0 mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <h2 className="text-base font-semibold text-content-primary">{title}</h2>
        {subtitle && <p className="text-xs text-content-tertiary mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

function SettingRow({ icon, title, description, control }) {
  return (
    <div className="rounded-xl border border-line bg-surface-card p-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {icon && (
          <div className="flex-shrink-0 p-1.5 rounded-lg bg-violet-500/10">
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-content-primary">{title}</p>
          {description && <p className="text-xs text-content-tertiary mt-0.5 line-clamp-2">{description}</p>}
        </div>
      </div>
      <div className="flex-shrink-0">{control}</div>
    </div>
  );
}

function Toggle({ on, onClick, loading }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
        on ? 'bg-violet-600' : 'bg-surface-elevated border border-line'
      } ${loading ? 'opacity-50 cursor-wait' : ''}`}
    >
      {loading ? (
        <RefreshCw className="h-3 w-3 animate-spin text-content-tertiary absolute top-1.5 left-1/2 -translate-x-1/2" />
      ) : (
        <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
          on ? 'translate-x-5' : 'translate-x-0.5'
        }`} />
      )}
    </button>
  );
}

function PasswordField({ label, value, onChange, show, onToggleShow, placeholder, minLength, error, children }) {
  return (
    <div>
      <label className="text-xs text-content-tertiary mb-1.5 block font-medium">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required
          minLength={minLength}
          className="w-full px-3 py-2.5 pr-10 rounded-lg bg-surface-base border border-line text-sm text-content-primary placeholder-content-muted focus:outline-none focus:border-violet-500 transition-colors"
        />
        <button
          type="button"
          onClick={onToggleShow}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-content-muted hover:text-content-primary transition-colors"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {error && <p className="text-[10px] text-red-500 mt-1">{error}</p>}
      {children}
    </div>
  );
}

// Mapping icônes pour la nav table-of-contents
const Settings_Tabs = {
  preferences: SlidersHorizontal,
  security: Lock,
  plan: CreditCard,
  help: BookOpen,
  danger: AlertTriangle,
};

export default function SettingsPage() {
  const router = useRouter();
  const supabase = getSupabase();
  const { theme, toggle: toggleTheme } = useTheme();
  const { t, locale, setLocale } = useI18n();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [toast, setToast] = useState(null);

  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  // Billing
  const [billingLoading, setBillingLoading] = useState(false);

  // Usage data
  const [userUsage, setUserUsage] = useState(null);

  // RGPD filter
  const [filterPersonalEmails, setFilterPersonalEmails] = useState(true);
  const [filterLoading, setFilterLoading] = useState(false);

  // Delete account
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  // UX refonte : scrollspy + sticky nav
  const [activeSection, setActiveSection] = useState('preferences');
  // Toggle Mensuel/Annuel pour le pricing dans la section Plan & Usage
  const [upgradePeriod, setUpgradePeriod] = useState('monthly');

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Scrollspy : met à jour activeSection quand l'utilisateur scrolle
  useEffect(() => {
    if (loading) return;
    const sectionIds = ['preferences', 'security', 'plan', 'help', 'danger'];
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible.length > 0) setActiveSection(visible[0].target.id);
      },
      { rootMargin: '-30% 0px -60% 0px', threshold: [0, 0.25, 0.5, 1] }
    );
    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [loading]);

  const scrollToSection = useCallback((id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  function showToast(message, type = 'success') {
    setToast({ message, type });
  }

  async function loadUserData() {
    if (!supabase) return;
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      router.push('/login');
      return;
    }
    setUser(authUser);

    const { data: prof } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', authUser.id)
      .single();

    setProfile(prof);
    setFilterPersonalEmails(prof?.filter_personal_emails !== false);

    // Fetch usage data for current month
    const month = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    const { data: usageData } = await supabase
      .from('usage_tracking')
      .select('searches, enrichments, exports')
      .eq('user_id', authUser.id)
      .eq('month', month)
      .single();
    setUserUsage(usageData || { searches: 0, enrichments: 0, exports: 0 });

    setLoading(false);
  }

  // Password strength: 0-4
  function getPasswordStrength(pw) {
    if (!pw) return 0;
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
    if (/\d/.test(pw)) score++;
    if (/[^a-zA-Z0-9]/.test(pw)) score++;
    return score;
  }

  const passwordStrength = getPasswordStrength(newPassword);
  const strengthLabels = ['', t('settings.weak'), t('settings.medium'), t('settings.good'), t('settings.excellent')];
  const strengthColors = ['', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-emerald-500'];

  async function handleChangePassword(e) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast(t('settings.passwordMismatch'), 'error');
      return;
    }
    if (newPassword.length < 6) {
      showToast(t('settings.passwordMinLength'), 'error');
      return;
    }

    setPasswordLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });
      if (signInError) {
        showToast(t('settings.wrongPassword'), 'error');
        setPasswordLoading(false);
        return;
      }

      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        showToast(error.message || t('settings.passwordChangeError'), 'error');
      } else {
        showToast(t('settings.passwordUpdated'));
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setShowPasswordForm(false);
      }
    } catch {
      showToast(t('settings.networkError'), 'error');
    }
    setPasswordLoading(false);
  }

  async function handleToggleFilter() {
    setFilterLoading(true);
    const newValue = !filterPersonalEmails;
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ filter_personal_emails: newValue })
        .eq('id', user.id);
      if (error) {
        showToast(t('settings.updateError'), 'error');
      } else {
        setFilterPersonalEmails(newValue);
        showToast(newValue
          ? t('settings.filterActiveDesc')
          : t('settings.filterInactiveDesc')
        , newValue ? 'success' : 'error');
      }
    } catch {
      showToast(t('settings.networkError'), 'error');
    }
    setFilterLoading(false);
  }

  async function handleManageBilling() {
    setBillingLoading(true);
    try {
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
      } else {
        showToast(data.error || t('settings.stripeError'), 'error');
      }
    } catch {
      showToast(t('settings.networkError'), 'error');
    }
    setBillingLoading(false);
  }

  /**
   * Lance le checkout Stripe pour un plan donné.
   * @param {'solo'|'pro'|'business'} targetPlan
   * @param {'monthly'|'yearly'} [targetPeriod='monthly']
   */
  async function handleCheckout(targetPlan = 'pro', targetPeriod = 'monthly') {
    setBillingLoading(true);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: targetPlan, period: targetPeriod }),
      });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
      } else {
        showToast(data.error || t('settings.stripeError'), 'error');
      }
    } catch {
      showToast(t('settings.networkError'), 'error');
    }
    setBillingLoading(false);
  }

  // Compat avec le code existant qui appelait handleUpgradePro()
  const handleUpgradePro = () => handleCheckout('pro', 'monthly');

  async function handleDeleteAccount() {
    if (deleteConfirmText !== 'SUPPRIMER') return;
    setDeleteLoading(true);
    try {
      const res = await fetch('/api/account/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (res.ok) {
        await supabase.auth.signOut();
        router.push('/login');
      } else {
        showToast(data.error || t('settings.deleteError'), 'error');
        setDeleteLoading(false);
      }
    } catch {
      showToast(t('settings.networkError'), 'error');
      setDeleteLoading(false);
    }
  }

  function formatDate(dateStr) {
    if (!dateStr) return '--';
    return new Date(dateStr).toLocaleDateString(locale === 'en' ? 'en-GB' : 'fr-FR', {
      day: '2-digit', month: 'long', year: 'numeric',
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-base flex items-center justify-center">
        <RefreshCw className="h-6 w-6 text-violet-500 animate-spin" />
      </div>
    );
  }

  const currentPlan = PLANS[profile?.plan] || PLANS.free;
  const planId = profile?.plan || 'free';

  return (
    <div className="min-h-screen bg-surface-base text-content-primary">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-[100] flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium shadow-lg animate-in fade-in slide-in-from-top-2 ${
          toast.type === 'success' ? 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/30' :
          'bg-red-500/15 text-red-600 border border-red-500/30'
        }`}>
          {toast.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
          {toast.message}
          <button onClick={() => setToast(null)} className="ml-2 hover:opacity-70"><X className="h-3.5 w-3.5" /></button>
        </div>
      )}

      {/* Delete Confirm Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface-card border border-line rounded-xl p-6 max-w-md w-full shadow-2xl animate-in zoom-in-95 fade-in duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-red-500/15">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
              <h3 className="text-lg font-semibold">{t('settings.deleteMyAccount')}</h3>
            </div>
            <p className="text-sm text-content-secondary mb-2">{t('settings.deleteIrreversible')}</p>
            <ul className="text-xs text-content-tertiary mb-4 space-y-1 ml-4 list-disc">
              <li>{t('settings.deleteDataProspects')}</li>
              <li>{t('settings.deleteDataFolders')}</li>
              <li>{t('settings.deleteDataUsage')}</li>
              <li>{t('settings.deleteDataAccount')}</li>
            </ul>
            <p className="text-sm text-content-secondary mb-3">
              {t('settings.typeToConfirm')} <span className="font-mono text-red-500 font-semibold">SUPPRIMER</span> {t('settings.toConfirm')}
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="SUPPRIMER"
              className="w-full px-3 py-2 rounded-lg bg-surface-base border border-line text-sm text-content-primary placeholder-content-muted focus:outline-none focus:border-red-500 mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(''); }}
                className="px-4 py-2 rounded-lg text-sm bg-surface-elevated hover:bg-surface-active transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== 'SUPPRIMER' || deleteLoading}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-red-500/15 text-red-500 hover:bg-red-500/25 transition-colors disabled:opacity-40"
              >
                {deleteLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : t('settings.deleteForever')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Header sticky ────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-line bg-surface-base/85 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-surface-elevated transition-colors text-content-tertiary hover:text-content-primary text-sm"
            title={t('settings.backToDashboard')}
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">{t('settings.backToDashboard')}</span>
          </button>
          <div className="h-6 w-px bg-line mx-1" />
          <SettingsIcon className="h-4 w-4 text-violet-500" />
          <h1 className="text-base font-semibold text-content-primary">{t('settings.title')}</h1>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 lg:py-10">
        {/* ─── Hero account card ──────────────────────────────────── */}
        <section className="mb-8">
          <div className="relative overflow-hidden rounded-2xl border border-line bg-gradient-to-br from-violet-500/[0.06] via-indigo-500/[0.04] to-surface-card p-5 sm:p-6">
            <div className="pointer-events-none absolute -top-16 -right-16 w-56 h-56 rounded-full bg-violet-500/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-indigo-500/10 blur-3xl" />

            <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-5">
              {/* Avatar */}
              <div className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30 text-white font-bold text-2xl sm:text-3xl">
                {(user?.email?.[0] || 'U').toUpperCase()}
              </div>

              {/* Identity */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center flex-wrap gap-2 mb-1.5">
                  <h2 className="text-lg sm:text-xl font-semibold text-content-primary truncate">
                    {user?.email || '--'}
                  </h2>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide ${
                    planId === 'enterprise' ? 'bg-amber-500/15 text-amber-600 border border-amber-500/30' :
                    planId === 'pro' ? 'bg-violet-500/15 text-violet-600 border border-violet-500/30' :
                    'bg-surface-elevated text-content-tertiary border border-line'
                  }`}>
                    {currentPlan.name}
                  </span>
                </div>
                <p className="text-xs text-content-tertiary flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  {t('settings.memberSince')} {formatDate(user?.created_at)}
                  {(() => {
                    if (!user?.created_at) return null;
                    const days = Math.floor((Date.now() - new Date(user.created_at).getTime()) / 86400000);
                    return <span className="text-content-muted">· {days} {t('settings.daysAgo')}</span>;
                  })()}
                </p>
              </div>

              {/* Quick CTA */}
              {planId === 'free' ? (
                <button
                  onClick={handleUpgradePro}
                  disabled={billingLoading}
                  className="flex-shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-semibold shadow-lg shadow-violet-500/30 hover:shadow-xl hover:shadow-violet-500/40 hover:from-violet-500 hover:to-indigo-500 transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {billingLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {t('settings.upgradePro')}
                </button>
              ) : (
                <button
                  onClick={handleManageBilling}
                  disabled={billingLoading}
                  className="flex-shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-line bg-surface-card text-content-secondary hover:bg-surface-elevated text-sm font-medium transition disabled:opacity-50"
                >
                  {billingLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                  {t('settings.manageSubscription')}
                </button>
              )}
            </div>

            {/* Quick stats */}
            <div className="relative mt-6 pt-5 border-t border-line">
              <p className="text-[10px] uppercase tracking-wider text-content-muted font-semibold mb-3">{t('settings.quickStats')}</p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: t('settings.searches'), current: userUsage?.searches || 0, limit: currentPlan.limits.searches_per_month, color: 'indigo' },
                  { label: t('settings.enrichments'), current: userUsage?.enrichments || 0, limit: currentPlan.limits.enrichments_per_month, color: 'violet' },
                  { label: t('settings.exports'), current: userUsage?.exports || 0, limit: currentPlan.limits.exports_per_month, color: 'emerald' },
                ].map(({ label, current, limit, color }) => {
                  const isUnlimited = limit === -1;
                  const pct = isUnlimited ? 0 : Math.min(100, Math.round((current / Math.max(1, limit)) * 100));
                  const isWarn = !isUnlimited && pct >= 80;
                  const isCrit = !isUnlimited && pct >= 100;
                  const numberColor = isCrit ? 'text-red-500' : isWarn ? 'text-amber-500' :
                    color === 'indigo' ? 'text-indigo-500' :
                    color === 'violet' ? 'text-violet-500' : 'text-emerald-500';
                  const barColor = isUnlimited
                    ? (color === 'indigo' ? 'bg-indigo-500/40' : color === 'violet' ? 'bg-violet-500/40' : 'bg-emerald-500/40')
                    : isCrit ? 'bg-red-500'
                    : isWarn ? 'bg-amber-500'
                    : (color === 'indigo' ? 'bg-indigo-500' : color === 'violet' ? 'bg-violet-500' : 'bg-emerald-500');
                  return (
                    <div key={label} className="p-3 rounded-xl bg-surface-card border border-line">
                      <div className="text-[10px] uppercase tracking-wider text-content-muted font-medium mb-1.5">{label}</div>
                      <div className="flex items-baseline gap-1">
                        <span className={`text-2xl font-bold font-mono tabular-nums ${numberColor}`}>{current}</span>
                        <span className="text-xs text-content-muted">/ {isUnlimited ? '∞' : limit}</span>
                      </div>
                      <div className="h-1 rounded-full bg-surface-elevated overflow-hidden mt-2">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                          style={{ width: isUnlimited ? '100%' : `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* ─── 2-col layout : sticky nav + sections ──────────────── */}
        <div className="grid lg:grid-cols-[200px_1fr] gap-8">
          {/* Sticky table of contents (desktop only) */}
          <nav className="hidden lg:block">
            <div className="sticky top-20">
              <p className="text-[10px] uppercase tracking-wider text-content-muted font-semibold mb-3 px-3">{t('settings.title')}</p>
              <ul className="space-y-0.5">
                {[
                  { id: 'preferences', label: t('settings.navPreferences') },
                  { id: 'security', label: t('settings.navSecurity') },
                  { id: 'plan', label: t('settings.navPlanUsage') },
                  { id: 'help', label: t('settings.navHelp') },
                  { id: 'danger', label: t('settings.navDanger'), danger: true },
                ].map(({ id, label, danger }) => {
                  const Icon = Settings_Tabs[id];
                  const isActive = activeSection === id;
                  return (
                    <li key={id}>
                      <button
                        onClick={() => scrollToSection(id)}
                        className={`group w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          isActive
                            ? (danger ? 'bg-red-500/10 text-red-500' : 'bg-violet-500/10 text-violet-600')
                            : (danger ? 'text-content-tertiary hover:text-red-500 hover:bg-red-500/5' : 'text-content-tertiary hover:text-content-primary hover:bg-surface-card')
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="flex-1 text-left truncate">{label}</span>
                        {isActive && <ChevronRight className="h-3 w-3 flex-shrink-0" />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </nav>

          {/* Main content */}
          <main className="space-y-10">
            {/* ─── Préférences ─────────────────────────────────── */}
            <section id="preferences" className="scroll-mt-20">
              <SectionHeader
                icon={<SlidersHorizontal className="h-5 w-5 text-violet-500" />}
                title={t('settings.navPreferences')}
                subtitle={t('settings.preferencesSectionDesc')}
              />

              <div className="space-y-3 mt-4">
                {/* Theme */}
                <SettingRow
                  icon={theme === 'dark' ? <Moon className="h-4 w-4 text-violet-500" /> : <Sun className="h-4 w-4 text-amber-500" />}
                  title={t('settings.theme')}
                  description={theme === 'dark' ? t('settings.darkActivated') : t('settings.lightActivated')}
                  control={<Toggle on={theme === 'light'} onClick={toggleTheme} />}
                />

                {/* Language */}
                <SettingRow
                  icon={<Globe className="h-4 w-4 text-violet-500" />}
                  title={t('settings.language')}
                  description={t('settings.languageDesc')}
                  control={
                    <div className="inline-flex rounded-lg border border-line bg-surface-base p-0.5">
                      {[{ code: 'fr', flag: '🇫🇷' }, { code: 'en', flag: '🇬🇧' }].map(({ code, flag }) => (
                        <button
                          key={code}
                          onClick={() => setLocale(code)}
                          className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                            locale === code ? 'bg-violet-500/15 text-violet-600' : 'text-content-tertiary hover:text-content-primary'
                          }`}
                        >
                          {flag} {code.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  }
                />

                {/* GDPR Filter — version compacte */}
                <div className={`rounded-xl border ${filterPersonalEmails ? 'border-line bg-surface-card' : 'border-amber-500/30 bg-amber-500/[0.03]'} p-4`}>
                  <div className="flex items-start gap-3">
                    <div className={`flex-shrink-0 mt-0.5 p-1.5 rounded-lg ${filterPersonalEmails ? 'bg-violet-500/10' : 'bg-amber-500/15'}`}>
                      <Filter className={`h-4 w-4 ${filterPersonalEmails ? 'text-violet-500' : 'text-amber-600'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-content-primary">{t('settings.gdprEmailFilter')}</h3>
                          <p className="text-xs text-content-tertiary mt-0.5 leading-relaxed">
                            {filterPersonalEmails ? t('settings.filterInfo') : t('settings.filterWarning')}
                          </p>
                        </div>
                        <div className="flex-shrink-0">
                          <Toggle on={filterPersonalEmails} onClick={handleToggleFilter} loading={filterLoading} />
                        </div>
                      </div>

                      {!filterPersonalEmails && (
                        <details className="mt-3 rounded-lg bg-amber-500/10 border border-amber-500/20 overflow-hidden">
                          <summary className="cursor-pointer px-3 py-2 flex items-center gap-2 text-xs font-semibold text-amber-700 hover:bg-amber-500/10">
                            <ShieldAlert className="h-3.5 w-3.5" />
                            {t('settings.gdprWarningTitle')}
                          </summary>
                          <div className="px-3 py-3 border-t border-amber-500/20 space-y-2">
                            <p className="text-xs text-content-secondary leading-relaxed">{t('settings.gdprWarningP1')}</p>
                            <p className="text-xs text-content-secondary leading-relaxed">{t('settings.gdprWarningP2')}</p>
                            <p className="text-xs text-content-secondary leading-relaxed">{t('settings.gdprWarningP3')}</p>
                            <p className="text-[10px] text-amber-700/80 uppercase tracking-wider font-semibold pt-1">
                              {t('settings.gdprAcceptConditions')}
                            </p>
                          </div>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* ─── Sécurité ───────────────────────────────────── */}
            <section id="security" className="scroll-mt-20">
              <SectionHeader
                icon={<Lock className="h-5 w-5 text-violet-500" />}
                title={t('settings.navSecurity')}
                subtitle={t('settings.changePasswordDesc')}
              />

              <div className="mt-4">
                {!showPasswordForm ? (
                  <button
                    onClick={() => setShowPasswordForm(true)}
                    className="w-full sm:w-auto inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-line bg-surface-card hover:bg-surface-elevated text-sm font-medium text-content-secondary hover:text-content-primary transition"
                  >
                    <Lock className="h-4 w-4" />
                    {t('settings.showPasswordForm')}
                  </button>
                ) : (
                  <div className="rounded-xl border border-line bg-surface-card p-5">
                    <form onSubmit={handleChangePassword} className="space-y-4">
                      <PasswordField
                        label={t('settings.currentPassword')}
                        value={currentPassword}
                        onChange={setCurrentPassword}
                        show={showCurrentPassword}
                        onToggleShow={() => setShowCurrentPassword(!showCurrentPassword)}
                        placeholder={t('settings.currentPasswordPlaceholder')}
                      />
                      <PasswordField
                        label={t('settings.newPassword')}
                        value={newPassword}
                        onChange={setNewPassword}
                        show={showNewPassword}
                        onToggleShow={() => setShowNewPassword(!showNewPassword)}
                        placeholder={t('settings.minCharsPlaceholder')}
                        minLength={6}
                      >
                        {newPassword && (
                          <div className="mt-2">
                            <div className="flex gap-1 mb-1">
                              {[1, 2, 3, 4].map((level) => (
                                <div
                                  key={level}
                                  className={`h-1 flex-1 rounded-full transition-colors ${
                                    passwordStrength >= level ? strengthColors[passwordStrength] : 'bg-surface-elevated'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className={`text-[10px] ${
                              passwordStrength <= 1 ? 'text-red-500' :
                              passwordStrength === 2 ? 'text-orange-500' :
                              passwordStrength === 3 ? 'text-yellow-500' :
                              'text-emerald-500'
                            }`}>
                              {strengthLabels[passwordStrength]}
                            </span>
                          </div>
                        )}
                      </PasswordField>
                      <PasswordField
                        label={t('settings.confirmPassword')}
                        value={confirmPassword}
                        onChange={setConfirmPassword}
                        show={showConfirmPassword}
                        onToggleShow={() => setShowConfirmPassword(!showConfirmPassword)}
                        placeholder={t('settings.repeatPasswordPlaceholder')}
                        minLength={6}
                        error={confirmPassword && newPassword !== confirmPassword ? t('settings.passwordMismatch') : null}
                      />

                      <div className="flex flex-wrap gap-2 pt-1">
                        <button
                          type="submit"
                          disabled={passwordLoading || !currentPassword || !newPassword || newPassword !== confirmPassword}
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-violet-600 text-white hover:bg-violet-500 transition disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {passwordLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                          {t('settings.updatePassword')}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowPasswordForm(false);
                            setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
                          }}
                          className="px-4 py-2.5 rounded-lg text-sm border border-line bg-surface-card hover:bg-surface-elevated text-content-secondary transition"
                        >
                          {t('settings.hidePasswordForm')}
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            </section>

            {/* ─── Plan & Usage ───────────────────────────────── */}
            <section id="plan" className="scroll-mt-20">
              <SectionHeader
                icon={<CreditCard className="h-5 w-5 text-violet-500" />}
                title={t('settings.navPlanUsage')}
                subtitle={(() => {
                  const now = new Date();
                  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
                  const renew = nextMonth.toLocaleDateString(locale === 'en' ? 'en-GB' : 'fr-FR', { day: 'numeric', month: 'long' });
                  return `${t('settings.planLabel')} ${currentPlan.name} — ${t('settings.nextRenewal')} ${renew}`;
                })()}
              />

              <div className="mt-4 rounded-xl border border-line bg-surface-card p-5">
                {/* Plan limits grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
                  {[
                    { label: t('settings.searchesPerMonth'), value: currentPlan.limits.searches_per_month },
                    { label: t('settings.enrichmentsPerMonth'), value: currentPlan.limits.enrichments_per_month },
                    { label: t('settings.folders'), value: currentPlan.limits.folders },
                    { label: t('settings.exportsPerMonth'), value: currentPlan.limits.exports_per_month },
                  ].map(({ label, value }) => (
                    <div key={label} className="p-3 rounded-lg border border-line bg-surface-base text-center">
                      <div className="text-[10px] uppercase tracking-wider text-content-muted font-medium mb-1">{label}</div>
                      <div className="text-base font-semibold text-content-primary">
                        {value === -1 ? '∞' : value}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Detailed usage bars */}
                <div className="space-y-3">
                  {[
                    { label: t('settings.searches'), current: userUsage?.searches || 0, limit: currentPlan.limits.searches_per_month },
                    { label: t('settings.enrichments'), current: userUsage?.enrichments || 0, limit: currentPlan.limits.enrichments_per_month },
                    { label: t('settings.exports'), current: userUsage?.exports || 0, limit: currentPlan.limits.exports_per_month },
                  ].map(({ label, current, limit }) => {
                    const isUnlimited = limit === -1;
                    const pct = isUnlimited ? 0 : Math.min(100, Math.round((current / Math.max(1, limit)) * 100));
                    const barColor = isUnlimited ? 'bg-violet-500/30'
                      : pct >= 90 ? 'bg-red-500'
                      : pct >= 60 ? 'bg-amber-500'
                      : 'bg-emerald-500';
                    const textColor = isUnlimited ? 'text-content-tertiary'
                      : pct >= 90 ? 'text-red-500'
                      : pct >= 60 ? 'text-amber-500'
                      : 'text-emerald-500';
                    return (
                      <div key={label}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs text-content-secondary">{label}</span>
                          <span className={`text-xs font-mono tabular-nums font-semibold ${textColor}`}>
                            {current} / {isUnlimited ? '∞' : limit}
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-surface-elevated overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                            style={{ width: isUnlimited ? '100%' : `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Portail Stripe pour les users déjà payants (gestion abo, factures) */}
                {planId !== 'free' && (
                  <div className="mt-5 pt-4 border-t border-line flex justify-end">
                    <button
                      onClick={handleManageBilling}
                      disabled={billingLoading}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-line bg-surface-card hover:bg-surface-elevated text-content-secondary transition disabled:opacity-40"
                    >
                      {billingLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                      {t('settings.manageSubscription')}
                    </button>
                  </div>
                )}
              </div>

              {/* ─── Choisir un plan (3 cards Solo/Pro/Business + toggle period) ─── */}
              <div className="mt-6 rounded-xl border border-line bg-surface-card p-5">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                  <div>
                    <h3 className="text-sm font-semibold text-content-primary">
                      {planId === 'free' ? '⚡ Choisir un plan' : 'Changer de plan'}
                    </h3>
                    <p className="text-xs text-content-tertiary mt-0.5">
                      {planId === 'free'
                        ? 'A partir de 19€/mois. Annulez à tout moment.'
                        : 'Upgrade ou downgrade à tout moment.'}
                    </p>
                  </div>
                  {/* Toggle Mensuel / Annuel */}
                  <div className="inline-flex items-center gap-1 p-1 rounded-lg border border-line bg-surface-base">
                    <button
                      onClick={() => setUpgradePeriod('monthly')}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                        upgradePeriod === 'monthly' ? 'bg-violet-500/15 text-violet-600' : 'text-content-tertiary'
                      }`}
                    >
                      Mensuel
                    </button>
                    <button
                      onClick={() => setUpgradePeriod('yearly')}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition flex items-center gap-1.5 ${
                        upgradePeriod === 'yearly' ? 'bg-violet-500/15 text-violet-600' : 'text-content-tertiary'
                      }`}
                    >
                      Annuel
                      <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 text-[9px] font-bold uppercase">−17%</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {['solo', 'pro', 'business'].map((pid) => {
                    const plan = PLANS[pid];
                    const isCurrent = planId === pid;
                    const price = upgradePeriod === 'yearly' ? plan.priceYearly : plan.price;
                    const isRecommended = pid === 'pro';
                    return (
                      <div
                        key={pid}
                        className={`relative p-4 rounded-xl border ${
                          isRecommended ? 'border-violet-500/40 bg-violet-500/[0.04]' : 'border-line bg-surface-base'
                        } ${isCurrent ? 'opacity-75' : ''}`}
                      >
                        {isRecommended && (
                          <span className="absolute -top-2 right-3 px-2 py-0.5 rounded-full bg-violet-600 text-white text-[9px] font-bold uppercase tracking-wider">
                            Recommandé
                          </span>
                        )}
                        <h4 className="text-sm font-semibold text-content-primary">{plan.name}</h4>
                        <div className="mt-1 flex items-baseline gap-1">
                          <span className="text-xl font-bold text-content-primary">{Math.round(price / 100)}€</span>
                          <span className="text-[10px] text-content-muted">
                            {upgradePeriod === 'yearly' ? '/an' : '/mois'}
                          </span>
                        </div>
                        <p className="text-[10px] text-content-tertiary mb-3 min-h-[28px]">
                          {plan.limits.searches_per_month.toLocaleString('fr-FR')} prospects · {plan.limits.enrichments_per_month.toLocaleString('fr-FR')} enrich.
                        </p>
                        {isCurrent ? (
                          <button
                            disabled
                            className="w-full py-2 rounded-lg text-xs font-medium border border-line text-content-muted bg-surface-elevated cursor-not-allowed"
                          >
                            ✓ Plan actuel
                          </button>
                        ) : (
                          <button
                            onClick={() => handleCheckout(pid, upgradePeriod)}
                            disabled={billingLoading}
                            className={`w-full py-2 rounded-lg text-xs font-semibold transition disabled:opacity-40 ${
                              isRecommended
                                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500 shadow shadow-violet-500/20'
                                : 'border border-line bg-surface-card hover:bg-surface-elevated text-content-primary'
                            }`}
                          >
                            {billingLoading ? <RefreshCw className="h-3 w-3 animate-spin mx-auto" /> : `Choisir ${plan.name}`}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* ─── Aide ───────────────────────────────────────── */}
            <section id="help" className="scroll-mt-20">
              <SectionHeader
                icon={<BookOpen className="h-5 w-5 text-violet-500" />}
                title={t('settings.navHelp')}
                subtitle={t('settings.helpSectionDesc')}
              />

              <div className="mt-4">
                <SettingRow
                  icon={<BookOpen className="h-4 w-4 text-violet-500" />}
                  title={t('settings.interactiveTutorial')}
                  description={t('settings.interactiveTutorialDesc')}
                  control={
                    <button
                      onClick={() => {
                        localStorage.removeItem('onboarding_completed');
                        router.push('/dashboard?onboarding=1');
                      }}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-violet-500/10 text-violet-600 hover:bg-violet-500/20 border border-violet-500/30 transition whitespace-nowrap"
                    >
                      <BookOpen className="h-3.5 w-3.5" />
                      {t('settings.reviewGuide')}
                    </button>
                  }
                />
              </div>
            </section>

            {/* ─── Danger zone ────────────────────────────────── */}
            <section id="danger" className="scroll-mt-20">
              <div className="rounded-xl border-2 border-red-500/20 bg-red-500/[0.02] p-5">
                <div className="flex items-start gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-red-500/15">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-base font-semibold text-red-500">{t('settings.dangerZone')}</h2>
                    <p className="text-xs text-content-tertiary mt-0.5">{t('settings.dangerZoneDesc')}</p>
                  </div>
                </div>

                <p className="text-sm text-content-secondary mb-4 leading-relaxed">
                  {t('settings.deleteAccountWarning')}
                </p>

                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-red-500/10 text-red-500 border border-red-500/30 hover:bg-red-500/20 transition"
                >
                  <Trash2 className="h-4 w-4" />
                  {t('settings.deleteMyAccount')}
                </button>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
