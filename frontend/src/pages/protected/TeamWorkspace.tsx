import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  ChevronDown,
  Clock,
  FileText,
  Loader2,
  MessageSquare,
  Plus,
  Send,
  Shield,
  ShieldCheck,
  TrendingUp,
  Users,
  X,
  Zap,
} from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';

type Tab = 'tasks' | 'documents' | 'discussion' | 'regulations';

interface TeamInfo {
  id: string;
  name: string;
  branch_id: string;
  leader_id?: string;
  leader_name?: string;
  compliance_score?: number;
}

interface MemberInfo {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface TaskInfo {
  id: string;
  title: string;
  priority: string;
  due_date?: string;
  status: string;
  assigned_to_user?: string;
}

const PALETTES = [
  { color: 'bg-indigo-600' },
  { color: 'bg-[#030213]' },
  { color: 'bg-emerald-600' },
  { color: 'bg-violet-600' },
  { color: 'bg-rose-500' },
  { color: 'bg-amber-600' },
];

const getInitials = (name?: string) => {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
};

const priorityBg = (p: string = 'Medium') => {
  const prio = p.toLowerCase();
  if (prio === 'high') return 'bg-red-50 text-red-700 ring-red-100';
  if (prio === 'low') return 'bg-emerald-50 text-emerald-700 ring-emerald-100';
  return 'bg-amber-50 text-amber-700 ring-amber-100';
};

const statusBg = (s: string = 'Pending') => {
  const st = s.toLowerCase();
  if (st === 'completed') return 'bg-emerald-50 text-emerald-700 border-emerald-100';
  if (st === 'in progress') return 'bg-blue-50 text-blue-700 border-blue-100';
  return 'bg-gray-100 text-gray-500 border-gray-200';
};

const AddMemberModal = ({ onClose, teamId, currentMembers, allUsers, onMemberAdded }: any) => {
  const [selectedUserId, setSelectedUserId] = useState('');
  const [loading, setLoading] = useState(false);

  const availableUsers = allUsers.filter((u: any) => !currentMembers.some((m: any) => m.id === u.id));

  const handleSubmit = async () => {
    if (!selectedUserId) return;
    setLoading(true);
    try {
      await api.post(`/teams/${teamId}/members`, { user_id: selectedUserId });
      alert("Member assigned to team successfully!");
      onMemberAdded();
      onClose();
    } catch (err: any) {
      console.error("Assign member error:", err);
      alert(err.response?.data?.detail || "Failed to assign member to team.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 animate-in fade-in zoom-in-95 duration-200 p-6">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
          <h3 className="text-lg font-bold text-gray-900">Add Team Member</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer"><X size={18} /></button>
        </div>
        <div className="space-y-4">
          <label className="block text-xs font-bold uppercase text-gray-600">Select Employee</label>
          {availableUsers.length === 0 ? (
            <p className="text-sm text-gray-500 italic py-2 text-center">All active branch employees are already assigned to this team.</p>
          ) : (
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-900 outline-none focus:border-blue-500"
            >
              <option value="">Select an employee...</option>
              {availableUsers.map((u: any) => (
                <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
              ))}
            </select>
          )}
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 cursor-pointer">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={loading || !selectedUserId}
            className="px-4 py-2 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            Assign Member
          </button>
        </div>
      </div>
    </div>
  );
};

export default function TeamWorkspace() {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  const [allTeams, setAllTeams] = useState<TeamInfo[]>([]);
  const [currentTeam, setCurrentTeam] = useState<TeamInfo | null>(null);
  const [members, setMembers] = useState<MemberInfo[]>([]);
  const [allUsers, setAllUsers] = useState<MemberInfo[]>([]);
  const [tasks, setTasks] = useState<TaskInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('tasks');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);

  // Discussion state (UI only per prompt rules)
  const [messages, setMessages] = useState([
    { id: 'm1', author: 'System Bot', initials: 'SB', color: 'bg-purple-600', text: 'Welcome to the real-time compliance workspace.', time: 'Today', isMe: false }
  ]);
  const [msgInput, setMsgInput] = useState('');

  const fetchWorkspaceData = async () => {
    if (!teamId) return;
    try {
      setLoading(true);
      const [teamsRes, membersRes, tasksRes, usersRes] = await Promise.all([
        api.get<TeamInfo[]>('/teams/'),
        api.get<MemberInfo[]>(`/teams/${teamId}/members`).catch(() => ({ data: [] })),
        api.get<TaskInfo[]>(`/tasks/?assigned_to_team=${teamId}`).catch(() => ({ data: [] })),
        api.get<MemberInfo[]>('/users/').catch(() => ({ data: [] }))
      ]);

      const teamsList = teamsRes.data || [];
      setAllTeams(teamsList);
      const found = teamsList.find((t) => t.id === teamId) || teamsList[0] || null;
      setCurrentTeam(found);
      setMembers(membersRes.data || []);
      setTasks(tasksRes.data || []);
      setAllUsers(usersRes.data || []);
    } catch (err) {
      console.error("Workspace load failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaceData();
  }, [teamId]);

  const toggleTaskStatus = async (tsk: TaskInfo) => {
    const nextStatus = tsk.status === 'Completed' ? 'Pending' : 'Completed';
    try {
      await api.patch(`/tasks/${tsk.id}`, { status: nextStatus });
      setTasks((prev) => prev.map((t) => (t.id === tsk.id ? { ...t, status: nextStatus } : t)));
    } catch (err) {
      console.error("Failed updating task:", err);
      alert("Could not update task status.");
    }
  };

  const handleSendMessage = () => {
    const trimmed = msgInput.trim();
    if (!trimmed) return;
    setMessages((prev) => [
      ...prev,
      {
        id: `m${Date.now()}`,
        author: 'You',
        initials: getInitials(user?.name),
        color: 'bg-blue-600',
        text: trimmed,
        time: 'Just now',
        isMe: true,
      },
    ]);
    setMsgInput('');
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white p-12 text-gray-400 gap-3">
        <Loader2 size={24} className="animate-spin text-blue-600" />
        <span className="text-sm font-medium">Loading workspace...</span>
      </div>
    );
  }

  if (!currentTeam) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-white p-12 text-center">
        <h2 className="text-lg font-bold text-gray-800 mb-2">Team Workspace Not Found</h2>
        <p className="text-sm text-gray-500 mb-4">The team you are trying to view does not exist or you lack permission.</p>
        <button onClick={() => navigate('/teams')} className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg text-sm">Return to Teams</button>
      </div>
    );
  }

