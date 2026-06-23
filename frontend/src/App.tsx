import { BrowserRouter, Navigate, Route, Routes } from 'react-router';

// Layout wrapper (Sidebar will be built next)
import Layout from './components/layout/Layout';

// Public pages
import Login from './pages/public/Login';
import RequestAccess from './pages/public/RequestAccess';

// Protected pages
import ActionPoints from './pages/protected/ActionPoints';
import Chats from './pages/protected/Chats';
import Dashboard from './pages/protected/Dashboard';
import Directory from './pages/protected/Directory';
import Discussions from './pages/protected/Discussions';
import Documents from './pages/protected/Documents';
import Notifications from './pages/protected/Notifications';
import Teams from './pages/protected/Teams';
import TeamWorkspace from './pages/protected/TeamWorkspace';

/**
 * App – root router configuration for RegIntel.
 *
 * Public routes (no auth required):
 *   /            → redirects to /login
 *   /login       → <Login />
 *   /request-access → <RequestAccess />
 *
 * Protected routes (wrapped by <Layout />):
 *   /dashboard        → <Dashboard />
 *   /chats            → <Chats />
 *   /teams            → <Teams />
 *   /teams/:teamId    → <TeamWorkspace />
 *   /action-points    → <ActionPoints />
 *   /documents        → <Documents />
 *   /discussions      → <Discussions />
 *   /directory        → <Directory />
 *   /notifications    → <Notifications />
 */
const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* ── Public routes ── */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/request-access" element={<RequestAccess />} />

        {/* ── Protected routes (wrapped by Layout) ── */}
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/chats" element={<Chats />} />
          <Route path="/teams" element={<Teams />} />
          <Route path="/teams/:teamId" element={<TeamWorkspace />} />
          <Route path="/action-points" element={<ActionPoints />} />
          <Route path="/documents" element={<Documents />} />
          <Route path="/discussions" element={<Discussions />} />
          <Route path="/directory" element={<Directory />} />
          <Route path="/notifications" element={<Notifications />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
