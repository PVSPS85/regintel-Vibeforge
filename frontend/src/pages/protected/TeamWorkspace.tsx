import {
  ArrowLeft,
  ArrowLeftRight,
  Calendar,
  CheckCircle,
  ChevronDown,
  Clock,
  Download,
  Eye,
  FileText,
  MessageSquare,
  Plus,
  Send,
  Shield,
  ShieldCheck,
  TrendingUp,
  Upload,
  Users,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useAuth } from '../../contexts/AuthContext';

// ─── Types ─────────────────────────────────────────────────────────────────────

type Tab = 'tasks' | 'documents' | 'discussion' | 'regulations';

interface TeamTask {
  id: string;
  title: string;
  priority: 'High' | 'Medium' | 'Low';
  dueDate: string;
  status: 'Pending' | 'In Progress' | 'Completed';
  assignee: string;
}

interface DocItem {
  id: string;
  title: string;
  type: 'AI' | 'Upload';
  date: string;
  size: string;
  category: string;
}

interface Message {
  id: string;
  author: string;
  initials: string;
  color: string;
  text: string;
  time: string;
  isMe?: boolean;
}

interface RegItem {
  id: string;
  title: string;
  priority: 'High' | 'Medium' | 'Low';
  deadline: string;
  status: 'Pending' | 'Done';
}

// ─── Mock Data ─────────────────────────────────────────────────────────────────

