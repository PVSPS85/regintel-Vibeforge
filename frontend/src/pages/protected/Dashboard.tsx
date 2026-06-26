import {
  Activity,
  AlertCircle,
  CheckCircle2,
  FileText,
  ShieldAlert,
  Users,
  Clock,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useNavigate } from 'react-router';

// ─── Mock Data ───────────────────────────────────────────────────────────────

const COMPLIANCE_DATA = [
  { month: 'Jan', score: 82 },
  { month: 'Feb', score: 84 },
  { month: 'Mar', score: 83 },
  { month: 'Apr', score: 88 },
  { month: 'May', score: 89 },
  { month: 'Jun', score: 87 },
  { month: 'Jul', score: 91 },
];

const TASK_DELIVERY_DATA = [
  { week: 'W1', completed: 42, pending: 12 },
  { week: 'W2', completed: 58, pending: 8 },
  { week: 'W3', completed: 35, pending: 20 },
  { week: 'W4', completed: 64, pending: 5 },
];

const RECENT_ACTIVITY = [
  {
    id: 1,
    icon: <FileText size={14} className="text-blue-600" />,
    bg: 'bg-blue-50',
    title: 'New Regulation Uploaded',
    desc: 'RBI Circular on Digital Lending Guidelines',
    time: '10 mins ago',
  },
  {
    id: 2,
    icon: <Users size={14} className="text-green-600" />,
    bg: 'bg-green-50',
    title: 'Task Assigned to IT',
    desc: 'Implement mandatory 2FA for all branch portals.',
    time: '2 hours ago',
  },
  {
    id: 3,
    icon: <CheckCircle2 size={14} className="text-gray-600" />,
    bg: 'bg-gray-100',
    title: 'Branch Transfer Processed',
    desc: 'Employee ID #8492 transferred to MG Road.',
    time: '5 hours ago',
  },
  {
    id: 4,
    icon: <ShieldAlert size={14} className="text-orange-600" />,
    bg: 'bg-orange-50',
    title: 'Compliance Alert',
    desc: 'KYC missing for 14 high-value accounts.',
    time: '1 day ago',
  },
];

const TEAM_COMPLIANCE = [
  { name: 'IT Security', score: 98, color: 'bg-green-500' },
  { name: 'Compliance', score: 92, color: 'bg-blue-500' },
  { name: 'Legal', score: 85, color: 'bg-yellow-500' },
  { name: 'Human Resources', score: 76, color: 'bg-orange-500' },
];

