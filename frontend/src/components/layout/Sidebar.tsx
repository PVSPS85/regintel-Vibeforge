import {
  Bell,
  BookOpen,
  CheckSquare,
  FileText,
  LayoutDashboard,
  MessageSquare,
  MessagesSquare,
  Settings,
  Shield,
  ShieldCheck,
  Users,
  Users2,
} from 'lucide-react';
import { NavLink } from 'react-router';
import './Sidebar.css';

// ─── Types ──────────────────────────────────────────────────────────────────

export type UserRole = 'Employee' | 'Branch Manager' | 'System Admin';

interface NavItem {
  label: string;
  to: string;
  icon: React.ReactNode;
}

interface SidebarProps {
  /** Mock role – will be wired to real auth context later */
  userRole?: UserRole;
}

// ─── Nav definitions ─────────────────────────────────────────────────────────

const EMPLOYEE_LINKS: NavItem[] = [
  { label: 'Dashboard',     to: '/dashboard',     icon: <LayoutDashboard size={18} /> },
  { label: 'Chats',         to: '/chats',         icon: <MessageSquare   size={18} /> },
  { label: 'Teams',         to: '/teams',         icon: <Users           size={18} /> },
  { label: 'Action Points', to: '/action-points', icon: <CheckSquare     size={18} /> },
  { label: 'Documents',     to: '/documents',     icon: <FileText        size={18} /> },
  { label: 'Discussions',   to: '/discussions',   icon: <MessagesSquare  size={18} /> },
  { label: 'Regulations',   to: '/regulations',   icon: <BookOpen        size={18} /> },
  { label: 'Notifications', to: '/notifications', icon: <Bell            size={18} /> },
];

const ADMIN_LINKS: NavItem[] = [
  { label: 'Employee Approval',   to: '/admin/employee-approval',   icon: <ShieldCheck size={18} /> },
  { label: 'User Management',     to: '/admin/user-management',     icon: <Users2      size={18} /> },
  { label: 'Branch Management',   to: '/admin/branch-management',   icon: <Settings    size={18} /> },
  { label: 'Compliance Monitoring', to: '/admin/compliance',        icon: <Shield      size={18} /> },
];

const ELEVATED_ROLES: UserRole[] = ['Branch Manager', 'System Admin'];

// ─── Sidebar ─────────────────────────────────────────────────────────────────

const Sidebar = ({ userRole = 'Employee' }: SidebarProps) => {
  const isElevated = ELEVATED_ROLES.includes(userRole);

  return (
    <aside className="sidebar" aria-label="Main navigation">
      {/* ── Logo / Header ── */}
      <div className="sidebar__header">
        <div className="sidebar__logo-mark" aria-hidden="true">R</div>
        <div className="sidebar__brand">
          <span className="sidebar__brand-name">RegIntel</span>
          <span className="sidebar__brand-tagline">Regulatory Intelligence</span>
        </div>
      </div>

      {/* ── Role badge ── */}
      <div className="sidebar__role-badge" title={`Signed in as ${userRole}`}>
        <span className="sidebar__role-dot" aria-hidden="true" />
        {userRole}
      </div>

      {/* ── Employee navigation ── */}
      <nav aria-label="Employee navigation">
        <p className="sidebar__section-label">WORKSPACE</p>
        <ul className="sidebar__nav-list" role="list">
          {EMPLOYEE_LINKS.map(({ label, to, icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  `sidebar__nav-link${isActive ? ' sidebar__nav-link--active' : ''}`
                }
              >
                {({ isActive }) => (
                  <>
                    <span className="sidebar__nav-icon" aria-hidden="true">{icon}</span>
                    <span
                      className="sidebar__nav-label"
                      aria-current={isActive ? 'page' : undefined}
                    >
                      {label}
                    </span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* ── Admin Control Panel (elevated roles only) ── */}
      {isElevated && (
        <nav aria-label="Admin control panel">
          <div className="sidebar__divider" role="separator" />
          <p className="sidebar__section-label sidebar__section-label--admin">ADMIN CONTROL PANEL</p>
          <ul className="sidebar__nav-list" role="list">
            {ADMIN_LINKS.map(({ label, to, icon }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  className={({ isActive }) =>
                    `sidebar__nav-link sidebar__nav-link--admin${isActive ? ' sidebar__nav-link--active' : ''}`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span className="sidebar__nav-icon" aria-hidden="true">{icon}</span>
                      <span
                        className="sidebar__nav-label"
                        aria-current={isActive ? 'page' : undefined}
                      >
                        {label}
                      </span>
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      )}

      {/* ── Footer ── */}
      <div className="sidebar__footer">
        <p className="sidebar__footer-text">© 2026 RegIntel</p>
      </div>
    </aside>
  );
};

export default Sidebar;
