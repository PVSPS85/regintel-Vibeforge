import { Outlet } from 'react-router';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function Layout() {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-white">
      {/* Sidebar on the left */}
      <Sidebar />
      
      {/* Right panel */}
      <div className="h-screen flex flex-col flex-1 min-w-0">
        {/* Topbar across the top of right panel */}
        <Topbar />
        
        {/* Main content container */}
        <main className="flex-1 overflow-y-auto bg-[#f3f3f5] p-6 pb-10">
          {/* Render child routes */}
          <div className="min-h-full w-full rounded-md bg-white shadow-sm border border-[rgba(0,0,0,0.1)]/50 pb-10">
             <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
