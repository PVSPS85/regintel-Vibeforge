import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Loader2,
  MessageSquare,
  Send,
  AlertTriangle,
  CalendarDays,
  Building2,
  Flag,
  User,
  Zap,
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router';
import api from '../../lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface LiveTask {
  id: string;
  title: string;
  description?: string;
  detailed_explanation?: string;
  status: string;         // "Pending" | "In Progress" | "Completed" | "Cancelled"
  priority: string;       // "Low" | "Medium" | "High"
  due_date?: string;
  branch_id?: string;
  assigned_to_team?: string;
  assigned_to_user?: string;
  regulation_id?: string;
  created_at?: string;
  updated_at?: string;
}

interface TeamData {
  id: string;
  name: string;
}

interface UserData {
  id: string;
  name: string;
  email?: string;
  role?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDate = (raw?: string) => {
  if (!raw) return '—';
  try {
    return new Date(raw).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  } catch {
    return raw;
  }
};

const daysUntil = (raw?: string): string => {
  if (!raw) return '';
  try {
    const diff = Math.ceil((new Date(raw).getTime() - Date.now()) / 86_400_000);
    if (diff < 0) return `${Math.abs(diff)} days overdue`;
    if (diff === 0) return 'Due today';
    return `${diff} day${diff !== 1 ? 's' : ''} left`;
  } catch {
    return '';
  }
};

const priorityStyle = (p: string) => {
  switch (p?.toUpperCase()) {
    case 'HIGH':   return 'bg-red-50 text-red-700 border-red-100';
    case 'LOW':    return 'bg-gray-50 text-gray-600 border-gray-200';
    default:       return 'bg-amber-50 text-amber-700 border-amber-100';
  }
};

const statusStyle = (s: string) => {
  const lower = s?.toLowerCase();
  if (lower === 'completed') return 'bg-emerald-50 text-emerald-700 border-emerald-100';
  if (lower === 'in progress' || lower === 'in_progress') return 'bg-blue-50 text-blue-700 border-blue-100';
  if (lower === 'cancelled') return 'bg-red-50 text-red-600 border-red-100';
  return 'bg-amber-50 text-amber-700 border-amber-100';
};

const statusLabel = (s: string) => {
  const lower = s?.toLowerCase();
  if (lower === 'in progress' || lower === 'in_progress') return 'IN PROGRESS';
  if (lower === 'completed') return 'COMPLETED';
  if (lower === 'cancelled') return 'CANCELLED';
  return 'PENDING';
};

// ─── Main Component ────────────────────────────────────────────────────────────

const TaskDetail = () => {
  const navigate = useNavigate();
  const { taskId } = useParams<{ taskId: string }>();

  // ── State ──────────────────────────────────────────────────────────────────
  const [task, setTask]         = useState<LiveTask | null>(null);
  const [teams, setTeams]       = useState<TeamData[]>([]);
  const [users, setUsers]       = useState<UserData[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [comment, setComment]   = useState('');
  const [comments, setComments] = useState<Array<{ id: string; name: string; initials: string; color: string; text: string; time: string }>>([]);

  // ── Fetch live task + teams + users from backend ───────────────────────────
  const fetchTaskAndMetadata = useCallback(async () => {
    if (!taskId) {
      setError('No task ID provided in the URL.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // Fetch task along with teams and users for resolving UUIDs to readable names
      const [taskRes, teamsRes, usersRes] = await Promise.all([
        api.get<LiveTask>(`/tasks/${taskId}`),
        api.get<TeamData[]>('/teams/').catch(() => ({ data: [] })),
        api.get<UserData[]>('/users/').catch(() => ({ data: [] })),
      ]);

      setTask(taskRes.data);
      setTeams(teamsRes.data || []);
      setUsers(usersRes.data || []);
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      setError(detail ?? `Could not load task ${taskId}. It may have been removed or you may not have access.`);
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    fetchTaskAndMetadata();
  }, [fetchTaskAndMetadata]);

  // ── Mark task complete (PATCH) ─────────────────────────────────────────────
  const handleMarkComplete = async () => {
    if (!taskId || !task) return;
    try {
      const res = await api.patch<LiveTask>(`/tasks/${taskId}`, { status: 'Completed' });
      setTask(res.data);
    } catch (err: any) {
      alert(err?.response?.data?.detail ?? 'Failed to mark task as complete.');
    }
  };

  // ── Comments (local state) ─────────────────────────────────────────────────
  const handleSendComment = () => {
    const trimmed = comment.trim();
    if (!trimmed) return;
    setComments((prev) => [
      ...prev,
      {
        id: `c${Date.now()}`,
        name: 'You',
        initials: 'ME',
        color: 'bg-gray-700',
        text: trimmed,
        time: 'Just now',
      },
    ]);
    setComment('');
  };

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-[#f9fafb]">
        <div className="flex items-center gap-3 text-gray-400">
          <Loader2 size={20} className="animate-spin" />
          <span className="text-[14px] font-medium">Loading live task details from Supabase...</span>
        </div>
      </div>
    );
  }

  // ── Error / Not Found ──────────────────────────────────────────────────────
  if (error || !task) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-[#f9fafb]">
        <div className="bg-white rounded-xl p-8 border border-red-100 text-center max-w-sm">
          <AlertTriangle size={32} className="text-red-400 mx-auto mb-3" />
          <p className="text-[14px] font-semibold text-gray-800 mb-1">Task Not Found</p>
          <p className="text-[12px] text-gray-500 mb-5">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg text-[13px] font-bold cursor-pointer"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // ── Resolve DB names from UUIDs ────────────────────────────────────────────
  const assignedTeamName = teams.find((t) => t.id === task.assigned_to_team)?.name || 'Compliance Department';
  const assignedUserName = users.find((u) => u.id === task.assigned_to_user)?.name || 'Assigned Compliance Officer';
  
  const due = formatDate(task.due_date);
  const daysLeft = daysUntil(task.due_date);
  const isOverdue = daysLeft.includes('overdue');

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#f9fafb] font-sans text-gray-900">

      {/* ── HEADER & TITLE ── */}
      <div>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-[13px] text-gray-500 hover:text-gray-800 font-semibold mb-4 transition-colors cursor-pointer"
        >
          <ArrowLeft size={15} />
          Back to Workspace
        </button>

        <div className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] shadow-sm p-6">
          {/* Status + Priority chips */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className={`px-2.5 py-1 rounded-md border text-[11px] font-bold uppercase tracking-wider ${priorityStyle(task.priority)}`}>
              {task.priority} Priority
            </span>
            <span className={`px-2.5 py-1 rounded-md border text-[11px] font-bold uppercase tracking-wider ${statusStyle(task.status)}`}>
              {statusLabel(task.status)}
            </span>
            {isOverdue && (
              <span className="px-2.5 py-1 rounded-md border text-[11px] font-bold uppercase tracking-wider bg-red-100 text-red-700 border-red-200 flex items-center gap-1">
                <AlertTriangle size={10} /> Overdue
              </span>
            )}
          </div>

          {/* Real Task Title */}
          <h1 className="text-2xl font-extrabold text-gray-900 leading-snug max-w-3xl">
            {task.title}
          </h1>

          {/* Prominent Compliance Action Plan / AI Mandate Instructions Section */}
          <div className="bg-gradient-to-br from-blue-50/90 to-indigo-50/50 rounded-xl p-5 border border-blue-100 mt-5 shadow-sm">
            <div className="flex items-center gap-2 text-blue-700 font-bold text-[13px] mb-2 uppercase tracking-wider">
              <Zap size={16} className="text-blue-600 shrink-0" />
              Compliance Action Plan & AI Execution Mandate
            </div>
            <p className="text-[14px] text-gray-800 leading-relaxed whitespace-pre-wrap font-medium">
              {task.detailed_explanation || task.description || "Review and execute mandatory compliance actions extracted from the uploaded circular."}
            </p>
          </div>

          <p className="text-[13px] text-gray-400 mt-4">
            Assigned to: <span className="font-semibold text-gray-700">{assignedTeamName}</span>
            <span className="mx-2">·</span>
            Due: {due}
            {daysLeft && (
              <span className={`ml-2 font-semibold ${isOverdue ? 'text-red-500' : 'text-amber-500'}`}>
                ({daysLeft})
              </span>
            )}
          </p>
        </div>
      </div>

      {/* ── 2-COLUMN GRID ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── LEFT COL: Comments & Collaboration ── */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <MessageSquare size={16} className="text-gray-400" />
              <h2 className="text-[15px] font-bold text-gray-900">Activity & Comments ({comments.length})</h2>
            </div>

            <div className="p-4 space-y-4 min-h-[120px]">
              {comments.length === 0 ? (
                <p className="text-[13px] text-gray-400 italic text-center py-6">
                  No comments or updates posted yet. Assigned officers can log progress notes below.
                </p>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className="flex gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0 ${c.color}`}>
                      {c.initials}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-[13px] font-bold text-gray-900">{c.name}</span>
                        <span className="text-[11px] text-gray-400">{c.time}</span>
                      </div>
                      <p className="text-[13px] text-gray-700 leading-relaxed">{c.text}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Comment input */}
            <div className="px-4 pb-4 pt-2 border-t border-gray-50">
              <div className="flex items-center gap-2 bg-[#f3f3f5] rounded-full px-4 py-2 border border-gray-200 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-white text-[9px] font-bold shrink-0">ME</div>
                <input
                  type="text"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSendComment(); }}
                  placeholder="Post progress update or comment..."
                  className="flex-1 bg-transparent text-[13px] text-gray-900 placeholder:text-gray-400 outline-none"
                />
                <button
                  onClick={handleSendComment}
                  disabled={!comment.trim()}
                  className="w-7 h-7 rounded-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center text-white transition-all cursor-pointer"
                >
                  <Send size={12} className="ml-0.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT COL: Real Database Metadata ── */}
        <div className="space-y-5">

          {/* Task Details Metadata */}
          <div className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] shadow-sm p-5">
            <h3 className="text-[14px] font-bold text-gray-900 mb-4">Task Metadata</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CalendarDays size={15} className="text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Due Date</p>
                  <p className={`text-[13px] font-semibold ${isOverdue ? 'text-red-600' : 'text-gray-800'}`}>
                    {due}{daysLeft ? ` · ${daysLeft}` : ''}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Flag size={15} className="text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Priority</p>
                  <p className="text-[13px] font-semibold text-gray-800">{task.priority}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Building2 size={15} className="text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Assigned Team</p>
                  <p className="text-[13px] font-semibold text-gray-800">
                    {assignedTeamName}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <User size={15} className="text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Assigned Officer</p>
                  <p className="text-[13px] font-semibold text-gray-800">{assignedUserName}</p>
                </div>
              </div>

              {task.created_at && (
                <div className="flex items-start gap-3">
                  <Clock size={15} className="text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Created</p>
                    <p className="text-[13px] font-semibold text-gray-800">{formatDate(task.created_at)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mark Complete Action */}
          {task.status !== 'Completed' && task.status !== 'Cancelled' && (
            <div className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] shadow-sm p-5">
              <h3 className="text-[14px] font-bold text-gray-900 mb-2">Fulfillment</h3>
              <p className="text-[12px] text-gray-500 mb-3">
                Mark this mandate as completed once the department has executed all required actions.
              </p>
              <button
                onClick={handleMarkComplete}
                className="w-full h-10 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[13px] font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
              >
                <CheckCircle2 size={15} />
                Mark as Complete
              </button>
            </div>
          )}

          {task.status === 'Completed' && (
            <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-5 flex items-center gap-3">
              <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
              <div>
                <p className="text-[13px] font-bold text-emerald-800">Task Completed</p>
                <p className="text-[11px] text-emerald-600">This regulatory obligation has been verified and closed.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskDetail;
