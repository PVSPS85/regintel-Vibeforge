import { Outlet } from 'react-router';
import Topbar from './Topbar';
import Sidebar, { type UserRole } from './Sidebar';

/**
 * Layout – wraps all protected routes.
 *
 * `userRole` is currently mocked here; once auth is wired up, replace with a
 * value sourced from your auth context / store.
 *
 * Try switching the value below to "Branch Manager" or "System Admin" to see
 * the Admin Control Panel section appear in the sidebar.
 */
const MOCK_ROLE: UserRole = 'Employee';

const Layout = () => {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      <Sidebar userRole={MOCK_ROLE} />

      {/* Right column: topbar + page content */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <Topbar />

        <main style={{ flex: 1, minWidth: 0 }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
