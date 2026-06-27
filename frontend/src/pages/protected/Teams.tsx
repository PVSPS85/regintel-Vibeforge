import {
  ArrowLeftRight,
  CheckCircle,
  CheckSquare,
  ChevronRight,
  Clock,
  Loader2,
  Plus,
  Search,
  UploadCloud,
  Users,
  X,
} from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TeamApiItem {
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

interface UserApiItem {
  id: string;
  name: string;
  email: string;
  role: string;
  branch_id?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PALETTES = [
  { color: 'bg-[#030213]', leadColor: 'bg-indigo-600' },
  { color: 'bg-emerald-600', leadColor: 'bg-[#030213]' },
  { color: 'bg-violet-600', leadColor: 'bg-fuchsia-600' },
  { color: 'bg-rose-500', leadColor: 'bg-sky-600' },
  { color: 'bg-amber-500', leadColor: 'bg-emerald-600' },
  { color: 'bg-blue-600', leadColor: 'bg-purple-600' },
];

const getInitials = (name?: string) => {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
};

const getStatusColor = (score: number) => {
  if (score >= 90) return 'text-emerald-700 bg-emerald-50 ring-1 ring-emerald-600/20';
  if (score >= 75) return 'text-amber-700 bg-amber-50 ring-1 ring-amber-600/20';
  return 'text-rose-700 bg-rose-50 ring-1 ring-rose-600/20';
};

const getStatusString = (score: number) => {
  if (score >= 90) return 'High Compliance';
  if (score >= 75) return 'Medium Compliance';
  return 'Needs Attention';
};

const getProgressBarColor = (score: number) => {
  if (score >= 90) return 'bg-emerald-500';
  if (score >= 75) return 'bg-amber-500';
  return 'bg-rose-500';
};

// ─── Create Team Modal ────────────────────────────────────────────────────────

interface CreateTeamModalProps {
  onClose: () => void;
  employees: UserApiItem[];
  onTeamCreated: () => void;
  branchId?: string;
}

const CreateTeamModal: React.FC<CreateTeamModalProps> = ({ onClose, employees, onTeamCreated, branchId }) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [teamName, setTeamName] = useState('');
  const [department, setDepartment] = useState('');
  const [selectedLead, setSelectedLead] = useState<string | null>(null);
  const [memberSearch, setMemberSearch] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleMember = (id: string) => {
    setSelectedMembers((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const filteredEmployees = employees.filter((e) =>
    e.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
    e.role.toLowerCase().includes(memberSearch.toLowerCase())
  );

  const handleCreateTeam = async () => {
    if (!teamName || !selectedLead) return;
    setIsSubmitting(true);
    try {
      const res = await api.post('/teams/', {
        name: teamName,
        department: department || undefined,
        leader_id: selectedLead,
        branch_id: branchId
      });
      const newTeamId = res.data.id;

      let addedCount = 0;
      for (const memberId of selectedMembers) {
        if (memberId !== selectedLead) {
          try {
            await api.post(`/teams/${newTeamId}/members`, { user_id: memberId });
            addedCount++;
          } catch (e) {
            console.error("Failed to assign member:", memberId, e);
          }
        }
      }

      alert(`Team "${teamName}" created successfully and mapped to active branch! Assigned ${addedCount + 1} member(s).`);
      onTeamCreated();
      onClose();
    } catch (err: any) {
      console.error("Failed to create team:", err);
      alert(err.response?.data?.detail || "Failed to create team. Please check server status.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h2 className="text-[17px] font-bold text-gray-900">
              {step === 1 ? 'Create New Team' : 'Add Members'}
            </h2>
            <p className="text-[12px] text-gray-500 mt-0.5">
              Step {step} of 2 — {step === 1 ? 'Team Details (Scoped to Active Branch)' : 'Select Members'}
            </p>
          </div>
          <button onClick={onClose} disabled={isSubmitting} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-colors cursor-pointer">
            <X size={16} />
          </button>
        </div>

        {/* Step Progress */}
        <div className="px-6 pt-4">
          <div className="flex gap-2">
            <div className="h-1 flex-1 rounded-full bg-blue-600" />
            <div className={`h-1 flex-1 rounded-full transition-colors ${step === 2 ? 'bg-blue-600' : 'bg-gray-200'}`} />
          </div>
        </div>

        <div className="px-6 py-5 space-y-4">
          {step === 1 ? (
            <>
              <div>
                <label className="block text-[12px] font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Team Name</label>
                <input value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="e.g. Audit & Compliance Control" className="w-full h-10 px-3 rounded-lg border border-gray-200 bg-[#f9fafb] text-[14px] text-gray-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-gray-400" />
              </div>
              <div>
                <label className="block text-[12px] font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Department Type</label>
                <select value={department} onChange={(e) => setDepartment(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-gray-200 bg-[#f9fafb] text-[14px] text-gray-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all">
                  <option value="">Select department...</option>
                  <option value="IT Security">IT Security</option>
                  <option value="Compliance">Compliance</option>
                  <option value="Legal">Legal</option>
                  <option value="Risk Management">Risk Management</option>
                  <option value="Retail Banking">Retail Banking</option>
                  <option value="Audit">Audit</option>
                </select>
              </div>
              <div>
                <label className="block text-[12px] font-bold text-gray-600 mb-2 uppercase tracking-wide">Select Team Leader</label>
                {employees.length === 0 ? (
                  <p className="text-xs text-gray-400 italic py-4 text-center">No branch users available to select as leader.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1">
                    {employees.map((emp, idx) => {
                      const pal = PALETTES[idx % PALETTES.length];
                      return (
                        <button
                          type="button"
                          key={emp.id}
                          onClick={() => {
                            setSelectedLead(emp.id);
                            setSelectedMembers((prev) => new Set(prev).add(emp.id));
                          }}
                          className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                            selectedLead === emp.id ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0 ${pal.color}`}>{getInitials(emp.name)}</div>
                          <div className="min-w-0">
                            <p className="text-[12px] font-bold text-gray-900 truncate">{emp.name}</p>
                            <p className="text-[10px] text-gray-400 truncate">{emp.role}</p>
                          </div>
                          {selectedLead === emp.id && <CheckSquare size={13} className="ml-auto text-blue-600 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  placeholder="Search employees..."
                  className="w-full h-10 pl-8 pr-3 rounded-lg border border-gray-200 bg-[#f9fafb] text-[13px] outline-none focus:border-blue-400 transition-all placeholder:text-gray-400"
                />
              </div>
              <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                {filteredEmployees.map((emp, idx) => {
                  const pal = PALETTES[idx % PALETTES.length];
                  return (
                    <div
                      key={emp.id}
                      onClick={() => toggleMember(emp.id)}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedMembers.has(emp.id) ? 'border-blue-400 bg-blue-50' : 'border-gray-100 hover:bg-gray-50'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0 ${pal.color}`}>{getInitials(emp.name)}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-bold text-gray-900">{emp.name} {selectedLead === emp.id && <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-semibold ml-1">Leader</span>}</p>
                        <p className="text-[11px] text-gray-400">{emp.role} · {emp.email}</p>
                      </div>
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        selectedMembers.has(emp.id) ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                      }`}>
                        {selectedMembers.has(emp.id) && <CheckSquare size={12} className="text-white" />}
                      </div>
                    </div>
                  );
                })}
              </div>
              {selectedMembers.size > 0 && (
                <p className="text-[12px] font-semibold text-blue-600">{selectedMembers.size} member{selectedMembers.size > 1 ? 's' : ''} selected</p>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className={`px-6 pb-6 flex gap-3 ${step === 2 ? 'justify-between' : 'justify-end'}`}>
          {step === 2 && (
            <button onClick={() => setStep(1)} disabled={isSubmitting} className="h-10 px-4 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-[13px] font-bold transition-colors cursor-pointer">
              ← Back
            </button>
          )}
          {step === 1 ? (
            <button
              type="button"
              onClick={() => setStep(2)}
              disabled={!teamName || !selectedLead}
              className="h-10 px-5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-[13px] font-bold transition-colors cursor-pointer"
            >
              Next: Add Members →
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCreateTeam}
              disabled={isSubmitting}
              className="h-10 px-5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-[13px] font-bold transition-colors flex items-center gap-2 cursor-pointer"
            >
              {isSubmitting && <Loader2 size={14} className="animate-spin" />}
              {isSubmitting ? 'Creating Team...' : 'Create Team'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────

const Teams = () => {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [teams, setTeams] = useState<TeamApiItem[]>([]);
  const [employees, setEmployees] = useState<UserApiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setFetchError(false);
    try {
      const [teamsRes, usersRes] = await Promise.all([
        api.get<TeamApiItem[]>('/teams/'),
        api.get<UserApiItem[]>('/users/')
      ]);
      setTeams(teamsRes.data || []);
      setEmployees(usersRes.data || []);
    } catch (err) {
      console.error('Failed to fetch teams/users:', err);
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  };

  // Fire immediately on mount — don't wait for branch_id to hydrate
  useEffect(() => {
    fetchData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredTeams = teams.filter((team) =>
    team.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Compute metrics dynamically from live data
  const totalTeams = teams.length;
  const totalPending = teams.reduce((acc, t) => acc + (t.pending_tasks || 0), 0);
  const totalCompleted = teams.reduce((acc, t) => acc + (t.completed_tasks || 0), 0);
  const totalScoreSum = teams.reduce((acc, t) => acc + (t.compliance_score ?? 100), 0);
  const avgCompliance = totalTeams > 0 ? Math.round(totalScoreSum / totalTeams) : 100;

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-[#f9fafb] font-sans text-gray-900">

      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Teams</h1>
          <p className="text-[14px] text-gray-500 mt-1">{totalTeams} active teams · Scoped to Active Workspace Branch</p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => navigate('/branch-transfer')}
            className="h-10 px-4 rounded-md border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-[13px] font-bold flex items-center gap-2 transition-colors shadow-sm cursor-pointer"
          >
            <ArrowLeftRight size={15} />
            Request Branch Transfer
          </button>
          {isAdmin && (
            <>
              <button
                onClick={() => navigate('/regulations')}
                className="h-10 px-4 rounded-md border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-[13px] font-bold flex items-center gap-2 transition-colors shadow-sm cursor-pointer"
              >
                <UploadCloud size={15} />
                Upload Regulation
              </button>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="h-10 px-4 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-bold flex items-center gap-2 transition-colors shadow-sm cursor-pointer"
              >
                <Plus size={16} />
                Create Team
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── METRICS ROW ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Teams', value: totalTeams.toString() },
          { label: 'Avg Compliance', value: `${avgCompliance}%` },
          { label: 'Total Pending', value: totalPending.toString() },
          { label: 'Total Completed', value: totalCompleted.toString() },
        ].map((metric, idx) => (
          <div key={idx} className="bg-white/80 backdrop-blur-lg border border-white/50 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-5 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(79,70,229,0.1)] hover:border-indigo-500/20">
            <span className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-cyan-600 tracking-tight">{metric.value}</span>
            <p className="text-xs font-semibold tracking-wider text-gray-500 uppercase mt-1">{metric.label}</p>
          </div>
        ))}
      </div>

      {/* ── SEARCH BAR ── */}
      <div className="w-full md:w-1/3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search teams..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-9 pr-4 rounded-lg border border-gray-200 bg-white text-[14px] placeholder:text-gray-400 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all shadow-sm"
          />
        </div>
      </div>

      {/* ── TEAMS GRID ── */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-gray-400 gap-3">
          <Loader2 size={24} className="animate-spin text-blue-600" />
          <p className="text-sm font-medium">Loading teams for active branch...</p>
        </div>
      ) : fetchError ? (
        <div className="text-center py-20 bg-white/50 rounded-2xl border border-red-100 p-8">
          <p className="text-[15px] font-bold text-red-600">Could not load teams</p>
          <p className="text-xs text-gray-500 mt-1 mb-4">Backend may be restarting. Please wait a moment.</p>
          <button
            onClick={fetchData}
            className="h-9 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-bold transition-colors"
          >
            Retry
          </button>
        </div>
      ) : filteredTeams.length === 0 ? (
        <div className="text-center py-20 bg-white/50 rounded-2xl border border-gray-200 p-8">
          <Users size={36} className="mx-auto text-gray-300 mb-3" />
          <p className="text-[15px] font-bold text-gray-700">No teams found</p>
          <p className="text-xs text-gray-500 mt-1">There are currently no compliance teams mapped to this branch workspace.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredTeams.map((team, idx) => {
            const pal = PALETTES[idx % PALETTES.length];
            const score = team.compliance_score ?? 100;
            const statusStr = getStatusString(score);
            const initials = getInitials(team.name);
            const leadName = team.leader_name || 'Unassigned';
            const leadInitials = getInitials(leadName);

            return (
              <div key={team.id} className="relative bg-white/80 backdrop-blur-lg border border-white/50 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(79,70,229,0.1)] hover:border-indigo-500/20 flex flex-col overflow-hidden">

                {score >= 90 && <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-emerald-500" />}

                {/* Card Header */}
                <div className="p-6 pb-4 flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0 ${pal.color}`}>
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0 pr-4">
                    <h2 className="text-lg font-bold text-gray-900 truncate">{team.name}</h2>
                    <p className="text-[13px] text-gray-500 mt-0.5">Active Workspace Branch</p>
                    <div className="mt-2">
                      <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider ${getStatusColor(score)}`}>
                        {statusStr}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Compliance Bar */}
                <div className="px-6 pb-4">
                  <div className="flex justify-between mb-1.5">
                    <span className="text-xs font-semibold tracking-wider text-gray-500 uppercase">Compliance Score</span>
                    <span className="text-[14px] font-bold text-gray-900">{score}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div className={`h-full rounded-full ${getProgressBarColor(score)}`} style={{ width: `${score}%` }} />
                  </div>
                </div>

                {/* Stats Box */}
                <div className="px-6 pb-6">
                  <div className="bg-[#f3f3f5] rounded-xl p-3 grid grid-cols-3 gap-2 divide-x divide-gray-200/60">
                    {[
                      { icon: <Users size={14} />, label: 'Members', val: team.member_count || 0 },
                      { icon: <Clock size={14} />, label: 'Pending', val: team.pending_tasks || 0 },
                      { icon: <CheckCircle size={14} />, label: 'Done', val: team.completed_tasks || 0 },
                    ].map((stat) => (
                      <div key={stat.label} className="flex flex-col items-center">
                        <div className="flex items-center gap-1 text-gray-400 mb-1">{stat.icon}<span className="text-[10px] font-bold uppercase">{stat.label}</span></div>
                        <span className="text-[15px] font-bold text-gray-900">{stat.val}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-auto px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold ${pal.leadColor}`}>{leadInitials}</div>
                    <div>
                      <p className="text-[13px] font-bold text-gray-900 leading-none">{leadName}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">Lead</p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(`/teams/${team.id}`)}
                    className="text-[12px] font-bold text-gray-700 hover:text-blue-600 border border-gray-200 hover:border-blue-200 bg-white px-3 py-1.5 rounded-md flex items-center gap-1 transition-colors cursor-pointer shadow-sm"
                  >
                    View Team <ChevronRight size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── MODAL ── */}
      {isCreateModalOpen && (
        <CreateTeamModal
          onClose={() => setIsCreateModalOpen(false)}
          employees={employees}
          onTeamCreated={fetchData}
          branchId={user?.branch_id || undefined}
        />
      )}
    </div>
  );
};

export default Teams;
