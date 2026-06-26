import {
  Activity,
  AlertCircle,
  CheckCircle2,
  FileText,
  ShieldAlert,
  Users,
  Clock,
  RefreshCw,
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
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface RegulationSummary {
  id: string;
  title: string;
  created_at: string;
  status: string;
}

interface TeamComplianceSummary {
  name: string;
  score: number;
  color: string;
}

interface DashboardMetrics {
  pending_tasks: number;
  completed_tasks: number;
  active_teams: number;
  total_circulars: number;
  compliance_score: number;
  recent_regulations: RegulationSummary[];
  team_compliance: TeamComplianceSummary[];
}

// ─── Static Chart Trends (7-month historical demo) ───────────────────────────

const COMPLIANCE_TREND = [
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
    title: 'New RBI Circular Ingested',
    desc: 'Master Direction on Digital Lending Guidelines',
    time: '10 mins ago',
  },
  {
    id: 2,
    icon: <Users size={14} className="text-green-600" />,
    bg: 'bg-green-50',
    title: 'Action Point Assigned to IT Security',
    desc: 'Implement mandatory 2FA for all branch portals.',
    time: '2 hours ago',
  },
  {
    id: 3,
    icon: <CheckCircle2 size={14} className="text-gray-600" />,
    bg: 'bg-gray-100',
    title: 'AI Compliance Audit Passed',
    desc: 'Automated check completed for Q2 AML ledger.',
    time: '5 hours ago',
  },
  {
    id: 4,
    icon: <ShieldAlert size={14} className="text-orange-600" />,
    bg: 'bg-orange-50',
    title: 'High Priority Alert',
    desc: 'KYC renewal due for 14 enterprise branch accounts.',
    time: '1 day ago',
  },
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
      <h3 className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-cyan-600 tracking-tight">
        {value}
      </h3>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-1">{title}</p>
    </div>
  </div>
);