  const score = currentTeam.compliance_score ?? 100;

  const TABS: { id: Tab; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'tasks',       label: 'Tasks',       icon: <Zap size={14} />,         count: tasks.filter((t) => t.status !== 'Completed').length },
    { id: 'documents',   label: 'Documents',   icon: <FileText size={14} />,     count: 0 },
    { id: 'discussion',  label: 'Discussion',  icon: <MessageSquare size={14} />, count: messages.length },
    { id: 'regulations', label: 'Regulations', icon: <Shield size={14} />,       count: 0 },
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
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 font-semibold transition-colors cursor-pointer"
            >
              <ArrowLeft size={15} />
              Back to Teams
            </button>
            <div className="w-px h-5 bg-gray-200" />

            {/* Team Switcher */}
            <div className="relative">
              <button
                onClick={() => setDropdownOpen((v) => !v)}
                className="flex items-center gap-2 text-xl font-bold text-gray-900 hover:text-blue-700 transition-colors cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-[#030213] flex items-center justify-center text-white text-xs font-bold">
                  {getInitials(currentTeam.name)}
                </div>
                {currentTeam.name}
                <ChevronDown size={16} className="text-gray-400 mt-0.5" />
              </button>
              {dropdownOpen && (
                <div className="absolute left-0 mt-2 w-56 bg-white rounded-xl border border-gray-200 shadow-xl z-20 py-1.5 overflow-hidden">
                  {allTeams.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => { navigate(`/teams/${t.id}`); setDropdownOpen(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-left hover:bg-gray-50 transition-colors cursor-pointer ${
                        currentTeam.id === t.id ? 'text-blue-700 bg-blue-50/50' : 'text-gray-700'
                      }`}
                    >
                      <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center text-white text-[9px] font-bold">
                        {getInitials(t.name)}
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
              {members.length} Members
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100">
              <ShieldCheck size={12} />
              Active Workspace
            </span>
          </div>
        </div>

        {/* Compliance bar */}
        <div className="mb-4 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wider text-gray-500 uppercase flex items-center gap-1.5">
              <TrendingUp size={12} />
              Team Compliance Score
            </span>
            <span className="text-2xl font-bold tracking-tight text-gray-900">{score}%</span>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                score >= 90 ? 'bg-emerald-500' : score >= 75 ? 'bg-blue-500' : 'bg-amber-500'
              }`}
              style={{ width: `${score}%` }}
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-[13px] font-semibold border-b-2 transition-all cursor-pointer ${
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
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold tracking-wider text-gray-500 uppercase">Team Members ({members.length})</h3>
                {isAdmin && (
                  <button onClick={() => setIsAddMemberOpen(true)} className="flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-2 py-1 rounded cursor-pointer border border-blue-100">
                    <Plus size={12} /> Add Member
                  </button>
                )}
              </div>
              <div className="bg-white/80 backdrop-blur-lg border border-white/50 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] divide-y divide-gray-100">
                {members.length === 0 ? (
                  <p className="p-4 text-xs text-gray-400 text-center italic">No assigned members yet.</p>
                ) : (
                  members.map((m, idx) => {
                    const pal = PALETTES[idx % PALETTES.length];
                    return (
                      <div key={m.id} className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-9 h-9 rounded-full ${pal.color} text-white flex items-center justify-center font-bold text-sm shrink-0`}>
                            {getInitials(m.name)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-gray-900 truncate">{m.name}</p>
                            <p className="text-xs text-gray-500 truncate">{m.role}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right: Task List */}
            <div className="flex-1 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold tracking-wider text-gray-500 uppercase">
                  Action Points · {tasks.filter((t) => t.status === 'Completed').length}/{tasks.length} Done
                </h3>
              </div>

              {tasks.length === 0 ? (
                <div className="p-12 text-center bg-gray-50/50 rounded-2xl border border-gray-200">
                  <p className="text-sm text-gray-500 italic">No tasks currently assigned to this team.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {tasks.map((t) => {
                    const done = t.status === 'Completed';
                    return (
                      <div
                        key={t.id}
                        className={`p-4 rounded-xl transition-all flex items-start gap-3 ${
                          done ? 'bg-gray-50/50 border border-gray-200/50 opacity-70' : 'bg-white/80 backdrop-blur-lg border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)]'
                        }`}
                      >
                        {/* Checkbox */}
                        <button
                          onClick={() => toggleTaskStatus(t)}
                          className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                            done ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300 hover:border-emerald-400'
                          }`}
                        >
                          {done && <CheckCircle size={12} className="text-white stroke-[3]" />}
                        </button>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-[10px] font-mono text-gray-400">Task</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ring-1 ring-inset ${priorityBg(t.priority)}`}>{t.priority}</span>
                          </div>
                          <p className={`text-sm font-semibold ${done ? 'text-gray-400 line-through' : 'text-gray-900'}`}>{t.title}</p>
                          <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                            {t.due_date && <span className="flex items-center gap-1"><Calendar size={11} />Due: {t.due_date}</span>}
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
              )}
            </div>
          </div>
        )}

        {/* ── DOCUMENTS TAB ─────────────────────────────────────── */}
        {activeTab === 'documents' && (
          <div className="flex-1 p-8 space-y-5 overflow-y-auto">
            <h3 className="text-xs font-semibold tracking-wider text-gray-500 uppercase">Team Documents</h3>
            <div className="p-12 text-center bg-gray-50/50 rounded-2xl border border-gray-200">
              <p className="text-sm text-gray-500 italic">No team-specific documents uploaded yet.</p>
            </div>
          </div>
        )}

        {/* ── DISCUSSION TAB ────────────────────────────────────── */}
        {activeTab === 'discussion' && (
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-8 space-y-4 bg-gray-50/30">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-3 ${msg.isMe ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-9 h-9 rounded-full ${msg.color} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                    {msg.initials}
                  </div>
                  <div className={`flex flex-col gap-1 max-w-[65%] ${msg.isMe ? 'items-end' : ''}`}>
                    <span className="text-xs font-semibold text-gray-500 px-1">{msg.isMe ? 'You' : msg.author}</span>
                    <div className={`px-4 py-2.5 text-sm leading-relaxed rounded-2xl shadow-sm ${
                      msg.isMe
                        ? 'bg-blue-600 text-white rounded-tr-sm'
                        : 'bg-white text-gray-900 border border-gray-100 rounded-tl-sm'
                    }`}>
                      {msg.text}
                    </div>
                    <span className="text-[11px] text-gray-400 px-1">{msg.time}</span>
                  </div>
                </div>
              ))}
            </div>
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
                  className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white disabled:opacity-40 hover:bg-blue-700 transition-colors cursor-pointer"
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
            <h3 className="text-xs font-semibold tracking-wider text-gray-500 uppercase">Regulation Action Points</h3>
            <div className="p-12 text-center bg-gray-50/50 rounded-2xl border border-gray-200">
              <p className="text-sm text-gray-500 italic">No specific regulatory mandates mapped to this team.</p>
            </div>
          </div>
        )}
      </div>

      {isAddMemberOpen && (
        <AddMemberModal
          onClose={() => setIsAddMemberOpen(false)}
          teamId={currentTeam.id}
          currentMembers={members}
          allUsers={allUsers}
          onMemberAdded={fetchWorkspaceData}
        />
      )}
    </div>
  );
}
