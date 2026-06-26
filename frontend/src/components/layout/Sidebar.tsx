import {
  Bell,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Settings,
  Users,
} from 'lucide-react';
import { NavLink, useNavigate } from 'react-router';
import { useAuth } from '../../contexts/AuthContext';

// ─── Nav items ────────────────────────────────────────────────────────────────

const MAIN_LINKS = [
  { label: 'Dashboard',      to: '/dashboard',      icon: <LayoutDashboard size={17} /> },
  { label: 'Chats',          to: '/chats',           icon: <MessageSquare size={17} />,  badge: { count: 5, color: 'bg-blue-100 text-blue-700' } },
  { label: 'Teams',          to: '/teams',           icon: <Users size={17} /> },
  { label: 'Notifications',  to: '/notifications',  icon: <Bell size={17} />, badge: { count: 4, color: 'bg-red-100 text-red-700' } },
];

// ─── Sidebar link component ───────────────────────────────────────────────────

const SidebarLink = ({
  label, to, icon,
  badge,
  activeColor = 'bg-blue-50 text-blue-700',
  activeIcon  = 'text-blue-600',
}: {
  label: string; to: string; icon: React.ReactNode;
  badge?: { count: number; color: string };
  activeColor?: string; activeIcon?: string;
}) => (
  <li>
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center justify-between px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-300 ease-in-out active:scale-95 ${
          isActive ? activeColor : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:-translate-y-0.5 hover:shadow-sm'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <div className="flex items-center gap-3">
            <span className={isActive ? activeIcon : 'text-gray-400'}>{icon}</span>
            {label}
          </div>
          {badge && (
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${badge.color}`}>
              {badge.count}
            </span>
          )}
        </>
      )}
    </NavLink>
  </li>
);

// ─── Component ────────────────────────────────────────────────────────────────

export default function Sidebar() {
  const navigate = useNavigate();
  const { user: SESSION, isAdmin } = useAuth();

  return (
    <aside className="w-64 h-screen bg-white/60 backdrop-blur-xl border-r border-white/40 flex flex-col font-sans shrink-0 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
      {/* Logo */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-extrabold text-sm shadow-sm">
            R
          </div>
          <span className="font-bold text-gray-900 text-lg tracking-tight">RegIntel</span>
        </div>

        {/* Active Branch */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-3.5 border border-blue-100/80">
          <p className="text-[10px] font-bold text-blue-600 tracking-widest uppercase mb-2">Active Branch</p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shrink-0" />
            <div>
              <p className="text-[13px] font-bold text-gray-900 leading-tight">{SESSION.branch}</p>
              <p className="text-[11px] text-gray-500 mt-0.5">{SESSION.branchFull}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 overflow-y-auto space-y-5 pb-4">
        {/* Main */}
        <div>
          <p className="px-3 text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-1.5">Main</p>
          <ul className="space-y-0.5">
            {MAIN_LINKS.map((item) => (
              <SidebarLink key={item.to} {...item} />
            ))}
          </ul>
        </div>

        {/* Administration (admin/manager only) */}
        {isAdmin && (
          <div>
            <p className="px-3 text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-1.5">Administration</p>
            <ul className="space-y-0.5">
              <SidebarLink
                label="Settings"
                to="/admin/approvals"
                icon={<Settings size={17} />}
                activeColor="bg-purple-50 text-purple-700"
                activeIcon="text-purple-600"
              />
            </ul>
          </div>
        )}
      </nav>

      {/* User Profile & Logout */}
      <div className="px-3 pb-4 pt-4 border-t border-gray-100 flex flex-col gap-2">
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-300">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-sm font-bold shrink-0 shadow-sm">
            {SESSION.initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold text-gray-900 truncate">{SESSION.name}</p>
            <p className="text-[11px] text-gray-500 truncate">{SESSION.empId} · {SESSION.role}</p>
          </div>
        </div>
        <button
          onClick={() => {
            // Clear any mock auth state here if applicable
            localStorage.clear();
            navigate('/login');
          }}
          className="flex items-center justify-center gap-2 w-full px-3 py-2.5 rounded-lg text-[13px] font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-all duration-300 ease-in-out hover:-translate-y-0.5 hover:shadow-sm active:scale-95 cursor-pointer"
        >
          <LogOut size={16} />
          Log Out
        </button>
      </div>
    </aside>
  );
}