// ─── Main Dashboard Page ──────────────────────────────────────────────────────

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<DashboardMetrics>('/dashboard/metrics');
      setMetrics(data);
    } catch (err: any) {
      setError('Unable to fetch live database statistics. Showing cached demo metrics.');
      // Provide clean fallback metrics so prototype stays visually stunning
      setMetrics({
        pending_tasks: 23,
        completed_tasks: 148,
        active_teams: 5,
        total_circulars: 12,
        compliance_score: 91,
        recent_regulations: [
          { id: '1', title: 'RBI Master Direction on IT Risk 2026', created_at: 'Jun 22, 2026', status: 'ANALYZED' },
          { id: '2', title: 'SEBI Cybersecurity Audit Guidelines', created_at: 'Jun 19, 2026', status: 'ANALYZED' },
          { id: '3', title: 'BASEL III Capital Buffer Circular', created_at: 'Jun 14, 2026', status: 'ANALYZED' },
          { id: '4', title: 'DPDP Privacy Mandate Memo', created_at: 'Jun 10, 2026', status: 'ANALYZED' },
        ],
        team_compliance: [
          { name: 'IT Security', score: 98, color: 'bg-green-500' },
          { name: 'Compliance Ops', score: 92, color: 'bg-blue-500' },
          { name: 'Legal & Risk', score: 85, color: 'bg-yellow-500' },
          { name: 'Branch Auditing', score: 90, color: 'bg-purple-500' },
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const todayStr = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 font-sans min-h-screen">
      
      {/* ── Section A: Welcome Header ── */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
            Dashboard · Live Supabase PostgreSQL Metrics
          </p>
          <div className="flex items-center gap-4">
            <p className="text-sm font-medium text-gray-400 hidden sm:block">
              {todayStr}
            </p>
            <button
              onClick={fetchMetrics}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              <span>Refresh Data</span>
            </button>
          </div>
        </div>
        <div className="mt-1">
          <h1 className="text-3xl font-bold text-gray-900 leading-tight">
            Good morning,<br />{user?.name ?? 'Branch Administrator'}
          </h1>
          <p className="text-sm text-gray-500 mt-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{user?.branchFull ?? 'Headquarters'} ({user?.branch ?? 'HQ'})</span>
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-2.5 text-amber-800 text-sm font-medium">
          <AlertCircle size={18} className="shrink-0 text-amber-600" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Section B: Live Summary Metric Cards ── */}
      {loading && !metrics ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-white/60 backdrop-blur-md rounded-2xl p-5 border border-gray-100 animate-pulse h-28 flex flex-col justify-between">
              <div className="w-10 h-10 rounded-lg bg-gray-200/80" />
              <div className="space-y-2">
                <div className="h-6 bg-gray-200/80 rounded w-16" />
                <div className="h-3 bg-gray-200/80 rounded w-24" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <MetricCard
            title="Pending Action Points"
            value={metrics?.pending_tasks ?? 0}
            icon={<Clock size={20} />}
            colorClass="text-orange-600"
            bgClass="bg-orange-50"
          />
          <MetricCard
            title="Resolved Tasks"
            value={metrics?.completed_tasks ?? 0}
            icon={<CheckCircle2 size={20} />}
            colorClass="text-green-600"
            bgClass="bg-green-50"
          />
          <MetricCard
            title="Active Teams"
            value={metrics?.active_teams ?? 0}
            icon={<Users size={20} />}
            colorClass="text-blue-600"
            bgClass="bg-blue-50"
          />
          <MetricCard
            title="Ingested Circulars"
            value={metrics?.total_circulars ?? 0}
            icon={<FileText size={20} />}
            colorClass="text-cyan-600"
            bgClass="bg-cyan-50"
          />
          <MetricCard
            title="Compliance Score"
            value={`${metrics?.compliance_score ?? 92}%`}
            icon={<Activity size={20} />}
            colorClass="text-purple-600"
            bgClass="bg-purple-50"
          />
        </div>
      )}

      {/* ── Section C: Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Line Chart: Compliance Score Trend */}
        <div className="lg:col-span-2 bg-white/80 backdrop-blur-lg p-6 rounded-2xl border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(79,70,229,0.1)] hover:border-indigo-500/20">
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h3 className="text-base font-bold text-gray-900">Compliance Score Trend</h3>
              <p className="text-[13px] text-gray-500 mt-1">7-month branch historical performance</p>
            </div>
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={COMPLIANCE_TREND} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
              <h3 className="text-base font-bold text-gray-900">Weekly Task Delivery</h3>
              <p className="text-[13px] text-gray-500 mt-1">Completed vs Pending action items</p>
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

      {/* ── Section D: Bottom Row Panels ── */}
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

        {/* Panel 2: Live Team Compliance */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(79,70,229,0.1)] hover:border-indigo-500/20">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-bold text-gray-900">Department Readiness</h3>
            <button onClick={() => navigate('/teams')} className="text-[13px] font-semibold text-blue-600 hover:text-blue-700 transition-all active:scale-95 cursor-pointer">View All</button>
          </div>
          <div className="space-y-6">
            {(metrics?.team_compliance ?? []).map((team) => (
              <div key={team.name}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[13px] font-semibold text-gray-900">{team.name}</span>
                  <span className="text-[13px] font-bold text-gray-700">{team.score}%</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full ${team.color} rounded-full transition-all duration-500`} style={{ width: `${team.score}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Panel 3: Live Ingested Regulations */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(79,70,229,0.1)] hover:border-indigo-500/20">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-bold text-gray-900">Recent Circulars</h3>
            <button onClick={() => navigate('/regulations')} className="text-[13px] font-semibold text-blue-600 hover:text-blue-700 transition-all active:scale-95 cursor-pointer">View All</button>
          </div>
          <div className="space-y-4">
            {(metrics?.recent_regulations ?? []).map((reg, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md bg-white border border-gray-200 flex items-center justify-center shrink-0">
                    <FileText size={14} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-gray-900 line-clamp-1">{reg.title}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{reg.created_at}</p>
                  </div>
                </div>
                <span className="px-2 py-1 rounded text-[10px] font-bold tracking-wider bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20 shrink-0">
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
