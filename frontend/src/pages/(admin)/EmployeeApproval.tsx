import {
  ArrowLeftRight,
  ArrowRight,
  Building2,
  Check,
  CheckCircle,
  ChevronDown,
  Clock,
  Eye,
  MoreHorizontal,
  Search,
  Shield,
  ShieldCheck,
  TrendingUp,
  User,
  UserCheck,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { useState } from 'react';

// ─── Types ─────────────────────────────────────────────────────────────────────

type ActiveTab =
  | 'approvals'
  | 'users'
  | 'branches'
  | 'transfers'
  | 'teams'
  | 'compliance';

interface AccessRequest {
  id: string;
  name: string;
  initials: string;
  color: string;
  empId: string;
  email: string;
  department: string;
  role: string;
  branchCode: string;
  branch: string;
  requestedAt: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}

interface StaffMember {
  id: string;
  name: string;
  initials: string;
  color: string;
  empId: string;
  department: string;
  role: 'System Admin' | 'Branch Manager' | 'Team Leader' | 'Employee';
  status: 'Active' | 'Inactive' | 'On Leave';
  lastLogin: string;
}

interface Branch {
  code: string;
  name: string;
  city: string;
  head: string;
  headInitials: string;
  headColor: string;
  employees: number;
  teams: number;
  compliance: number;
}

interface TransferRequest {
  id: string;
  name: string;
  initials: string;
  color: string;
  empId: string;
  from: string;
  to: string;
  reason: string;
  requestedAt: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}

interface TeamOverview {
  id: string;
  name: string;
  initials: string;
  color: string;
  lead: string;
  members: number;
  pending: number;
  done: number;
  compliance: number;
  status: 'On Track' | 'Needs Review' | 'Critical';
}

// ─── Mock Data ─────────────────────────────────────────────────────────────────

const ACCESS_REQUESTS: AccessRequest[] = [
  {
    id: 'APR-001',
    name: 'Sanjay Kumar',
    initials: 'SK',
    color: 'bg-blue-600',
    empId: 'EMP-5501',
    email: 'sanjay.k@regintel.in',
    department: 'Compliance',
    role: 'Employee',
    branchCode: 'MUM-01',
    branch: 'Mumbai — Fort Branch',
    requestedAt: '2 hours ago',
    status: 'Pending',
  },
  {
    id: 'APR-002',
    name: 'Leela Nair',
    initials: 'LN',
    color: 'bg-rose-500',
    empId: 'EMP-5502',
    email: 'leela.n@regintel.in',
    department: 'IT Security',
    role: 'Team Leader',
    branchCode: 'MUM-01',
    branch: 'Mumbai — Fort Branch',
    requestedAt: '4 hours ago',
    status: 'Pending',
  },
  {
    id: 'APR-003',
    name: 'Amol Patil',
    initials: 'AP',
    color: 'bg-violet-600',
    empId: 'EMP-5503',
    email: 'amol.p@regintel.in',
    department: 'Risk Management',
    role: 'Employee',
    branchCode: 'MUM-01',
    branch: 'Mumbai — Fort Branch',
    requestedAt: '1 day ago',
    status: 'Pending',
  },
];

const STAFF_MEMBERS: StaffMember[] = [
  { id: 's1', name: 'Arjun Mehta', initials: 'AM', color: 'bg-blue-600', empId: 'EMP-4821', department: 'Administration', role: 'System Admin', status: 'Active', lastLogin: 'Just now' },
  { id: 's2', name: 'Harshith Kumar', initials: 'HK', color: 'bg-violet-600', empId: 'EMP-0042', department: 'Management', role: 'Branch Manager', status: 'Active', lastLogin: '1 hour ago' },
  { id: 's3', name: 'Rohit Pal', initials: 'RP', color: 'bg-indigo-600', empId: 'EMP-1201', department: 'IT Security', role: 'Team Leader', status: 'Active', lastLogin: '3 hours ago' },
  { id: 's4', name: 'Aisha Mehta', initials: 'AM', color: 'bg-[#030213]', empId: 'EMP-1042', department: 'Compliance', role: 'Team Leader', status: 'Active', lastLogin: '2 hours ago' },
  { id: 's5', name: 'Priya Sharma', initials: 'PS', color: 'bg-rose-500', empId: 'EMP-9402', department: 'Compliance', role: 'Employee', status: 'Active', lastLogin: '5 hours ago' },
  { id: 's6', name: 'Karan Singh', initials: 'KS', color: 'bg-emerald-600', empId: 'EMP-3301', department: 'Audit', role: 'Employee', status: 'On Leave', lastLogin: '3 days ago' },
  { id: 's7', name: 'Neha Joshi', initials: 'NJ', color: 'bg-teal-600', empId: 'EMP-2204', department: 'Retail Banking', role: 'Employee', status: 'Active', lastLogin: '1 day ago' },
  { id: 's8', name: 'Vikram Nair', initials: 'VN', color: 'bg-amber-500', empId: 'EMP-8801', department: 'Risk Management', role: 'Employee', status: 'Inactive', lastLogin: '7 days ago' },
];

const BRANCHES: Branch[] = [
  { code: 'MUM-01', name: 'Fort Branch', city: 'Mumbai', head: 'Harshith Kumar', headInitials: 'HK', headColor: 'bg-violet-600', employees: 61, teams: 9, compliance: 96 },
  { code: 'BLR-01', name: 'MG Road Branch', city: 'Bengaluru', head: 'Priya Sharma', headInitials: 'PS', headColor: 'bg-rose-500', employees: 42, teams: 6, compliance: 91 },
  { code: 'DEL-01', name: 'Connaught Place Branch', city: 'Delhi', head: 'Vikram Nair', headInitials: 'VN', headColor: 'bg-emerald-600', employees: 38, teams: 5, compliance: 88 },
  { code: 'CHE-01', name: 'T. Nagar Branch', city: 'Chennai', head: 'Aisha Mehta', headInitials: 'AM', headColor: 'bg-[#030213]', employees: 29, teams: 4, compliance: 85 },
  { code: 'KOL-01', name: 'Park Street Branch', city: 'Kolkata', head: 'Rohit Pal', headInitials: 'RP', headColor: 'bg-indigo-600', employees: 33, teams: 4, compliance: 79 },
];

const TRANSFER_REQUESTS: TransferRequest[] = [
  {
    id: 'TFR-201',
    name: 'Rohit Desai',
    initials: 'RD',
    color: 'bg-sky-600',
    empId: 'EMP-3312',
    from: 'Mumbai — Fort',
    to: 'Delhi — CP',
    reason: 'Personal Relocation',
    requestedAt: '1 hour ago',
    status: 'Pending',
  },
  {
    id: 'TFR-202',
    name: 'Meera Joshi',
    initials: 'MJ',
    color: 'bg-fuchsia-600',
    empId: 'EMP-4401',
    from: 'Mumbai — Fort',
    to: 'Bengaluru — MG Road',
    reason: 'Career Growth',
    requestedAt: '3 hours ago',
    status: 'Approved',
  },
  {
    id: 'TFR-203',
    name: 'Karan Bhat',
    initials: 'KB',
    color: 'bg-amber-600',
    empId: 'EMP-5102',
    from: 'Mumbai — Fort',
    to: 'Chennai — T. Nagar',
    reason: 'Family Emergency',
    requestedAt: '2 days ago',
    status: 'Pending',
  },
];

const TEAM_OVERVIEW: TeamOverview[] = [
  { id: 't1', name: 'IT Security', initials: 'IS', color: 'bg-[#030213]', lead: 'Rohit Pal', members: 12, pending: 4, done: 86, compliance: 94, status: 'On Track' },
  { id: 't2', name: 'Compliance Core', initials: 'CC', color: 'bg-emerald-600', lead: 'Aisha Mehta', members: 8, pending: 14, done: 62, compliance: 81, status: 'Needs Review' },
  { id: 't3', name: 'Legal', initials: 'LE', color: 'bg-violet-600', lead: 'Sanya Gupta', members: 5, pending: 2, done: 45, compliance: 98, status: 'On Track' },
  { id: 't4', name: 'Risk Management', initials: 'RM', color: 'bg-rose-500', lead: 'Rahul Desai', members: 14, pending: 20, done: 29, compliance: 65, status: 'Critical' },
  { id: 't5', name: 'Retail Banking', initials: 'RB', color: 'bg-amber-500', lead: 'Vikram Nair', members: 22, pending: 0, done: 110, compliance: 91, status: 'On Track' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const StatusPill = ({ status }: { status: StaffMember['status'] }) => {
  const cfg = {
    Active: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    Inactive: 'bg-gray-100 text-gray-500 border-gray-200',
    'On Leave': 'bg-amber-50 text-amber-700 border-amber-200',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${cfg[status]}`}>
      {status}
    </span>
  );
};

const RoleBadge = ({ role }: { role: StaffMember['role'] }) => {
  const cfg = {
    'System Admin': 'bg-purple-50 text-purple-700 border-purple-100',
    'Branch Manager': 'bg-blue-50 text-blue-700 border-blue-100',
    'Team Leader': 'bg-amber-50 text-amber-700 border-amber-100',
    Employee: 'bg-gray-50 text-gray-600 border-gray-200',
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${cfg[role]}`}>
      {role}
    </span>
  );
};

const ComplianceBar = ({ value }: { value: number }) => {
  const color = value >= 90 ? 'bg-emerald-500' : value >= 75 ? 'bg-amber-500' : 'bg-rose-500';
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className={`text-sm font-bold ${value >= 90 ? 'text-emerald-700' : value >= 75 ? 'text-amber-700' : 'text-rose-700'}`}>
        {value}%
      </span>
    </div>
  );
};

const TeamStatusBadge = ({ status }: { status: TeamOverview['status'] }) => {
  const cfg = {
    'On Track': 'bg-emerald-50 text-emerald-700 border-emerald-100',
    'Needs Review': 'bg-amber-50 text-amber-700 border-amber-100',
    Critical: 'bg-rose-50 text-rose-700 border-rose-100',
  };
  return (
    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider ${cfg[status]}`}>
      {status}
    </span>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────

export default function EmployeeApproval() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('approvals');
  const [requests, setRequests] = useState<AccessRequest[]>(ACCESS_REQUESTS);
  const [transfers, setTransfers] = useState<TransferRequest[]>(TRANSFER_REQUESTS);
  const [search, setSearch] = useState('');

  const pendingApprovals = requests.filter((r) => r.status === 'Pending').length;
  const pendingTransfers = transfers.filter((t) => t.status === 'Pending').length;

  const handleApproval = (id: string, action: 'Approved' | 'Rejected' | 'Pending') => {
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: action } : r)));
  };

  const handleTransfer = (id: string, action: 'Approved' | 'Rejected' | 'Pending') => {
    setTransfers((prev) => prev.map((t) => (t.id === id ? { ...t, status: action } : t)));
  };

  const TABS = [
    { id: 'approvals' as ActiveTab, label: 'Employee Approvals', badge: pendingApprovals },
    { id: 'users' as ActiveTab, label: 'User Management', badge: 0 },
    { id: 'branches' as ActiveTab, label: 'Branch Management', badge: 0 },
    { id: 'transfers' as ActiveTab, label: 'Branch Transfers', badge: pendingTransfers },
    { id: 'teams' as ActiveTab, label: 'Team Oversight', badge: 0 },
    { id: 'compliance' as ActiveTab, label: 'Compliance Monitoring', badge: 0 },
  ];

  const filteredStaff = STAFF_MEMBERS.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.empId.toLowerCase().includes(search.toLowerCase()) ||
      s.department.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full w-full bg-white font-sans">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="px-8 pt-7 pb-0 border-b border-gray-100">
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-purple-600 flex items-center justify-center shadow-sm">
              <Shield size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Admin Control Panel</h1>
              <p className="text-gray-500 text-sm mt-0.5">Mumbai — Fort Branch · System Administration</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <ShieldCheck size={12} />
            System Admin Access
          </span>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4 mb-5">
          {[
            { label: 'Pending Approvals', value: pendingApprovals, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
            { label: 'Active Users', value: STAFF_MEMBERS.filter((s) => s.status === 'Active').length, icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
            { label: 'Branch Transfers', value: pendingTransfers, icon: ArrowLeftRight, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
            { label: 'Branch Network', value: BRANCHES.length, icon: Building2, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100' },
          ].map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.label} className={`${card.bg} border ${card.border} rounded-xl p-4 flex items-center gap-3`}>
                <div className={`w-9 h-9 rounded-lg bg-white/70 flex items-center justify-center ${card.color}`}>
                  <Icon size={18} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                  <p className="text-[11px] text-gray-500 font-medium">{card.label}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-semibold whitespace-nowrap border-b-2 transition-all ${
                activeTab === tab.id
                  ? 'border-[#030213] text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200'
              }`}
            >
              {tab.label}
              {tab.badge > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  activeTab === tab.id ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-8">

        {/* ── EMPLOYEE APPROVALS ──────────────────────────────────────── */}
        {activeTab === 'approvals' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">
                Pending Access Requests ({pendingApprovals})
              </h2>
            </div>
            {requests.map((req) => (
              <div
                key={req.id}
                className={`rounded-2xl border p-5 transition-all ${
                  req.status === 'Pending'
                    ? 'bg-white border-gray-200 shadow-sm hover:border-gray-300'
                    : 'bg-gray-50/50 border-gray-100 opacity-80'
                }`}
              >
                {/* Card Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full ${req.color} flex items-center justify-center text-white text-sm font-bold shrink-0`}>
                      {req.initials}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-gray-900">{req.name}</h3>
                        <span className="text-xs font-mono text-gray-400">{req.empId}</span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-gray-50 text-gray-600 border border-gray-200 uppercase">
                          ACCESS REQUEST
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5">{req.email}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">{req.requestedAt}</span>
                </div>

                {/* Metadata */}
                <div className="grid grid-cols-4 gap-3 bg-gray-50 rounded-xl p-3 mb-4 text-sm">
                  {[
                    { label: 'Department', value: req.department },
                    { label: 'Requested Role', value: req.role },
                    { label: 'Branch Code', value: req.branchCode },
                    { label: 'Branch', value: req.branch },
                  ].map((field) => (
                    <div key={field.label}>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">{field.label}</p>
                      <p className="font-semibold text-gray-800 text-xs">{field.value}</p>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                  {req.status === 'Pending' ? (
                    <>
                      <button
                        onClick={() => handleApproval(req.id, 'Rejected')}
                        className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition-all"
                      >
                        <X size={14} />
                        Reject Request
                      </button>
                      <button
                        onClick={() => handleApproval(req.id, 'Approved')}
                        className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-all"
                      >
                        <Check size={14} />
                        Approve Access
                      </button>
                    </>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${
                        req.status === 'Approved'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        {req.status === 'Approved' ? <CheckCircle size={12} /> : <X size={12} />}
                        {req.status === 'Approved' ? 'Access Granted' : 'Request Rejected'}
                      </span>
                      <button
                        onClick={() => handleApproval(req.id, 'Pending')}
                        className="text-xs text-gray-400 hover:text-gray-600 underline"
                      >
                        Undo
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── USER MANAGEMENT ─────────────────────────────────────────── */}
        {activeTab === 'users' && (
          <div className="space-y-5">
            <div className="p-5 bg-purple-50 border border-purple-100 rounded-2xl flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900 mb-0.5">Role & Designation Management</h3>
                <p className="text-sm text-gray-500">Manage employee roles, permissions, and access levels</p>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm font-bold rounded-xl hover:bg-purple-700 transition-colors">
                Open Role Manager
                <ArrowRight size={14} />
              </button>
            </div>

            {/* Search & Stats */}
            <div className="flex items-center justify-between">
              <div className="relative flex-1 max-w-sm">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, ID or department..."
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
                />
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Users size={15} />
                <span className="font-semibold text-gray-700">{filteredStaff.length} users</span>
                <span>— Mumbai — Fort Branch</span>
              </div>
            </div>

            {/* Table */}
            <div className="rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-5 py-3.5 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Employee</th>
                    <th className="px-5 py-3.5 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Department</th>
                    <th className="px-5 py-3.5 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Role</th>
                    <th className="px-5 py-3.5 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-5 py-3.5 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Last Login</th>
                    <th className="px-5 py-3.5 text-right text-[11px] font-bold text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredStaff.map((staff) => (
                    <tr key={staff.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full ${staff.color} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                            {staff.initials}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{staff.name}</p>
                            <p className="text-xs font-mono text-gray-400">{staff.empId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-gray-600">{staff.department}</td>
                      <td className="px-5 py-4">
                        <RoleBadge role={staff.role} />
                      </td>
                      <td className="px-5 py-4">
                        <StatusPill status={staff.status} />
                      </td>
                      <td className="px-5 py-4 text-gray-500">{staff.lastLogin}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600">
                            <Eye size={14} />
                          </button>
                          <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600">
                            <MoreHorizontal size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── BRANCH MANAGEMENT ───────────────────────────────────────── */}
        {activeTab === 'branches' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">
                Branch Network ({BRANCHES.length} Branches)
              </h2>
              <button className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-all">
                <UserPlus size={14} />
                Add Branch
              </button>
            </div>

            <div className="grid gap-4">
              {BRANCHES.map((branch) => (
                <div key={branch.code} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                        {branch.city.slice(0, 3).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-gray-900">{branch.city} — {branch.name}</h3>
                          <span className="text-xs font-mono text-gray-400 bg-gray-100 px-2 py-0.5 rounded">{branch.code}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className={`w-6 h-6 rounded-full ${branch.headColor} flex items-center justify-center text-white text-[9px] font-bold`}>
                            {branch.headInitials}
                          </div>
                          <p className="text-sm text-gray-500">
                            <span className="font-semibold text-gray-700">{branch.head}</span> · Branch Head
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-8">
                      <div className="text-center">
                        <p className="text-xl font-bold text-gray-900">{branch.employees}</p>
                        <p className="text-[11px] text-gray-400">Employees</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xl font-bold text-gray-900">{branch.teams}</p>
                        <p className="text-[11px] text-gray-400">Teams</p>
                      </div>
                      <div className="w-32">
                        <p className="text-[11px] text-gray-400 mb-1.5">Compliance</p>
                        <ComplianceBar value={branch.compliance} />
                      </div>
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400">
                        <ChevronDown size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── BRANCH TRANSFERS ─────────────────────────────────────────── */}
        {activeTab === 'transfers' && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">
              Transfer Requests ({transfers.length})
            </h2>
            {transfers.map((tfr) => (
              <div
                key={tfr.id}
                className={`rounded-2xl border p-5 transition-all ${
                  tfr.status === 'Pending'
                    ? 'bg-white border-gray-200 shadow-sm'
                    : 'bg-gray-50/50 border-gray-100 opacity-80'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full ${tfr.color} flex items-center justify-center text-white text-sm font-bold`}>
                      {tfr.initials}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-gray-900">{tfr.name}</h3>
                        <span className="text-xs font-mono text-gray-400">{tfr.empId}</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5">{tfr.reason}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">{tfr.requestedAt}</span>
                </div>

                {/* Transfer Path */}
                <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3.5 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-gray-200 flex items-center justify-center">
                      <Building2 size={12} className="text-gray-500" />
                    </div>
                    <span className="text-sm font-semibold text-gray-700">{tfr.from}</span>
                  </div>
                  <ArrowRight size={14} className="text-gray-400 shrink-0" />
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-blue-100 flex items-center justify-center">
                      <Building2 size={12} className="text-blue-600" />
                    </div>
                    <span className="text-sm font-bold text-blue-700">{tfr.to}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                  {tfr.status === 'Pending' ? (
                    <>
                      <button
                        onClick={() => handleTransfer(tfr.id, 'Rejected')}
                        className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition-all"
                      >
                        <X size={14} />
                        Reject
                      </button>
                      <button
                        onClick={() => handleTransfer(tfr.id, 'Approved')}
                        className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-all"
                      >
                        <Check size={14} />
                        Approve Transfer
                      </button>
                    </>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${
                        tfr.status === 'Approved'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        {tfr.status === 'Approved' ? <CheckCircle size={12} /> : <X size={12} />}
                        {tfr.status}
                      </span>
                      <button
                        onClick={() => handleTransfer(tfr.id, 'Pending')}
                        className="text-xs text-gray-400 hover:text-gray-600 underline"
                      >
                        Undo
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── TEAM OVERSIGHT ──────────────────────────────────────────── */}
        {activeTab === 'teams' && (
          <div className="space-y-5">
            {/* Stat Row */}
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: 'Total Teams', value: TEAM_OVERVIEW.length, color: 'text-blue-700', bg: 'bg-blue-50' },
                { label: 'On Track', value: TEAM_OVERVIEW.filter((t) => t.status === 'On Track').length, color: 'text-emerald-700', bg: 'bg-emerald-50' },
                { label: 'Need Review', value: TEAM_OVERVIEW.filter((t) => t.status === 'Needs Review').length, color: 'text-amber-700', bg: 'bg-amber-50' },
                { label: 'Avg Compliance', value: `${Math.round(TEAM_OVERVIEW.reduce((a, t) => a + t.compliance, 0) / TEAM_OVERVIEW.length)}%`, color: 'text-purple-700', bg: 'bg-purple-50' },
              ].map((s) => (
                <div key={s.label} className={`${s.bg} rounded-xl p-4 text-center`}>
                  <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-gray-500 font-medium mt-1">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Team List */}
            <div className="space-y-3">
              {TEAM_OVERVIEW.map((team) => (
                <div key={team.id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-11 h-11 rounded-xl ${team.color} flex items-center justify-center text-white text-xs font-bold`}>
                        {team.initials}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-gray-900">{team.name}</h3>
                          <TeamStatusBadge status={team.status} />
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">Lead: <span className="font-medium text-gray-700">{team.lead}</span></p>
                      </div>
                    </div>

                    <div className="flex items-center gap-8">
                      <div className="text-center">
                        <p className="text-lg font-bold text-gray-800">{team.members}</p>
                        <p className="text-[10px] text-gray-400">Members</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-amber-700">{team.pending}</p>
                        <p className="text-[10px] text-gray-400">Pending</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-emerald-700">{team.done}</p>
                        <p className="text-[10px] text-gray-400">Done</p>
                      </div>
                      <div className="w-36">
                        <ComplianceBar value={team.compliance} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── COMPLIANCE MONITORING ────────────────────────────────────── */}
        {activeTab === 'compliance' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-red-50 border border-red-100 rounded-2xl p-6">
                <p className="text-xs font-bold text-red-600 uppercase tracking-wider mb-2">AI Flags Raised</p>
                <p className="text-5xl font-bold text-red-700">24</p>
                <p className="text-sm text-red-500 mt-2">+3 since yesterday · Requires attention</p>
              </div>
              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6">
                <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-2">Overdue Deadlines</p>
                <p className="text-5xl font-bold text-amber-700">2</p>
                <p className="text-sm text-amber-600 mt-2">RBI reporting deadline exceeded by 1 day</p>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <h2 className="font-bold text-gray-900 flex items-center gap-2">
                  <TrendingUp size={16} className="text-blue-600" />
                  Real-Time Audit Trail
                </h2>
              </div>
              <ul className="divide-y divide-gray-50">
                {[
                  { action: 'KYC Document Flagged: Name Mismatch', user: 'AI Agent — AutoCheck', time: 'Just now', severity: 'high' },
                  { action: 'Branch Transfer Approved: RM2-007', user: 'Harshith Kumar', time: '12 mins ago', severity: 'info' },
                  { action: 'New Regulation Ingested: RBI Circular 2026/04', user: 'System', time: '1 hour ago', severity: 'low' },
                  { action: 'Suspicious Transaction Flagged: Acc #8890', user: 'AI Agent — TransactionMonitor', time: '2 hours ago', severity: 'high' },
                  { action: 'Employee Access Granted: EMP-5501', user: 'Arjun Mehta', time: '3 hours ago', severity: 'info' },
                ].map((log, i) => (
                  <li key={i} className="px-6 py-4 flex items-start gap-4 hover:bg-gray-50/50 transition-colors">
                    <div className={`mt-1.5 w-2.5 h-2.5 rounded-full shrink-0 ${
                      log.severity === 'high' ? 'bg-red-500' : log.severity === 'info' ? 'bg-blue-500' : 'bg-gray-300'
                    }`} />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm">{log.action}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                        <User size={11} />
                        <span>{log.user}</span>
                        <span>·</span>
                        <span>{log.time}</span>
                      </div>
                    </div>
                    <button className="text-xs font-medium text-gray-400 hover:text-gray-700 transition-colors">
                      Details
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