const RECENT_REGULATIONS = [
  { title: 'Data Privacy Framework 2026', status: 'SENT', statusColor: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20' },
  { title: 'Q3 AML Reporting Guidelines', status: 'REVIEW', statusColor: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20' },
  { title: 'Cybersecurity Audit Memo', status: 'SENT', statusColor: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20' },
  { title: 'Branch Ops Manual v4', status: 'REVIEW', statusColor: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20' },
];

// ─── Components ───────────────────────────────────────────────────────────────

const MetricCard = ({
  title,
  value,
  icon,
  colorClass,
  bgClass,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  colorClass: string;
  bgClass: string;
}) => (
  <div className="bg-white/80 backdrop-blur-lg border border-white/50 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-5 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(79,70,229,0.1)] hover:border-indigo-500/20">
    <div className="flex items-center justify-between mb-4">
      <div className={`w-10 h-10 rounded-lg ${bgClass} flex items-center justify-center ${colorClass}`}>
        {icon}
      </div>
    </div>
    <div>
      <h3 className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-cyan-600 tracking-tight">{value}</h3>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-1">{title}</p>
    </div>
  </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────

const Dashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 font-sans min-h-screen">
      
      {/* ── Section A: Welcome Header ── */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
            Dashboard · Branch compliance overview
          </p>
          <p className="text-sm font-medium text-gray-400">
            Wednesday, 24 June 2026
          </p>
        </div>
        <div className="mt-2">
          <h1 className="text-3xl font-bold text-gray-900 leading-tight">
            Good morning,<br />New User
          </h1>
          <p className="text-sm text-gray-500 mt-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-600" />
            Bengaluru — MG Road Branch
          </p>
        </div>
      </div>

      {/* ── Section B: Summary Metric Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard
          title="Pending Tasks"
          value="23"
          icon={<Clock size={20} />}
          colorClass="text-orange-600"
          bgClass="bg-orange-50"
        />
        <MetricCard
          title="Completed Tasks"
          value="148"
          icon={<CheckCircle2 size={20} />}
          colorClass="text-green-600"
          bgClass="bg-green-50"
        />
        <MetricCard
          title="Active Teams"
          value="5"
          icon={<Users size={20} />}
          colorClass="text-blue-600"
          bgClass="bg-blue-50"
        />
        <MetricCard
          title="Open Alerts"
          value="7"
          icon={<AlertCircle size={20} />}
          colorClass="text-red-600"
          bgClass="bg-red-50"
        />
        <MetricCard
          title="Compliance Score"
          value="91%"
          icon={<Activity size={20} />}
          colorClass="text-purple-600"
          bgClass="bg-purple-50"
        />
      </div>

      {/* ── Section C: Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Line Chart: Compliance Score Trend */}
        <div className="lg:col-span-2 bg-white/80 backdrop-blur-lg p-6 rounded-2xl border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(79,70,229,0.1)] hover:border-indigo-500/20">
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h3 className="text-base font-bold text-gray-900">Compliance Score Trend</h3>
              <p className="text-[13px] text-gray-500 mt-1">7-month historical performance</p>
            </div>
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={COMPLIANCE_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#6b7280', fontSize: 12 }} 
                  dy={10}
                />
                <YAxis 
                  domain={['dataMin - 5', 100]} 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#6b7280', fontSize: 12 }} 
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="#2563eb"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorScore)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart: Monthly Task Volume */}
        <div className="bg-white/80 backdrop-blur-lg p-6 rounded-2xl border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(79,70,229,0.1)] hover:border-indigo-500/20">
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h3 className="text-base font-bold text-gray-900">Monthly Task Volume</h3>
              <p className="text-[13px] text-gray-500 mt-1">Completed vs Pending action points</p>
            </div>
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={TASK_DELIVERY_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis 
                  dataKey="week" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#6b7280', fontSize: 12 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#6b7280', fontSize: 12 }} 
                />
                <Tooltip 
                  cursor={{ fill: '#f3f4f6' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="completed" name="Completed" fill="#2563eb" radius={[4, 4, 0, 0]} barSize={24} />
                <Bar dataKey="pending" name="Pending" fill="#93c5fd" radius={[4, 4, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* ── Section D: Bottom Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Panel 1: Recent Activity */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(79,70,229,0.1)] hover:border-indigo-500/20">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-bold text-gray-900">Recent Activity</h3>
            <button onClick={() => navigate('/notifications')} className="text-[13px] font-semibold text-blue-600 hover:text-blue-700 transition-all active:scale-95 cursor-pointer">View All</button>
          </div>
          <div className="space-y-5">
            {RECENT_ACTIVITY.map((item) => (
              <div key={item.id} className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-full ${item.bg} flex items-center justify-center shrink-0`}>
                  {item.icon}
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-gray-900">{item.title}</p>
                  <p className="text-[12px] text-gray-500 mt-0.5">{item.desc}</p>
                  <p className="text-[11px] font-medium text-gray-400 mt-1 uppercase tracking-wider">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Panel 2: Team Compliance */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(79,70,229,0.1)] hover:border-indigo-500/20">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-bold text-gray-900">Team Compliance</h3>
            <button onClick={() => navigate('/teams')} className="text-[13px] font-semibold text-blue-600 hover:text-blue-700 transition-all active:scale-95 cursor-pointer">View All</button>
          </div>
          <div className="space-y-6">
            {TEAM_COMPLIANCE.map((team) => (
              <div key={team.name}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[13px] font-semibold text-gray-900">{team.name}</span>
                  <span className="text-[13px] font-bold text-gray-700">{team.score}%</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full ${team.color} rounded-full`} style={{ width: `${team.score}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Panel 3: Recent Regulations */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(79,70,229,0.1)] hover:border-indigo-500/20">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-bold text-gray-900">Recent Regulations</h3>
            <button onClick={() => navigate('/regulations')} className="text-[13px] font-semibold text-blue-600 hover:text-blue-700 transition-all active:scale-95 cursor-pointer">View All</button>
          </div>
          <div className="space-y-4">
            {RECENT_REGULATIONS.map((reg, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-gray-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md bg-white border border-gray-200 flex items-center justify-center shrink-0">
                    <FileText size={14} className="text-gray-500" />
                  </div>
                  <p className="text-[13px] font-semibold text-gray-900 line-clamp-1">{reg.title}</p>
                </div>
                <span className={`px-2 py-1 rounded text-[10px] font-bold tracking-wider ${reg.statusColor}`}>
                  {reg.status}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};

export default Dashboard;
