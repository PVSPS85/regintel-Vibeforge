import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import { AuthProvider } from './contexts/AuthContext';

// Layout & Auth wrappers
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Public pages
import Login from './pages/public/Login';
import RequestAccess from './pages/public/RequestAccess';

// Protected pages (existing)
import ActionPoints from './pages/protected/ActionPoints';
import Chats from './pages/protected/Chats';
import Dashboard from './pages/protected/Dashboard';
import Directory from './pages/protected/Directory';
import Discussions from './pages/protected/Discussions';
import Documents from './pages/protected/Documents';
import Notifications from './pages/protected/Notifications';
import TaskDetail from './pages/protected/TaskDetail';
import TeamDetails from './pages/protected/TeamDetails';
import Teams from './pages/protected/Teams';
import TeamWorkspace from './pages/protected/TeamWorkspace';

// Protected pages (new)
import BranchTransfer from './pages/(protected)/BranchTransfer';
import Regulations from './pages/(protected)/Regulations';

// Admin pages
import ComplianceOversight from './pages/(admin)/ComplianceOversight';
import EmployeeApproval from './pages/(admin)/EmployeeApproval';
import UserManagement from './pages/(admin)/UserManagement';

/**
 * App – root router configuration for RegIntel.
 *
 * Public routes (no auth required):
 *   /                → redirects to /login
 *   /login           → <Login />
 *   /request-access  → <RequestAccess />
 *
 * Protected routes (wrapped by <Layout />):
 *   /dashboard           → <Dashboard />
 *   /chats               → <Chats />
 *   /teams               → <Teams />
 *   /teams/:teamId       → <TeamWorkspace />
 *   /action-points       → <ActionPoints />
 *   /documents           → <Documents />
 *   /discussions         → <Discussions />
 *   /directory           → <Directory />
 *   /notifications       → <Notifications />
 *   /regulations         → <Regulations />
 *   /branch-transfer     → <BranchTransfer />
 *
 * Admin routes (also wrapped by <Layout />):
 *   /admin/approvals     → <EmployeeApproval />
 *   /admin/users         → <UserManagement />
 *   /admin/compliance    → <ComplianceOversight />
 */
const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
        {/* ── Public routes ── */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/request-access" element={<RequestAccess />} />

        {/* ── Protected + Admin routes (wrapped by ProtectedRoute + Layout) ── */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            {/* Protected – core workspace */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/chats" element={<Chats />} />
            <Route path="/teams" element={<Teams />} />
            <Route path="/teams/:teamId" element={<TeamDetails />} />
            <Route path="/teams/:teamId/workspace" element={<TeamWorkspace />} />
            <Route path="/team-workspace" element={<TeamWorkspace />} />
            <Route path="/task-detail" element={<TaskDetail />} />
            <Route path="/tasks/:taskId" element={<TaskDetail />} />
            <Route path="/action-points" element={<ActionPoints />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/discussions" element={<Discussions />} />
            <Route path="/directory" element={<Directory />} />
            <Route path="/notifications" element={<Notifications />} />

            {/* Protected – new pages */}
            <Route path="/regulations" element={<Regulations />} />
            <Route path="/branch-transfer" element={<BranchTransfer />} />

            {/* Admin pages */}
            <Route path="/admin/approvals" element={<EmployeeApproval />} />
            <Route path="/admin/users" element={<UserManagement />} />
            <Route path="/admin/compliance" element={<ComplianceOversight />} />
          </Route>
        </Route>
      </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
