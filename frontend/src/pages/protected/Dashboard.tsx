import {
  Activity,
  AlertCircle,
  BellRing,
  CheckCircle2,
  ChevronRight,
  FileText,
  MessageSquare,
  ShieldAlert,
  Users,
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
    icon: <FileText size={16} className="text-indigo-600" />,
    bg: 'bg-indigo-50',
    title: 'New Regulation Uploaded by AI Agent',
    desc: 'RBI Circular on Digital Lending Guidelines parsed and mapped.',
    time: '10 mins ago',
  },
  {
    id: 2,
    icon: <Users size={16} className="text-emerald-600" />,
    bg: 'bg-emerald-50',
    title: 'Task Assigned to IT Security Team',
    desc: 'Implement mandatory 2FA for all internal branch portals.',
    time: '2 hours ago',
  },
  {
    id: 3,
    icon: <CheckCircle2 size={16} className="text-blue-600" />,
    bg: 'bg-blue-50',
    title: 'Branch Transfer Request Processed',
    desc: 'Employee ID #8492 transferred to Mumbai South Branch.',
    time: '5 hours ago',
  },
  {
    id: 4,
    icon: <ShieldAlert size={16} className="text-amber-600" />,
    bg: 'bg-amber-50',
    title: 'Compliance Alert Triggered',
    desc: 'KYC missing for 14 high-value accounts in Fort Branch.',
    time: '1 day ago',
  },
];

// ─── Components ───────────────────────────────────────────────────────────────

const MetricCard = ({
  title,
  value,
  icon,
  trend,
  trendLabel,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  trendLabel?: string;
}) => (
  <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm transition-shadow hover:shadow-md">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-[13px] font-medium text-gray-500 mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
      </div>
      <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center text-gray-600 border border-gray-100">
        {icon}
      </div>
    </div>
    {trend && (
      <div className="mt-4 flex items-center gap-2">
        <span
          className={`text-[12px] font-semibold ${
            trend.startsWith('+') ? 'text-emerald-600' : 'text-red-600'
          }`}
        >
          {trend}
        </span>
        <span className="text-[12px] text-gray-400">{trendLabel}</span>
      </div>
    )}
  </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────

const Dashboard = () => {
  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 font-sans">
      {/* ── Section A: Welcome Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-700/10">
              Mumbai - Fort Branch
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Systems Online
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Welcome back, Arjun Mehta.
          </h1>
          <p className="text-[14px] text-gray-500 mt-1">
            Here's what's happening in your regulatory workspace today.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="h-10 px-4 rounded-lg bg-white border border-gray-200 text-[13px] font-semibold text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm">
            Generate Report
          </button>
          <button
            className="h-10 px-4 rounded-lg text-[13px] font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
            style={{ background: '#030213' }}
          >
            New Action Point
          </button>
        </div>
      </div>

      {/* ── Section B: Summary Metric Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard
          title="Pending Action Points"
          value="23"
          icon={<AlertCircle size={20} />}
          trend="-4"
          trendLabel="vs last week"
        />
        <MetricCard
          title="Unread Messages"
          value="148"
          icon={<MessageSquare size={20} />}
          trend="+12"
          trendLabel="since yesterday"
        />
        <MetricCard
          title="Active Teams"
          value="5"
          icon={<Users size={20} />}
        />
        <MetricCard
          title="Urgent Notifications"
          value="7"
          icon={<BellRing size={20} className="text-red-500" />}
        />
        <MetricCard
          title="Compliance Rating"
          value="91%"
          icon={<Activity size={20} className="text-indigo-600" />}
          trend="+2.4%"
          trendLabel="vs last month"
        />
      </div>

      {/* ── Section C & D: Charts & Activity ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Charts Column (Span 2) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Area Chart: Compliance Score Trend */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="mb-6">
              <h3 className="text-base font-bold text-gray-900">Compliance Score Trend</h3>
              <p className="text-[13px] text-gray-500">7-month historical performance</p>
            </div>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={COMPLIANCE_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#030213" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#030213" stopOpacity={0} />
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
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="#030213"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorScore)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bar Chart: Task Delivery */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="mb-6">
              <h3 className="text-base font-bold text-gray-900">Monthly Task Delivery</h3>
              <p className="text-[13px] text-gray-500">Completed vs Pending action points</p>
            </div>
            <div className="h-[240px] w-full">
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
                  <Bar dataKey="completed" name="Completed" fill="#030213" radius={[4, 4, 0, 0]} barSize={32} />
                  <Bar dataKey="pending" name="Pending" fill="#e5e7eb" radius={[4, 4, 0, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* Activity Log Column (Span 1) */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-gray-900">Recent Activity</h3>
              <p className="text-[13px] text-gray-500">Live system events</p>
            </div>
            <button className="text-[13px] font-semibold text-indigo-600 hover:text-indigo-700 flex items-center">
              View All <ChevronRight size={14} className="ml-0.5" />
            </button>
          </div>
          <div className="p-6 flex-1">
            <div className="space-y-6">
              {RECENT_ACTIVITY.map((item, idx) => (
                <div key={item.id} className="relative flex gap-4">
                  {/* Vertical timeline line */}
                  {idx !== RECENT_ACTIVITY.length - 1 && (
                    <div className="absolute top-8 bottom-[-24px] left-[15px] w-px bg-gray-100" />
                  )}
                  
                  {/* Icon */}
                  <div className={`w-8 h-8 rounded-full ${item.bg} flex items-center justify-center shrink-0 ring-4 ring-white z-10`}>
                    {item.icon}
                  </div>
                  
                  {/* Content */}
                  <div className="pt-1.5 pb-2">
                    <p className="text-[14px] font-semibold text-gray-900 leading-tight">
                      {item.title}
                    </p>
                    <p className="text-[13px] text-gray-500 mt-1 leading-snug">
                      {item.desc}
                    </p>
                    <p className="text-[11px] font-medium text-gray-400 mt-2 uppercase tracking-wider">
                      {item.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Bottom Callout */}
          <div className="p-5 bg-gray-50 mt-auto rounded-b-xl border-t border-gray-100">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center shrink-0">
                <AlertCircle size={16} className="text-indigo-600" />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-gray-900">Weekly Summary Ready</p>
                <p className="text-[12px] text-gray-500 mt-0.5">Your AI-generated digest for Fort Branch is available.</p>
                <button className="text-[12px] font-semibold text-indigo-600 mt-2 hover:underline">
                  Read Digest
                </button>
              </div>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default Dashboard;