const TEAMS_DATA: Record<string, {
  id: string;
  name: string;
  initials: string;
  color: string;
  location: string;
  complianceRating: number;
  members: { name: string; role: string; avatar: string; avatarColor: string; online: boolean }[];
  tasks: TeamTask[];
  docs: DocItem[];
  messages: Message[];
  regulations: RegItem[];
}> = {
  'it-security': {
    id: 'it-security',
    name: 'IT Security',
    initials: 'IS',
    color: 'bg-[#030213]',
    location: 'Bengaluru',
    complianceRating: 94,
    members: [
      { name: 'Rohit Pal', role: 'IT Security Analyst (Lead)', avatar: 'RP', avatarColor: 'bg-indigo-600', online: true },
      { name: 'Aisha Mehta', role: 'Compliance Officer', avatar: 'AM', avatarColor: 'bg-[#030213]', online: true },
      { name: 'Karan Singh', role: 'Auditor', avatar: 'KS', avatarColor: 'bg-violet-600', online: false },
      { name: 'Priya Sharma', role: 'Compliance Associate', avatar: 'PS', avatarColor: 'bg-rose-500', online: true },
    ],
    tasks: [
      { id: 'TSK-101', title: 'Implement 2FA on all internal portals', priority: 'High', dueDate: 'Today', status: 'In Progress', assignee: 'Rohit Pal' },
      { id: 'TSK-102', title: 'Conduct vulnerability scan on legacy systems', priority: 'High', dueDate: 'Tomorrow', status: 'Pending', assignee: 'Karan Singh' },
      { id: 'TSK-103', title: 'Review firewall policy update — Q2 Audit', priority: 'Medium', dueDate: '02 Jul 2026', status: 'In Progress', assignee: 'Aisha Mehta' },
      { id: 'TSK-104', title: 'Update employee phishing simulation report', priority: 'Low', dueDate: '15 Jul 2026', status: 'Pending', assignee: 'Priya Sharma' },
      { id: 'TSK-105', title: 'Patch critical CVE on branch servers', priority: 'High', dueDate: '25 Jun 2026', status: 'Completed', assignee: 'Rohit Pal' },
    ],
    docs: [
      { id: 'D1', title: 'Firewall Policy v2.0', type: 'Upload', date: 'Today', size: '2.4 MB', category: 'IT Security' },
      { id: 'D2', title: 'AI Summary: RBI Cyber Security Circular 2026', type: 'AI', date: 'Yesterday', size: '0.8 MB', category: 'Regulation' },
      { id: 'D3', title: '2FA Implementation Guide', type: 'Upload', date: '20 Jun 2026', size: '1.2 MB', category: 'Policy' },
      { id: 'D4', title: 'Vulnerability Assessment Report Q2', type: 'AI', date: '18 Jun 2026', size: '3.1 MB', category: 'Audit' },
    ],
    messages: [
      { id: 'm1', author: 'Rohit Pal', initials: 'RP', color: 'bg-indigo-600', text: '2FA rollout plan has been shared on the drive. Please review.', time: '10:30 AM' },
      { id: 'm2', author: 'Aisha Mehta', initials: 'AM', color: 'bg-[#030213]', text: 'Reviewed. The internal portal should go first as per compliance priority.', time: '10:45 AM' },
      { id: 'm3', author: 'Karan Singh', initials: 'KS', color: 'bg-violet-600', text: "Agreed. I'll start the legacy system scan today.", time: '11:00 AM' },
      { id: 'm4', author: 'Rohit Pal', initials: 'RP', color: 'bg-indigo-600', text: 'Great — target completion by Wednesday. Flag any blockers.', time: '11:05 AM' },
    ],
    regulations: [
      { id: 'R1', title: 'Implement MFA across all internal portals per RBI Cyber Circular 2026/04', priority: 'High', deadline: '30 Jun 2026', status: 'Pending' },
      { id: 'R2', title: 'Review employee data access policies per DPDPA compliance', priority: 'Medium', deadline: '15 Jul 2026', status: 'Pending' },
      { id: 'R3', title: 'Submit cyber incident response plan to RBI', priority: 'High', deadline: '20 Jun 2026', status: 'Done' },
    ],
  },
  'compliance-core': {
    id: 'compliance-core',
    name: 'Compliance Core',
    initials: 'CC',
    color: 'bg-emerald-600',
    location: 'Bengaluru',
    complianceRating: 81,
    members: [
      { name: 'Aisha Mehta', role: 'Compliance Officer (Lead)', avatar: 'AM', avatarColor: 'bg-[#030213]', online: true },
      { name: 'Vikram Nair', role: 'Relationship Manager', avatar: 'VN', avatarColor: 'bg-emerald-600', online: true },
      { name: 'Priya Sharma', role: 'Compliance Associate', avatar: 'PS', avatarColor: 'bg-rose-500', online: false },
    ],
    tasks: [
      { id: 'TSK-201', title: 'Update KYC procedures for digital onboarding', priority: 'High', dueDate: '28 Jun 2026', status: 'In Progress', assignee: 'Aisha Mehta' },
      { id: 'TSK-202', title: 'Conduct AML training for new staff', priority: 'Medium', dueDate: '10 Jul 2026', status: 'Pending', assignee: 'Priya Sharma' },
      { id: 'TSK-203', title: 'File monthly compliance report to HQ', priority: 'High', dueDate: '30 Jun 2026', status: 'Pending', assignee: 'Vikram Nair' },
    ],
    docs: [
      { id: 'D1', title: 'KYC Policy Update FY26', type: 'Upload', date: 'Yesterday', size: '1.8 MB', category: 'Policy' },
      { id: 'D2', title: 'AI Summary: AML Regulation Changes', type: 'AI', date: '22 Jun 2026', size: '0.6 MB', category: 'Regulation' },
    ],
    messages: [
      { id: 'm1', author: 'Aisha Mehta', initials: 'AM', color: 'bg-[#030213]', text: 'KYC digital onboarding procedures have been updated. Team please review.', time: '9:00 AM' },
      { id: 'm2', author: 'Vikram Nair', initials: 'VN', color: 'bg-emerald-600', text: 'Will review and share feedback by EOD.', time: '9:30 AM' },
    ],
    regulations: [
      { id: 'R1', title: 'Update KYC forms per RBI V-CIP circular', priority: 'High', deadline: '28 Jun 2026', status: 'Pending' },
      { id: 'R2', title: 'Train staff on AML updates FY26', priority: 'Medium', deadline: '15 Jul 2026', status: 'Pending' },
    ],
  },
  'fort-general': {
    id: 'fort-general',
    name: 'Fort Branch General',
    initials: 'FG',
    color: 'bg-amber-600',
    location: 'Mumbai',
    complianceRating: 88,
    members: [
      { name: 'Harshith Kumar', role: 'Branch Manager (Lead)', avatar: 'HK', avatarColor: 'bg-violet-600', online: true },
      { name: 'Neha Joshi', role: 'Teller', avatar: 'NJ', avatarColor: 'bg-teal-600', online: true },
      { name: 'Rahul Desai', role: 'Risk Operations Lead', avatar: 'RD', avatarColor: 'bg-sky-600', online: false },
    ],
    tasks: [
      { id: 'TSK-301', title: 'Employee Training: Phishing Awareness', priority: 'Low', dueDate: '15 Jul 2026', status: 'Pending', assignee: 'Neha Joshi' },
      { id: 'TSK-302', title: 'Clean Desk Policy Audit', priority: 'Medium', dueDate: '30 Jun 2026', status: 'Pending', assignee: 'Rahul Desai' },
      { id: 'TSK-303', title: 'Quarterly Safety Drills Certification', priority: 'Low', dueDate: '20 Jul 2026', status: 'Completed', assignee: 'Neha Joshi' },
    ],
    docs: [
      { id: 'D1', title: 'Branch Operations Manual v3', type: 'Upload', date: '15 Jun 2026', size: '4.2 MB', category: 'Policy' },
    ],
    messages: [
      { id: 'm1', author: 'Harshith Kumar', initials: 'HK', color: 'bg-violet-600', text: 'Monthly review scheduled for Friday. All heads please confirm attendance.', time: 'Yesterday' },
      { id: 'm2', author: 'Neha Joshi', initials: 'NJ', color: 'bg-teal-600', text: 'Confirmed.', time: 'Yesterday' },
    ],
    regulations: [
      { id: 'R1', title: 'Clean desk policy audit per internal compliance', priority: 'Medium', deadline: '30 Jun 2026', status: 'Pending' },
    ],
  },
};

