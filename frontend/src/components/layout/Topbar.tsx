import {
  Bell,
  ChevronDown,
  Globe,
  LogOut,
  Settings,
  User,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useAuth } from '../../contexts/AuthContext';
import './Topbar.css';

// ─── Route → Page title map ───────────────────────────────────────────────────

const ROUTE_TITLES: Record<string, string> = {
  '/dashboard':       'Dashboard',
  '/chats':           'Chats',
  '/teams':           'Teams',
  '/team-workspace':  'Team Workspace',
  '/task-detail':     'Task Detail',
  '/action-points':   'Action Points',
  '/documents':       'Documents',
  '/discussions':     'Discussions',
  '/directory':       'Branch Directory',
  '/regulations':     'Regulations',
  '/notifications':   'Notifications',
  '/branch-transfer': 'Branch Transfer',
  // Admin routes
  '/admin/approvals':  'Admin Control Panel',
  '/admin/users':      'User Management',
  '/admin/compliance': 'Compliance Monitoring',
};

// ─── Language options ─────────────────────────────────────────────────────────

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'ar', label: 'العربية' },
  { code: 'de', label: 'Deutsch' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Derive a clean page title from the current pathname */
function usePageTitle(): string {
  const { pathname } = useLocation();
  // exact match first, then prefix match for nested routes
  if (ROUTE_TITLES[pathname]) return ROUTE_TITLES[pathname];
  const prefix = Object.keys(ROUTE_TITLES).find((k) => pathname.startsWith(k));
  return prefix ? ROUTE_TITLES[prefix] : 'RegIntel';
}

/** Close a dropdown when the user clicks outside the given ref */
function useClickOutside(ref: React.RefObject<HTMLElement | null>, onClose: () => void) {
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [ref, onClose]);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Language / region picker */
const LangPicker = () => {
  const [open, setOpen]   = useState(false);
  const [lang, setLang]   = useState('en');
  const containerRef      = useRef<HTMLDivElement>(null);

  useClickOutside(containerRef, () => setOpen(false));

  const current = LANGUAGES.find((l) => l.code === lang)!;

  return (
    <div className="tb-lang" ref={containerRef}>
      <button
        id="tb-lang-btn"
        className="tb-icon-btn tb-lang__trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Language: ${current.label}`}
        onClick={() => setOpen((v) => !v)}
      >
        <Globe size={18} />
        <span className="tb-lang__code">{lang.toUpperCase()}</span>
        <ChevronDown size={13} className={`tb-lang__chevron${open ? ' tb-lang__chevron--open' : ''}`} />
      </button>

      {open && (
        <ul
          className="tb-dropdown tb-lang__menu"
          role="listbox"
          aria-labelledby="tb-lang-btn"
        >
          {LANGUAGES.map(({ code, label }) => (
            <li
              key={code}
              role="option"
              aria-selected={code === lang}
              className={`tb-dropdown__item${code === lang ? ' tb-dropdown__item--selected' : ''}`}
              onClick={() => { setLang(code); setOpen(false); }}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { setLang(code); setOpen(false); } }}
              tabIndex={0}
            >
              {label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

/** Notification bell with live badge counter */
const NotificationBell = ({ count }: { count: number }) => {
  const navigate = useNavigate();
  const capped = Math.min(count, 99);
  return (
    <button
      className="tb-icon-btn tb-notif-btn"
      aria-label={`Notifications – ${count} unread`}
      type="button"
      onClick={() => navigate('/notifications')}
    >
      <Bell size={19} />
      {count > 0 && (
        <span className="tb-notif-badge" aria-hidden="true">
          {capped}
        </span>
      )}
    </button>
  );
};

/** User profile dropdown */
const ProfileMenu = () => {
  const { user: MOCK_USER } = useAuth();
  const [open, setOpen] = useState(false);
  const containerRef   = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useClickOutside(containerRef, () => setOpen(false));

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="tb-profile" ref={containerRef}>
      <button
        id="tb-profile-btn"
        className="tb-profile__trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Profile menu for ${MOCK_USER.name}`}
        onClick={() => setOpen((v) => !v)}
      >
        {/* Avatar */}
        <span className="tb-profile__avatar" aria-hidden="true">
          {MOCK_USER.initials}
        </span>

        {/* Name + branch */}
        <span className="tb-profile__meta">
          <span className="tb-profile__name">{MOCK_USER.name}</span>
          <span className="tb-profile__branch">{MOCK_USER.branch}</span>
        </span>

        <ChevronDown
          size={14}
          className={`tb-profile__chevron${open ? ' tb-profile__chevron--open' : ''}`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <ul
          className="tb-dropdown tb-profile__menu"
          role="menu"
          aria-labelledby="tb-profile-btn"
        >
          {/* Info header */}
          <li className="tb-dropdown__header" role="presentation">
            <span className="tb-dropdown__user-name">{MOCK_USER.name}</span>
            <span className="tb-dropdown__user-role">{MOCK_USER.role}</span>
          </li>
          <li role="separator" className="tb-dropdown__sep" />

          <li role="menuitem" className="tb-dropdown__item" tabIndex={0}
            onClick={() => setOpen(false)}
            onKeyDown={(e) => { if (e.key === 'Enter') setOpen(false); }}
          >
            <User size={15} aria-hidden="true" />
            My Profile
          </li>
          <li role="menuitem" className="tb-dropdown__item" tabIndex={0}
            onClick={() => setOpen(false)}
            onKeyDown={(e) => { if (e.key === 'Enter') setOpen(false); }}
          >
            <Settings size={15} aria-hidden="true" />
            Settings
          </li>
          <li role="separator" className="tb-dropdown__sep" />
          <li role="menuitem" className="tb-dropdown__item tb-dropdown__item--danger" tabIndex={0}
            onClick={() => { setOpen(false); localStorage.clear(); navigate('/login'); }}
            onKeyDown={(e) => { if (e.key === 'Enter') { setOpen(false); localStorage.clear(); navigate('/login'); } }}
          >
            <LogOut size={15} aria-hidden="true" />
            Sign out
          </li>
        </ul>
      )}
    </div>
  );
};

// ─── Settings Button (admin/manager only) ─────────────────────────────────────

const SettingsButton = () => {
  const navigate = useNavigate();
  return (
    <button
      className="tb-icon-btn"
      aria-label="Admin Settings"
      title="Admin Control Panel"
      type="button"
      onClick={() => navigate('/admin/approvals')}
    >
      <Settings size={18} />
    </button>
  );
};

// ─── Topbar ───────────────────────────────────────────────────────────────────

const Topbar = () => {
  const pageTitle = usePageTitle();
  const { isAdmin, toggleRole, user } = useAuth();

  return (
    <header className="topbar" role="banner">
      {/* ── Left: title ── */}
      <div className="topbar__left flex items-center gap-4">
        <h1 className="topbar__title">{pageTitle}</h1>
      </div>

      {/* ── Right: controls cluster ── */}
      <div className="topbar__right" role="group" aria-label="Global controls">
        <LangPicker />
        {isAdmin && <SettingsButton />}
        <NotificationBell count={user.unreadNotifications} />
        <div className="topbar__divider" aria-hidden="true" />
        <ProfileMenu />
      </div>
    </header>
  );
};

export default Topbar;
