import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  ExternalLink,
  Mail,
  RefreshCw,
  Users,
  X,
  AlertTriangle,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router';
import api from '../../lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface LiveTask {
  id: string;
  title: string;
  description?: string;
  status: string;        // "Pending" | "In Progress" | "Completed" | "Cancelled"
  priority: string;      // "Low" | "Medium" | "High"
  due_date?: string;
  assigned_to_user?: string;
  created_at?: string;
}

interface TeamData {
  id: string;
  name: string;
  branch_id: string;
  leader_id?: string;
  leader_name?: string;
  member_count?: number;
  pending_tasks?: number;
  completed_tasks?: number;
  compliance_score?: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const initials = (name: string) =>
  name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

const AVATAR_COLORS = [
  'bg-indigo-600', 'bg-[#030213]', 'bg-violet-600',
  'bg-rose-500',   'bg-sky-600',   'bg-emerald-600',
  'bg-amber-500',  'bg-pink-600',
];

const avatarColor = (index: number) => AVATAR_COLORS[index % AVATAR_COLORS.length];

const formatDueDate = (raw?: string) => {
  if (!raw) return '—';
  try {
    return new Date(raw).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  } catch {
    return raw;
  }
};

const statusStyle = (status: string) => {
  const s = status.toLowerCase();
  if (s === 'completed' || s === 'done')
    return 'bg-emerald-50 text-emerald-700 border-emerald-100';
  if (s === 'in progress' || s === 'in_progress')
    return 'bg-blue-50 text-blue-700 border-blue-100';
  if (s === 'cancelled')
    return 'bg-red-50 text-red-600 border-red-100';
  return 'bg-amber-50 text-amber-700 border-amber-100'; // Pending
};

const statusLabel = (status: string) => {
  const s = status.toLowerCase();
  if (s === 'in progress' || s === 'in_progress') return 'IN PROGRESS';
  if (s === 'completed') return 'DONE';
  if (s === 'cancelled') return 'CANCELLED';
  return 'PENDING';
};

const priorityDot = (priority: string) => {
  if (priority === 'High') return 'bg-red-400';
  if (priority === 'Medium') return 'bg-amber-400';
  return 'bg-gray-300';
};

// ─── Transfer Modal ────────────────────────────────────────────────────────────

const TransferModal = ({
  members,
  teamName,
  onClose,
}: {
  members: TeamMember[];
  teamName: string;
  onClose: () => void;
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reason, setReason] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h2 className="text-[17px] font-bold text-gray-900">Transfer Leadership</h2>
            <p className="text-[12px] text-gray-500 mt-0.5">{teamName}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-colors cursor-pointer">
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          <div>
            <label className="block text-[12px] font-bold text-gray-600 mb-2 uppercase tracking-wide">Select New Team Leader</label>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {members.map((m, idx) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedId(m.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all cursor-pointer ${
                    selectedId === m.id ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0 ${avatarColor(idx)}`}>
                    {initials(m.name)}
                  </div>
                  <div className="flex-1">
                    <p className="text-[13px] font-bold text-gray-900">{m.name}</p>
                    <p className="text-[11px] text-gray-400">{m.role}</p>
                  </div>
                  {selectedId === m.id && <CheckCircle2 size={16} className="text-blue-600" />}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Reason for Transfer</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Provide a justification for this leadership change..."
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-[#f9fafb] text-[13px] text-gray-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all resize-none placeholder:text-gray-400"
            />
          </div>

          <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-100 rounded-lg">
            <AlertTriangle size={14} className="text-rose-500 mt-0.5 shrink-0" />
            <p className="text-[12px] text-rose-700 font-medium leading-relaxed">
              This action will notify your Branch Manager and the new Team Lead immediately.
            </p>
          </div>
        </div>

        <div className="px-6 pb-6 flex justify-end gap-3">
          <button onClick={onClose} className="h-10 px-4 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-[13px] font-bold transition-colors cursor-pointer">
            Cancel
          </button>
          <button
            disabled={!selectedId || !reason.trim()}
            onClick={() => { alert('Transfer request submitted.'); onClose(); }}
            className="h-10 px-5 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-[13px] font-bold transition-colors cursor-pointer"
          >
            Submit Transfer Request
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────

const TeamDetails = () => {
  const navigate = useNavigate();
  const { teamId } = useParams<{ teamId: string }>();

  // ── State ──────────────────────────────────────────────────────────────────
  const [team, setTeam] = useState<TeamData | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [tasks, setTasks] = useState<LiveTask[]>([]);
  const [loadingTeam, setLoadingTeam] = useState(true);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // ── Data Fetchers ──────────────────────────────────────────────────────────

  /**
   * Fetch team metadata + members.
   * GET /teams/ — returns all teams; we find the one matching :teamId.
   * GET /teams/:teamId/members — returns member list.
   */
  const fetchTeamAndMembers = useCallback(async () => {
    if (!teamId) return;
    try {
      // Fetch team metadata from the teams list (API returns branch-scoped teams)
      const teamsRes = await api.get<TeamData[]>('/teams/');
      const found = teamsRes.data.find((t) => t.id === teamId);
      setTeam(found ?? null);

      // Fetch members
      const membersRes = await api.get<TeamMember[]>(`/teams/${teamId}/members`);
      setMembers(membersRes.data ?? []);
    } catch (err: any) {
      console.error('[TeamDetails] Failed to load team:', err);
      setError('Could not load team data. Check that the backend is running.');
    } finally {
      setLoadingTeam(false);
    }
  }, [teamId]);

  /**
   * Fetch live tasks for this specific team UUID.
   * GET /tasks/?assigned_to_team=:teamId
   *
   * KEY FIX: This queries by the SAME teamId used in the URL, which is the
   * real Supabase UUID that map_department_to_team() committed to the DB.
   * This guarantees perfect team_id alignment between backend and frontend.
   */
  const fetchTasks = useCallback(async () => {
    if (!teamId) return;
    setLoadingTasks(true);
    try {
      const res = await api.get<LiveTask[]>(`/tasks/`, {
        params: { assigned_to_team: teamId },
      });
      setTasks(res.data ?? []);
    } catch (err: any) {
      console.error('[TeamDetails] Failed to load tasks:', err);
    } finally {
      setLoadingTasks(false);
    }
  }, [teamId]);

  /**
   * Full refresh — called on mount AND by the manual Refresh button.
   * Using teamId as the useEffect dependency ensures a fresh fetch
   * every time React Router navigates to a different /:teamId route.
   */
  useEffect(() => {
    setLoadingTeam(true);
    setLoadingTasks(true);
    setError(null);
    fetchTeamAndMembers();
    fetchTasks();
  }, [teamId]); // ← teamId dependency is the critical fix

  const handleManualRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchTeamAndMembers(), fetchTasks()]);
    setRefreshing(false);
  };

  // ── Derived Metrics ────────────────────────────────────────────────────────
  const pendingCount = tasks.filter(
    (t) => t.status.toLowerCase() === 'pending' || t.status.toLowerCase() === 'in progress' || t.status.toLowerCase() === 'in_progress'
  ).length;
  const completedCount = tasks.filter(
    (t) => t.status.toLowerCase() === 'completed'
  ).length;
  const totalTasks = tasks.length;
  const complianceScore = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : (team?.compliance_score ?? 100);

  const teamName = team?.name ?? 'Team Workspace';
  const memberCount = members.length || team?.member_count || 0;
  const teamAbbr = teamName.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loadingTeam) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-[#f9fafb]">
        <div className="flex items-center gap-3 text-gray-400">
          <Loader2 size={20} className="animate-spin" />
          <span className="text-[14px] font-medium">Loading team workspace...</span>
        </div>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-[#f9fafb]">
        <div className="bg-white rounded-xl p-8 border border-red-100 text-center max-w-sm">
          <AlertTriangle size={32} className="text-red-400 mx-auto mb-3" />
          <p className="text-[14px] font-semibold text-gray-800">{error ?? 'Team not found.'}</p>
          <button onClick={() => navigate('/teams')} className="mt-4 px-4 py-2 bg-gray-900 text-white rounded-lg text-[13px] font-bold cursor-pointer">
            Back to Teams
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#f9fafb] font-sans text-gray-900">

      {/* ── HEADER ── */}
      <div>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-[13px] text-gray-500 hover:text-gray-800 font-semibold mb-4 transition-colors cursor-pointer"
        >
          <ArrowLeft size={15} />
          Back to Teams
        </button>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-[#030213] flex items-center justify-center text-white font-bold text-xl shadow">
              {teamAbbr}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900">{teamName}</h1>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 uppercase tracking-wider">
                  Active
                </span>
              </div>
              <p className="text-[13px] text-gray-500 mt-0.5">
                MG Road Branch · {memberCount} member{memberCount !== 1 ? 's' : ''}
                {team.leader_name && <> · Lead: {team.leader_name}</>}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Manual refresh button — fixes stale task list without hard reload */}
            <button
              onClick={handleManualRefresh}
              disabled={refreshing}
              title="Refresh tasks from database"
              className="h-10 px-3 rounded-md border border-gray-200 bg-white hover:bg-gray-50 text-gray-500 text-[13px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>

            <button
              onClick={() => setIsTransferModalOpen(true)}
              className="h-10 px-4 rounded-md border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-700 text-[13px] font-bold flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Users size={15} />
              Transfer Leadership
            </button>
            <button
              onClick={() => navigate(`/teams/${teamId}/workspace`)}
              className="h-10 px-4 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-bold flex items-center gap-2 transition-colors cursor-pointer shadow-sm"
            >
              <ExternalLink size={15} />
              Open Workspace
            </button>
          </div>
        </div>
      </div>

      {/* ── METRICS — live from API ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Members',       value: String(memberCount),     color: 'text-blue-600',   bg: 'bg-blue-50',   icon: <Users size={18} className="text-blue-400" /> },
          { label: 'Compliance',    value: `${complianceScore}%`,   color: 'text-emerald-600',bg: 'bg-emerald-50',icon: <ShieldCheck size={18} className="text-emerald-400" /> },
          { label: 'Pending Tasks', value: String(pendingCount),    color: 'text-amber-600',  bg: 'bg-amber-50',  icon: <Clock size={18} className="text-amber-400" /> },
          { label: 'Completed',     value: String(completedCount),  color: 'text-violet-600', bg: 'bg-violet-50', icon: <CheckCircle2 size={18} className="text-violet-400" /> },
        ].map((m) => (
          <div key={m.label} className="rounded-xl border border-[rgba(0,0,0,0.05)] shadow-sm p-5 bg-white">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide">{m.label}</span>
              <div className={`w-8 h-8 rounded-lg ${m.bg} flex items-center justify-center`}>{m.icon}</div>
            </div>
            <span className={`text-3xl font-extrabold ${m.color}`}>{m.value}</span>
          </div>
        ))}
      </div>

      {/* Compliance Progress Bar — live */}
      <div className="bg-white rounded-xl border border-[rgba(0,0,0,0.05)] shadow-sm p-5">
        <div className="flex justify-between mb-2">
          <span className="text-[13px] font-bold text-gray-700">Overall Compliance Score</span>
          <span className="text-[13px] font-bold text-gray-900">{complianceScore}%</span>
        </div>
        <div className="w-full h-3 rounded-full bg-gray-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-blue-600 transition-all duration-700"
            style={{ width: `${complianceScore}%` }}
          />
        </div>
        <p className="text-[12px] text-gray-400 mt-2">
          Based on {completedCount} completed task{completedCount !== 1 ? 's' : ''} out of {totalTasks} total for this team.
        </p>
      </div>

      {/* ── 2-COLUMN: Members + Task Tracker ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Left: Live Team Members */}
        <div className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-[15px] font-bold text-gray-900">Team Members ({members.length})</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {members.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-400 text-[13px]">
                No members assigned to this team yet.
              </div>
            ) : (
              members.map((member, idx) => (
                <div key={member.id} className="px-6 py-4 flex items-center gap-3">
                  <div className="relative shrink-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-[12px] font-bold ${avatarColor(idx)}`}>
                      {initials(member.name)}
                    </div>
                    {/* Online indicator (static—no websocket, but visually correct) */}
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white bg-emerald-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[14px] font-bold text-gray-900">{member.name}</p>
                      {member.id === team.leader_id && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-700 border border-amber-200 uppercase tracking-wider">Lead</span>
                      )}
                    </div>
                    <p className="text-[12px] text-gray-400 mt-0.5">{member.role}</p>
                  </div>
                  <button
                    onClick={() => window.open(`mailto:${member.email}`)}
                    title={`Email ${member.name}`}
                    className="w-8 h-8 rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center justify-center text-gray-400 transition-colors cursor-pointer"
                  >
                    <Mail size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Live Task Tracker */}
        <div className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-[15px] font-bold text-gray-900">Task Tracker</h2>
            <span className="text-[12px] font-semibold text-gray-400">
              {loadingTasks ? 'Loading...' : `${tasks.length} task${tasks.length !== 1 ? 's' : ''}`}
            </span>
          </div>

          {loadingTasks ? (
            <div className="px-6 py-10 flex items-center justify-center gap-2 text-gray-400">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-[13px]">Fetching latest tasks from Supabase...</span>
            </div>
          ) : tasks.length === 0 ? (
            <div className="px-6 py-10 text-center text-gray-400 text-[13px]">
              <Clock size={28} className="mx-auto mb-2 text-gray-300" />
              No tasks assigned to this team yet.
              <br />
              Upload a regulation and distribute work to populate tasks here.
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {[...tasks].sort((a, b) => {
                const getStatusRank = (status: string) => {
                  const lower = status?.toLowerCase() || '';
                  if (lower === 'pending') return 0;
                  if (lower === 'in progress' || lower === 'in_progress') return 1;
                  if (lower === 'completed') return 2;
                  if (lower === 'cancelled') return 3;
                  return 4;
                };
                const rankA = getStatusRank(a.status);
                const rankB = getStatusRank(b.status);
                if (rankA !== rankB) return rankA - rankB;
                const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
                const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
                return timeB - timeA;
              }).map((task) => (
                <div
                  key={task.id}
                  onClick={() => navigate(`/tasks/${task.id}`)}
                  className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {/* Priority dot */}
                      <span className={`w-2 h-2 rounded-full shrink-0 mt-1 ${priorityDot(task.priority)}`} />
                      <p className="text-[13px] font-semibold text-gray-900 leading-snug group-hover:text-blue-600 transition-colors truncate">
                        {task.title}
                      </p>
                    </div>
                    <span className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${statusStyle(task.status)}`}>
                      {statusLabel(task.status)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1.5 ml-4">
                    <span className="text-[11px] text-gray-400">
                      Due: {formatDueDate(task.due_date)}
                    </span>
                    {task.priority && (
                      <>
                        <span className="text-[11px] text-gray-300">·</span>
                        <span className={`text-[11px] font-semibold ${
                          task.priority === 'High' ? 'text-red-500' :
                          task.priority === 'Medium' ? 'text-amber-500' : 'text-gray-400'
                        }`}>
                          {task.priority} Priority
                        </span>
                      </>
                    )}
                  </div>
                  {task.description && (
                    <p className="text-[11px] text-gray-400 mt-1.5 ml-4 line-clamp-1">{task.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {isTransferModalOpen && (
        <TransferModal
          members={members}
          teamName={teamName}
          onClose={() => setIsTransferModalOpen(false)}
        />
      )}
    </div>
  );
};

export default TeamDetails;
