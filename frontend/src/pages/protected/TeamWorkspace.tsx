import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  ChevronDown,
  Clock,
  Download,
  ExternalLink,
  FileSearch,
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
import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  created_at?: string;
  regulation_id?: string | null;
}

interface RegulationInfo {
  id: string;
  title: string;
  file_path: string;
  status: string;
  created_at: string;
  summary?: string | null;
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

  // Regulations + Documents live data
  const [regulations, setRegulations] = useState<RegulationInfo[]>([]);
  const [regsLoading, setRegsLoading] = useState(false);
  const [regsLoaded, setRegsLoaded] = useState(false);

  // Discussion state (UI only per prompt rules)
  const [messages, setMessages] = useState([
    { id: 'm1', author: 'System Bot', initials: 'SB', color: 'bg-purple-600', text: 'Welcome to the real-time compliance workspace.', time: 'Today', isMe: false }
  ]);
  const [msgInput, setMsgInput] = useState('');

  // Download feature state & toast
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // isMounted guard — prevents state updates firing after the component navigates away
  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const fetchWorkspaceData = useCallback(async () => {
    if (!teamId) return;
    try {
      if (isMounted.current) setLoading(true);
      const [teamsRes, membersRes, tasksRes, usersRes] = await Promise.all([
        api.get<TeamInfo[]>('/teams/'),
        api.get<MemberInfo[]>(`/teams/${teamId}/members`).catch(() => ({ data: [] as MemberInfo[] })),
        api.get<TaskInfo[]>(`/tasks/?assigned_to_team=${teamId}`).catch(() => ({ data: [] as TaskInfo[] })),
        api.get<MemberInfo[]>('/users/').catch(() => ({ data: [] as MemberInfo[] }))
      ]);

      if (!isMounted.current) return; // component unmounted while awaiting

      const teamsList: TeamInfo[] = teamsRes.data || [];
      setAllTeams(teamsList);
      const found = teamsList.find((t) => t.id === teamId) || teamsList[0] || null;
      setCurrentTeam(found);
      setMembers(membersRes.data || []);
      setTasks(tasksRes.data || []);
      setAllUsers(usersRes.data || []);
    } catch (err) {
      console.error('Workspace load failed:', err);
      if (!isMounted.current) return;
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    fetchWorkspaceData();
  }, [fetchWorkspaceData]);

  // Reset cached regulation data when team changes so a fresh fetch is triggered
  useEffect(() => {
    setRegulations([]);
    setRegsLoaded(false);
  }, [teamId]);

  // Lazy-fetch regulations when the regulations or documents tab is first opened.
  // NOTE: `tasks` is read at call-time via the argument to avoid a stale closure
  // (the effect deps do NOT include `tasks` because we don't want it to re-run
  // every time a task status toggles — only on tab switch + loaded flag).
  // `regsLoading` is intentionally NOT in deps to avoid a re-fire loop.
  useEffect(() => {
    if ((activeTab === 'regulations' || activeTab === 'documents') && !regsLoaded && !regsLoading) {
      fetchRegulationsForTeam(tasks);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, regsLoaded]);

  const fetchRegulationsForTeam = async (currentTasks: TaskInfo[]) => {
    // Collect unique regulation IDs from the tasks passed in (avoids stale closure)
    const safeTasks: TaskInfo[] = Array.isArray(currentTasks) ? currentTasks : [];
    const regIds = Array.from(
      new Set(
        safeTasks
          .map((t) => t.regulation_id)
          .filter((id): id is string => typeof id === 'string' && id.length > 0)
      )
    );

    if (regIds.length === 0) {
      if (isMounted.current) setRegsLoaded(true);
      return;
    }

    if (isMounted.current) setRegsLoading(true);
    try {
      const results = await Promise.all(
        regIds.map((id) =>
          api.get<RegulationInfo>(`/regulations/${id}`).then((r) => r.data).catch(() => null)
        )
      );
      if (!isMounted.current) return;
      setRegulations(results.filter((r): r is RegulationInfo => r !== null));
    } catch (err) {
      console.error('Failed to load team regulations:', err);
    } finally {
      if (isMounted.current) {
        setRegsLoading(false);
        setRegsLoaded(true);
      }
    }
  };

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

  const handleDownload = async (regId: string, fileName: string) => {
    if (!regId) {
      setToast({ message: 'File reference ID is missing.', type: 'error' });
      return;
    }
    try {
      setDownloadingId(regId);
      setToast({ message: `Downloading ${fileName}…`, type: 'success' });
      const response = await api.get(`/regulations/${regId}/download`, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
      setToast({ message: `Failed to download "${fileName}". The file may be missing on the server.`, type: 'error' });
    } finally {
      if (isMounted.current) setDownloadingId(null);
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
  // Defensive safe arrays — all .map() calls use these to prevent crashes
  // if the server returns null/undefined instead of an array
  const safeTasks      = Array.isArray(tasks)       ? tasks       : [];
  const safeMembers    = Array.isArray(members)     ? members     : [];
  const safeAllTeams   = Array.isArray(allTeams)    ? allTeams    : [];
  const safeRegs       = Array.isArray(regulations) ? regulations : [];
  const safeMessages   = Array.isArray(messages)    ? messages    : [];
  const safeAllUsers   = Array.isArray(allUsers)    ? allUsers    : [];

  const TABS: { id: Tab; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'tasks',       label: 'Tasks',       icon: <Zap size={14} />,         count: safeTasks.filter((t) => t.status !== 'Completed').length },
    { id: 'documents',   label: 'Documents',   icon: <FileText size={14} />,     count: regsLoaded ? safeRegs.length : undefined },
    { id: 'discussion',  label: 'Discussion',  icon: <MessageSquare size={14} />, count: safeMessages.length },
    { id: 'regulations', label: 'Regulations', icon: <Shield size={14} />,       count: regsLoaded ? safeRegs.length : undefined },
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
                  {safeAllTeams.map((t) => (
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
                <h3 className="text-xs font-semibold tracking-wider text-gray-500 uppercase">Team Members ({safeMembers.length})</h3>
                {isAdmin && (
                  <button onClick={() => setIsAddMemberOpen(true)} className="flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-2 py-1 rounded cursor-pointer border border-blue-100">
                    <Plus size={12} /> Add Member
                  </button>
                )}
              </div>
              <div className="bg-white/80 backdrop-blur-lg border border-white/50 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] divide-y divide-gray-100">
                {safeMembers.length === 0 ? (
                  <p className="p-4 text-xs text-gray-400 text-center italic">No assigned members yet.</p>
                ) : (
                  safeMembers.map((m, idx) => {
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
                  Action Points · {safeTasks.filter((t) => t.status === 'Completed').length}/{safeTasks.length} Done
                </h3>
              </div>

              {safeTasks.length === 0 ? (
                <div className="p-12 text-center bg-gray-50/50 rounded-2xl border border-gray-200">
                  <p className="text-sm text-gray-500 italic">No tasks currently assigned to this team.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {[...safeTasks].sort((a, b) => {
                    const getStatusRank = (s: string = '') => {
                      const lower = (s || '').toLowerCase();
                      if (lower === 'pending') return 0;
                      if (lower === 'in progress' || lower === 'in_progress') return 1;
                      if (lower === 'completed') return 2;
                      if (lower === 'cancelled') return 3;
                      return 4;
                    };
                    const rankA = getStatusRank(a.status || '');
                    const rankB = getStatusRank(b.status || '');
                    if (rankA !== rankB) return rankA - rankB;
                    const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
                    const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
                    return timeB - timeA;
                  }).map((t) => {
                    const done = t.status === 'Completed';
                    const safePriority = t.priority || 'Medium';
                    const safeStatus   = t.status   || 'Pending';
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
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ring-1 ring-inset ${priorityBg(safePriority)}`}>{safePriority}</span>
                          </div>
                          <p
                            onClick={() => navigate(`/tasks/${t.id}`)}
                            className={`text-sm font-semibold cursor-pointer hover:text-blue-600 transition-colors ${done ? 'text-gray-400 line-through' : 'text-gray-900'}`}
                          >
                            {t.title}
                          </p>
                          <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                            {t.due_date && <span className="flex items-center gap-1"><Calendar size={11} />Due: {t.due_date}</span>}
                          </div>
                        </div>

                        {/* Status */}
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full border shrink-0 ${statusBg(safeStatus)}`}>
                          {safeStatus === 'In Progress' && <Clock size={9} className="inline mr-1" />}
                          {safeStatus}
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
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold tracking-wider text-gray-500 uppercase">
                Source Documents · {safeRegs.length} PDF{safeRegs.length !== 1 ? 's' : ''}
              </h3>
              {regsLoading && (
                <span className="flex items-center gap-1.5 text-xs text-blue-500 font-medium">
                  <Loader2 size={12} className="animate-spin" /> Loading…
                </span>
              )}
            </div>

            {regsLoading && safeRegs.length === 0 ? (
              <div className="p-10 flex items-center justify-center gap-3 text-gray-400">
                <Loader2 size={20} className="animate-spin text-blue-500" />
                <span className="text-sm">Fetching source documents…</span>
              </div>
            ) : safeRegs.length === 0 ? (
              <div className="p-12 flex flex-col items-center gap-3 text-center bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                <FileText size={32} className="text-gray-300" />
                <p className="text-sm font-semibold text-gray-500">No source documents yet</p>
                <p className="text-xs text-gray-400 max-w-xs">
                  Source PDFs will appear here once a regulation circular has been uploaded and tasks have been assigned to this team.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_4px_20px_rgb(0,0,0,0.04)]">
                {/* Table header */}
                <div className="grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-4 px-5 py-3 bg-gray-50 border-b border-gray-100 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  <span className="w-8" />
                  <span>Filename / Title</span>
                  <span className="w-24 text-center">Status</span>
                  <span className="w-28 text-right">Upload Date</span>
                  <span className="w-8" />
                </div>

                {/* Table rows */}
                {safeRegs.map((reg, idx) => {
                  // Null-safe filename: file_path may be null/undefined from the API
                  const rawPath = reg.file_path || '';
                  const fileName = rawPath.split('/').pop() || rawPath || 'unknown.pdf';
                  // Null-safe date: created_at may be missing or malformed
                  const rawDate = reg.created_at ? new Date(reg.created_at) : null;
                  const uploadDate = rawDate && !isNaN(rawDate.getTime())
                    ? rawDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                    : 'Unknown date';
                  const taskCount = safeTasks.filter((t) => t.regulation_id === reg.id).length;

                  const statusStyle =
                    reg.status === 'PROCESSED'
                      ? 'bg-emerald-50 text-emerald-700 ring-emerald-100'
                      : reg.status === 'FAILED'
                      ? 'bg-red-50 text-red-600 ring-red-100'
                      : 'bg-amber-50 text-amber-700 ring-amber-100';

                  return (
                    <div
                      key={reg.id}
                      className={`grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-4 px-5 py-3.5 transition-colors hover:bg-blue-50/30 ${
                        idx < safeRegs.length - 1 ? 'border-b border-gray-50' : ''
                      }`}
                    >
                      {/* Icon */}
                      <div className="w-8 h-8 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center shrink-0">
                        <FileText size={15} className="text-red-500" />
                      </div>

                      {/* Name + metadata */}
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate" title={reg.title}>
                          {reg.title}
                        </p>
                        <p className="text-[11px] text-gray-400 font-mono truncate mt-0.5" title={fileName}>
                          {fileName}
                        </p>
                        {taskCount > 0 && (
                          <p className="text-[11px] text-blue-500 font-medium mt-0.5">
                            {taskCount} task{taskCount !== 1 ? 's' : ''} assigned to this team
                          </p>
                        )}
                      </div>

                      {/* Status badge */}
                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full ring-1 ring-inset uppercase tracking-wide ${statusStyle}`}
                      >
                        {reg.status === 'PROCESSED' ? 'Ready' : reg.status === 'FAILED' ? 'Failed' : 'Processing'}
                      </span>

                      {/* Upload date */}
                      <span className="text-xs text-gray-400 font-medium w-28 text-right whitespace-nowrap">
                        <Calendar size={10} className="inline mr-1 mb-0.5" />
                        {uploadDate}
                      </span>

                      {/* Download button */}
                      <button
                        onClick={() => handleDownload(reg.id, fileName)}
                        disabled={downloadingId === reg.id}
                        title="Download original PDF"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-600 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer shadow-sm shrink-0"
                      >
                        {downloadingId === reg.id ? (
                          <>
                            <Loader2 size={13} className="animate-spin" />
                            <span>Downloading…</span>
                          </>
                        ) : (
                          <>
                            <Download size={13} />
                            <span>Download</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── DISCUSSION TAB ────────────────────────────────────── */}
        {activeTab === 'discussion' && (
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-8 space-y-4 bg-gray-50/30">
              {safeMessages.map((msg) => (
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
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold tracking-wider text-gray-500 uppercase">
                Regulation Circulars · {safeRegs.length} Active
              </h3>
              {regsLoading && (
                <span className="flex items-center gap-1.5 text-xs text-blue-500 font-medium">
                  <Loader2 size={12} className="animate-spin" /> Loading…
                </span>
              )}
            </div>

            {regsLoading && safeRegs.length === 0 ? (
              <div className="p-10 flex items-center justify-center gap-3 text-gray-400">
                <Loader2 size={20} className="animate-spin text-blue-500" />
                <span className="text-sm">Fetching regulatory mandates…</span>
              </div>
            ) : safeRegs.length === 0 ? (
              <div className="p-12 flex flex-col items-center gap-3 text-center bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                <FileSearch size={32} className="text-gray-300" />
                <p className="text-sm font-semibold text-gray-500">No regulatory mandates mapped</p>
                <p className="text-xs text-gray-400 max-w-xs">
                  Regulations will appear here once an uploaded circular has generated compliance tasks assigned to this team.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {safeRegs.map((reg) => {
                  // Null-safe date
                  const rawDate2 = reg.created_at ? new Date(reg.created_at) : null;
                  const uploadDate = rawDate2 && !isNaN(rawDate2.getTime())
                    ? rawDate2.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                    : 'Unknown date';
                  const teamTaskCount = safeTasks.filter((t) => t.regulation_id === reg.id);
                  const completed = teamTaskCount.filter((t) => t.status === 'Completed').length;
                  const total = teamTaskCount.length;
                  const completionPct = total > 0 ? Math.round((completed / total) * 100) : 0;

                  const statusStyle =
                    reg.status === 'PROCESSED'
                      ? 'bg-emerald-50 text-emerald-700 ring-emerald-100'
                      : reg.status === 'FAILED'
                      ? 'bg-red-50 text-red-600 ring-red-100'
                      : 'bg-amber-50 text-amber-700 ring-amber-100';

                  return (
                    <div
                      key={reg.id}
                      className="bg-white border border-gray-100 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.04)] p-5 hover:border-blue-100 hover:shadow-[0_4px_20px_rgb(59,130,246,0.06)] transition-all"
                    >
                      <div className="flex items-start justify-between gap-4">
                        {/* Left: Icon + info */}
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0 mt-0.5">
                            <Shield size={18} className="text-indigo-500" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-gray-900 leading-snug" title={reg.title}>
                              {reg.title}
                            </p>
                            <p className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1">
                              <Calendar size={10} />
                              Uploaded {uploadDate}
                            </p>
                          </div>
                        </div>

                        {/* Right: status badge + view link */}
                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`text-[10px] font-bold px-2.5 py-1 rounded-full ring-1 ring-inset uppercase tracking-wide ${statusStyle}`}
                          >
                            {reg.status === 'PROCESSED' ? 'Processed' : reg.status === 'FAILED' ? 'Failed' : 'Processing'}
                          </span>
                          <button
                            onClick={() => navigate(`/regulations`)}
                            title="Open in Regulations"
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-300 hover:text-blue-500 hover:bg-blue-50 transition-colors cursor-pointer"
                          >
                            <ExternalLink size={13} />
                          </button>
                        </div>
                      </div>

                      {/* Team task progress bar */}
                      {total > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-50 space-y-2">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-semibold text-gray-500">
                              Team Progress — {completed}/{total} tasks complete
                            </span>
                            <span className={`font-bold ${
                              completionPct === 100 ? 'text-emerald-600' :
                              completionPct >= 50 ? 'text-blue-600' : 'text-amber-600'
                            }`}>
                              {completionPct}%
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-700 ${
                                completionPct === 100 ? 'bg-emerald-500' :
                                completionPct >= 50 ? 'bg-blue-500' : 'bg-amber-500'
                              }`}
                              style={{ width: `${completionPct}%` }}
                            />
                          </div>

                          {/* Individual task chips */}
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {teamTaskCount.slice(0, 5).map((t) => (
                              <button
                                key={t.id}
                                onClick={() => navigate(`/tasks/${t.id}`)}
                                className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border cursor-pointer transition-colors ${
                                  t.status === 'Completed'
                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100'
                                    : t.status === 'In Progress'
                                    ? 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100'
                                    : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                                }`}
                              >
                                {t.status === 'Completed' && <CheckCircle size={9} className="stroke-[3]" />}
                                {t.status === 'In Progress' && <Clock size={9} />}
                                <span className="truncate max-w-[140px]">{t.title}</span>
                              </button>
                            ))}
                            {teamTaskCount.length > 5 && (
                              <span className="text-[10px] font-semibold text-gray-400 px-2 py-0.5">
                                +{teamTaskCount.length - 5} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {isAddMemberOpen && (
        <AddMemberModal
          onClose={() => setIsAddMemberOpen(false)}
          teamId={currentTeam.id}
          currentMembers={safeMembers}
          allUsers={safeAllUsers}
          onMemberAdded={fetchWorkspaceData}
        />
      )}

      {/* Floating Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border transition-all animate-in fade-in slide-in-from-bottom-5 duration-300 ${
          toast.type === 'success'
            ? 'bg-emerald-900 text-white border-emerald-700'
            : 'bg-red-900 text-white border-red-700'
        }`}>
          <span className="text-xs font-medium">{toast.message}</span>
          <button onClick={() => setToast(null)} className="text-white/70 hover:text-white ml-1 cursor-pointer">
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
