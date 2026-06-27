import { Outlet } from 'react-router';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function Layout() {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 relative">
      {/* Aurora background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-400/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] rounded-full bg-cyan-400/20 blur-[120px]" />
      </div>

      {/* Sidebar on the left */}
      <div className="z-10 flex h-full">
        <Sidebar />
      </div>
      
      {/* Right panel */}
      <div className="h-screen flex-1 min-w-0 overflow-y-auto bg-transparent z-10 relative">
        {/* Topbar across the top of right panel */}
        <Topbar />
        
        {/* Main content container */}
        <main className="min-h-full pb-16">
          {/* Render child routes directly so they can manage their own padding and background */}
          <Outlet />
        </main>
      </div>
    </div>
  );
}