// ─── Helper: Priority colors ──────────────────────────────────────────────────

const priorityBg = (p: 'High' | 'Medium' | 'Low') =>
  ({ High: 'bg-red-50 text-red-700 ring-red-100', Medium: 'bg-amber-50 text-amber-700 ring-amber-100', Low: 'bg-emerald-50 text-emerald-700 ring-emerald-100' })[p];

const statusBg = (s: 'Pending' | 'In Progress' | 'Completed') =>
  ({ Pending: 'bg-gray-100 text-gray-500 border-gray-200', 'In Progress': 'bg-blue-50 text-blue-700 border-blue-100', Completed: 'bg-emerald-50 text-emerald-700 border-emerald-100' })[s];

// ─── Main Component ────────────────────────────────────────────────────────────

export default function TeamWorkspace() {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const activeTeamId = teamId && TEAMS_DATA[teamId] ? teamId : 'it-security';
  const team = TEAMS_DATA[activeTeamId];

  const [activeTab, setActiveTab] = useState<Tab>('tasks');
  const [tasks, setTasks] = useState(team.tasks);
  const [messages, setMessages] = useState(team.messages);
  const [msgInput, setMsgInput] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, status: t.status === 'Completed' ? 'Pending' : 'Completed' }
          : t
      )
    );
  };

  const handleSendMessage = () => {
    const trimmed = msgInput.trim();
    if (!trimmed) return;
    setMessages((prev) => [
      ...prev,
      {
        id: `m${Date.now()}`,
        author: 'You',
        initials: 'AM',
        color: 'bg-blue-600',
        text: trimmed,
        time: 'Just now',
        isMe: true,
      },
    ]);
    setMsgInput('');
  };

  const TABS: { id: Tab; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'tasks',       label: 'Tasks',       icon: <Zap size={14} />,         count: tasks.filter((t) => t.status !== 'Completed').length },
    { id: 'documents',   label: 'Documents',   icon: <FileText size={14} />,     count: team.docs.length },
    { id: 'discussion',  label: 'Discussion',  icon: <MessageSquare size={14} />, count: messages.length },
    { id: 'regulations', label: 'Regulations', icon: <Shield size={14} />,       count: team.regulations.length },
  ];

  return (
    <div className="flex flex-col h-full w-full bg-white font-sans">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="px-8 pt-7 pb-0 border-b border-gray-100">
        {/* Back + Team Selector */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/teams')}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 font-semibold transition-colors"
            >
              <ArrowLeft size={15} />
              Back to Teams
            </button>
            <div className="w-px h-5 bg-gray-200" />

            {/* Team Switcher */}
            <div className="relative">
              <button
                onClick={() => setDropdownOpen((v) => !v)}
                className="flex items-center gap-2 text-xl font-bold text-gray-900 hover:text-blue-700 transition-colors"
              >
                <div className={`w-8 h-8 rounded-lg ${team.color} flex items-center justify-center text-white text-xs font-bold`}>
                  {team.initials}
                </div>
                {team.name}
                <ChevronDown size={16} className="text-gray-400 mt-0.5" />
              </button>
              {dropdownOpen && (
                <div className="absolute left-0 mt-2 w-56 bg-white rounded-xl border border-gray-200 shadow-xl z-20 py-1.5 overflow-hidden">
                  {Object.values(TEAMS_DATA).map((t) => (
                    <button
                      key={t.id}
                      onClick={() => { navigate(`/teams/${t.id}/workspace`); setDropdownOpen(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-left hover:bg-gray-50 transition-colors ${
                        activeTeamId === t.id ? 'text-blue-700 bg-blue-50/50' : 'text-gray-700'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-md ${t.color} flex items-center justify-center text-white text-[9px] font-bold`}>
                        {t.initials}
                      </div>
                      {t.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right info chips */}
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 text-gray-600 text-xs font-bold">
              <Users size={12} />
              {team.members.length} Members
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100">
              <ShieldCheck size={12} />
              Active Workspace
            </span>
            {isAdmin && (
              <button onClick={() => alert('Route connected: Action')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-gray-200 text-gray-600 text-xs font-bold hover:bg-gray-50 transition-colors cursor-pointer">
                <ArrowLeftRight size={12} />
                Transfer Leadership
              </button>
            )}
          </div>
        </div>

        {/* Compliance bar */}
        <div className="mb-4 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wider text-gray-500 uppercase flex items-center gap-1.5">
              <TrendingUp size={12} />
              Team Compliance Score
            </span>
            <span className="text-2xl font-bold tracking-tight text-gray-900">{team.complianceRating}%</span>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                team.complianceRating >= 90 ? 'bg-emerald-500' : team.complianceRating >= 75 ? 'bg-blue-500' : 'bg-amber-500'
              }`}
              style={{ width: `${team.complianceRating}%` }}
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-[13px] font-semibold border-b-2 transition-all ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200'
              }`}
            >
              <span className={activeTab === tab.id ? 'text-blue-600' : 'text-gray-400'}>{tab.icon}</span>
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  activeTab === tab.id ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab Content ────────────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden flex">

        {/* ── TASKS TAB ─────────────────────────────────────────── */}
        {activeTab === 'tasks' && (
          <div className="flex flex-1 gap-6 p-8 overflow-y-auto">
            {/* Left: Team Members */}
            <div className="w-72 shrink-0 space-y-3">
              <h3 className="text-xs font-semibold tracking-wider text-gray-500 uppercase">Team Members ({team.members.length})</h3>
              <div className="bg-white/80 backdrop-blur-lg border border-white/50 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] divide-y divide-gray-100">
                {team.members.map((m) => (
                  <div key={m.name} className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className={`w-9 h-9 rounded-full ${m.avatarColor} text-white flex items-center justify-center font-bold text-sm`}>
                          {m.avatar}
                        </div>
                        <span className={`absolute bottom-0.5 right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${m.online ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{m.name}</p>
                        <p className="text-xs text-gray-500">{m.role}</p>
                      </div>
                    </div>
                    <button onClick={() => alert('Route connected: Action')}  className="p-1.5 rounded-lg border border-gray-100 hover:bg-gray-50 text-gray-400 transition-colors">
                      <MessageSquare size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Task List */}
            <div className="flex-1 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold tracking-wider text-gray-500 uppercase">
                  Action Points · {tasks.filter((t) => t.status === 'Completed').length}/{tasks.length} Done
                </h3>
                {isAdmin && (
                  <button onClick={() => alert('Route connected: Action')} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors cursor-pointer">
                    <Plus size={12} />
                    Add Task
                  </button>
                )}
              </div>

              <div className="space-y-2.5">
                {tasks.map((t) => {
                  const done = t.status === 'Completed';
                  return (
                    <div
                      key={t.id}
                      className={`p-4 rounded-xl transition-all flex items-start gap-3 ${
                        done ? 'bg-gray-50/50 border border-gray-200/50 opacity-70' : 'bg-white/80 backdrop-blur-lg border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(79,70,229,0.1)] hover:border-indigo-500/20'
                      }`}
                    >
                      {/* Checkbox */}
                      <button
                        onClick={() => toggleTask(t.id)}
                        className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                          done ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300 hover:border-emerald-400'
                        }`}
                      >
                        {done && <CheckCircle size={12} className="text-white stroke-[3]" />}
                      </button>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-[10px] font-mono text-gray-400">{t.id}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ring-1 ring-inset ${priorityBg(t.priority)}`}>{t.priority}</span>
                        </div>
                        <p className={`text-sm font-semibold ${done ? 'text-gray-400 line-through' : 'text-gray-900'}`}>{t.title}</p>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                          <span className="flex items-center gap-1"><Calendar size={11} />{t.dueDate}</span>
                          <span>·</span>
                          <span>{t.assignee}</span>
                        </div>
                      </div>

                      {/* Status */}
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full border shrink-0 ${statusBg(t.status)}`}>
                        {t.status === 'In Progress' && <Clock size={9} className="inline mr-1" />}
                        {t.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── DOCUMENTS TAB ─────────────────────────────────────── */}
        {activeTab === 'documents' && (
          <div className="flex-1 p-8 space-y-5 overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold tracking-wider text-gray-500 uppercase">Team Documents ({team.docs.length})</h3>
              {isAdmin && (
                <button onClick={() => alert('Route connected: Action')} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors cursor-pointer">
                  <Upload size={12} />
                  Upload Document
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {team.docs.map((doc) => (
                <div key={doc.id} className="bg-white/80 backdrop-blur-lg border border-white/50 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-5 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(79,70,229,0.1)] hover:border-indigo-500/20">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      doc.type === 'AI' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'
                    }`}>
                      <FileText size={19} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                          doc.type === 'AI' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'
                        }`}>
                          {doc.type === 'AI' ? '✦ AI Generated' : 'Uploaded'}
                        </span>
                        <span className="text-[10px] text-gray-400 font-medium">{doc.category}</span>
                      </div>
                      <h4 className="text-sm font-bold text-gray-900 leading-snug">{doc.title}</h4>
                      <p className="text-xs text-gray-400 mt-1">{doc.date} · {doc.size}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-4">
                    <button onClick={() => alert('Route connected: Action')}  className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <Eye size={12} />
                      View
                    </button>
                    <button onClick={() => alert('Route connected: Action')}  className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <Download size={12} />
                      Download
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── DISCUSSION TAB ────────────────────────────────────── */}
        {activeTab === 'discussion' && (
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Messages area */}
            <div className="flex-1 overflow-y-auto p-8 space-y-4 bg-gray-50/30">
              {messages.map((msg) => {
                const isMe = msg.isMe;
                return (
                  <div key={msg.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-9 h-9 rounded-full ${msg.color} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                      {msg.initials}
                    </div>
                    <div className={`flex flex-col gap-1 max-w-[65%] ${isMe ? 'items-end' : ''}`}>
                      <span className="text-xs font-semibold text-gray-500 px-1">{isMe ? 'You' : msg.author}</span>
                      <div className={`px-4 py-2.5 text-sm leading-relaxed rounded-2xl shadow-sm ${
                        isMe
                          ? 'bg-blue-600 text-white rounded-tr-sm'
                          : 'bg-white text-gray-900 border border-gray-100 rounded-tl-sm'
                      }`}>
                        {msg.text}
                      </div>
                      <span className="text-[11px] text-gray-400 px-1">{msg.time}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Input */}
            <div className="border-t border-gray-100 px-8 py-4 bg-white shrink-0">
              <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-full px-4 py-2 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                <input
                  type="text"
                  value={msgInput}
                  onChange={(e) => setMsgInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Send a message to the team..."
                  className="flex-1 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 outline-none"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!msgInput.trim()}
                  className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white disabled:opacity-40 hover:bg-blue-700 transition-colors"
                >
                  <Send size={14} className="ml-0.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── REGULATIONS TAB ───────────────────────────────────── */}
        {activeTab === 'regulations' && (
          <div className="flex-1 p-8 space-y-5 overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold tracking-wider text-gray-500 uppercase">
                Regulation Action Points for {team.name}
              </h3>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                team.regulations.some((r) => r.status === 'Pending' && r.priority === 'High')
                  ? 'bg-red-50 text-red-700 border border-red-100'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
              }`}>
                {team.regulations.filter((r) => r.status === 'Done').length}/{team.regulations.length} Completed
              </span>
            </div>

            <div className="space-y-3">
              {team.regulations.map((reg) => (
                <div
                  key={reg.id}
                  className={`p-5 rounded-2xl transition-all ${
                    reg.status === 'Done'
                      ? 'bg-emerald-50/30 ring-1 ring-emerald-600/20'
                      : 'bg-white/80 backdrop-blur-lg border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(79,70,229,0.1)] hover:border-indigo-500/20'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${
                        reg.priority === 'High' ? 'bg-red-500' : reg.priority === 'Medium' ? 'bg-amber-500' : 'bg-gray-300'
                      }`} />
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ring-1 ring-inset ${priorityBg(reg.priority)}`}>
                            {reg.priority}
                          </span>
                          {reg.status === 'Done' && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                              ✓ Completed
                            </span>
                          )}
                        </div>
                        <p className={`text-sm font-semibold ${reg.status === 'Done' ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                          {reg.title}
                        </p>
                        <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                          <Clock size={11} />
                          Deadline: {reg.deadline}
                        </p>
                      </div>
                    </div>
                    {reg.status === 'Pending' && isAdmin && (
                      <button onClick={() => alert('Route connected: Action')} className="text-xs font-bold text-blue-600 hover:text-blue-700 border border-blue-200 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors shrink-0 cursor-pointer">
                        Mark Done
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Info card */}
            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-100 rounded-xl">
              <Shield size={16} className="text-amber-600 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-700 leading-relaxed">
                These action points were auto-generated by the AI when regulations were distributed from the{' '}
                <span className="font-bold">Regulations</span> page. New items appear here automatically when a manager uploads a new circular.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
