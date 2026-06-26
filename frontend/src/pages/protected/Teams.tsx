import {
  ArrowLeftRight,
  CheckCircle,
  CheckSquare,
  ChevronRight,
  Clock,
  Plus,
  Search,
  UploadCloud,
  Users,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../contexts/AuthContext';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Team {
  id: string;
  name: string;
  initials: string;
  color: string;
  location: string;
  status: 'High Compliance' | 'Medium Compliance' | 'Needs Attention';
  score: number;
  members: number;
  pending: number;
  done: number;
  leadName: string;
  leadInitials: string;
  leadColor: string;
}

interface Employee {
  id: string;
  name: string;
  initials: string;
  color: string;
  role: string;
  department: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const TEAMS: Team[] = [
  { id: 't1', name: 'IT Security', initials: 'IS', color: 'bg-[#030213]', location: 'Bengaluru', status: 'High Compliance', score: 94, members: 12, pending: 4, done: 86, leadName: 'Rohit Pal', leadInitials: 'RP', leadColor: 'bg-indigo-600' },
  { id: 't2', name: 'Compliance', initials: 'CO', color: 'bg-emerald-600', location: 'Bengaluru', status: 'Medium Compliance', score: 81, members: 8, pending: 14, done: 62, leadName: 'Aisha Mehta', leadInitials: 'AM', leadColor: 'bg-[#030213]' },
  { id: 't3', name: 'Legal', initials: 'LE', color: 'bg-violet-600', location: 'Mumbai', status: 'High Compliance', score: 98, members: 5, pending: 2, done: 45, leadName: 'Sanya Gupta', leadInitials: 'SG', leadColor: 'bg-fuchsia-600' },
  { id: 't4', name: 'Risk Management', initials: 'RM', color: 'bg-rose-500', location: 'Bengaluru', status: 'Needs Attention', score: 65, members: 14, pending: 20, done: 29, leadName: 'Rahul Desai', leadInitials: 'RD', leadColor: 'bg-sky-600' },
  { id: 't5', name: 'Retail Banking', initials: 'RB', color: 'bg-amber-500', location: 'Bengaluru', status: 'High Compliance', score: 91, members: 22, pending: 0, done: 110, leadName: 'Vikram Nair', leadInitials: 'VN', leadColor: 'bg-emerald-600' },
];

const ALL_EMPLOYEES: Employee[] = [
  { id: 'e1', name: 'Vikram Nair', initials: 'VN', color: 'bg-emerald-600', role: 'Relationship Manager', department: 'Retail Banking' },
  { id: 'e2', name: 'Aisha Mehta', initials: 'AM', color: 'bg-[#030213]', role: 'Compliance Officer', department: 'Compliance' },
  { id: 'e3', name: 'Rahul Desai', initials: 'RD', color: 'bg-sky-600', role: 'Risk Operations Lead', department: 'Risk Management' },
  { id: 'e4', name: 'Priya Sharma', initials: 'PS', color: 'bg-rose-500', role: 'Compliance Associate', department: 'Compliance' },
  { id: 'e5', name: 'Rohit Pal', initials: 'RP', color: 'bg-indigo-600', role: 'IT Security Analyst', department: 'IT Security' },
  { id: 'e6', name: 'Neha Joshi', initials: 'NJ', color: 'bg-teal-600', role: 'Branch Manager', department: 'Management' },
  { id: 'e7', name: 'Karan Singh', initials: 'KS', color: 'bg-violet-600', role: 'Auditor', department: 'Audit' },
  { id: 'e8', name: 'Sanya Gupta', initials: 'SG', color: 'bg-fuchsia-600', role: 'Legal Advisor', department: 'Compliance' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getStatusColor = (status: Team['status']) => {
  switch (status) {
    case 'High Compliance': return 'text-emerald-700 bg-emerald-50 ring-1 ring-emerald-600/20';
    case 'Medium Compliance': return 'text-amber-700 bg-amber-50 ring-1 ring-amber-600/20';
    case 'Needs Attention': return 'text-rose-700 bg-rose-50 ring-1 ring-rose-600/20';
    default: return 'text-gray-700 bg-gray-50 ring-1 ring-gray-600/20';
  }
};

const getProgressBarColor = (score: number) => {
  if (score >= 90) return 'bg-emerald-500';
  if (score >= 75) return 'bg-amber-500';
  return 'bg-rose-500';
};

// ─── Create Team Modal ────────────────────────────────────────────────────────

const CreateTeamModal = ({ onClose }: { onClose: () => void }) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [teamName, setTeamName] = useState('');
  const [department, setDepartment] = useState('');
  const [branch, setBranch] = useState('');
  const [selectedLead, setSelectedLead] = useState<string | null>(null);
  const [memberSearch, setMemberSearch] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());

  const toggleMember = (id: string) => {
    setSelectedMembers((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const filteredEmployees = ALL_EMPLOYEES.filter((e) =>
    e.name.toLowerCase().includes(memberSearch.toLowerCase())
  );

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
              Step {step} of 2 — {step === 1 ? 'Team Details' : 'Select Members'}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-colors cursor-pointer">
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
                <input value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="e.g. Audit & Control" className="w-full h-10 px-3 rounded-lg border border-gray-200 bg-[#f9fafb] text-[14px] text-gray-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-gray-400" />
              </div>
              <div>
                <label className="block text-[12px] font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Department Type</label>
                <select value={department} onChange={(e) => setDepartment(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-gray-200 bg-[#f9fafb] text-[14px] text-gray-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all">
                  <option value="">Select department...</option>
                  <option>IT Security</option>
                  <option>Compliance</option>
                  <option>Legal</option>
                  <option>Risk Management</option>
                  <option>Retail Banking</option>
                  <option>Audit</option>
                </select>
              </div>
              <div>
                <label className="block text-[12px] font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Branch</label>
                <select value={branch} onChange={(e) => setBranch(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-gray-200 bg-[#f9fafb] text-[14px] text-gray-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all">
                  <option value="">Select branch...</option>
                  <option>Bengaluru — MG Road Branch</option>
                  <option>Mumbai — Fort Branch</option>
                  <option>Delhi — Connaught Place</option>
                  <option>Chennai — Anna Nagar</option>
                </select>
              </div>
              <div>
                <label className="block text-[12px] font-bold text-gray-600 mb-2 uppercase tracking-wide">Select Team Leader</label>
                <div className="grid grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1">
                  {ALL_EMPLOYEES.map((emp) => (
                    <button
                      key={emp.id}
                      onClick={() => setSelectedLead(emp.id)}
                      className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                        selectedLead === emp.id ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0 ${emp.color}`}>{emp.initials}</div>
                      <div className="min-w-0">
                        <p className="text-[12px] font-bold text-gray-900 truncate">{emp.name}</p>
                        <p className="text-[10px] text-gray-400 truncate">{emp.role}</p>
                      </div>
                      {selectedLead === emp.id && <CheckSquare size={13} className="ml-auto text-blue-600 shrink-0" />}
                    </button>
                  ))}
                </div>
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
                {filteredEmployees.map((emp) => (
                  <div
                    key={emp.id}
                    onClick={() => toggleMember(emp.id)}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedMembers.has(emp.id) ? 'border-blue-400 bg-blue-50' : 'border-gray-100 hover:bg-gray-50'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0 ${emp.color}`}>{emp.initials}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold text-gray-900">{emp.name}</p>
                      <p className="text-[11px] text-gray-400">{emp.role} · {emp.department}</p>
                    </div>
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      selectedMembers.has(emp.id) ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                    }`}>
                      {selectedMembers.has(emp.id) && <CheckSquare size={12} className="text-white" />}
                    </div>
                  </div>
                ))}
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
            <button onClick={() => setStep(1)} className="h-10 px-4 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-[13px] font-bold transition-colors cursor-pointer">
              ← Back
            </button>
          )}
          {step === 1 ? (
            <button
              onClick={() => setStep(2)}
              disabled={!teamName || !selectedLead}
              className="h-10 px-5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-[13px] font-bold transition-colors cursor-pointer"
            >
              Next: Add Members →
            </button>
          ) : (
            <button
              onClick={onClose}
              className="h-10 px-5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-bold transition-colors cursor-pointer"
            >
              Create Team
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
  const { isAdmin } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const filteredTeams = TEAMS.filter((team) =>
    team.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-[#f9fafb] font-sans text-gray-900">

      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Teams</h1>
          <p className="text-[14px] text-gray-500 mt-1">5 active teams · Bengaluru — MG Road Branch</p>
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
          { label: 'Total Teams', value: '5' },
          { label: 'Avg Compliance', value: '86%' },
          { label: 'Total Pending', value: '40' },
          { label: 'Total Completed', value: '222' },
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
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredTeams.map((team) => (
          <div key={team.id} className="relative bg-white/80 backdrop-blur-lg border border-white/50 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(79,70,229,0.1)] hover:border-indigo-500/20 flex flex-col overflow-hidden">

            {team.score >= 90 && <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-emerald-500" />}

            {/* Card Header */}
            <div className="p-6 pb-4 flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0 ${team.color}`}>
                {team.initials}
              </div>
              <div className="flex-1 min-w-0 pr-4">
                <h2 className="text-lg font-bold text-gray-900 truncate">{team.name}</h2>
                <p className="text-[13px] text-gray-500 mt-0.5">{team.name} · {team.location}</p>
                <div className="mt-2">
                  <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider ${getStatusColor(team.status)}`}>
                    {team.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Compliance Bar */}
            <div className="px-6 pb-4">
              <div className="flex justify-between mb-1.5">
                <span className="text-xs font-semibold tracking-wider text-gray-500 uppercase">Compliance Score</span>
                <span className="text-[14px] font-bold text-gray-900">{team.score}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                <div className={`h-full rounded-full ${getProgressBarColor(team.score)}`} style={{ width: `${team.score}%` }} />
              </div>
            </div>

            {/* Stats Box */}
            <div className="px-6 pb-6">
              <div className="bg-[#f3f3f5] rounded-xl p-3 grid grid-cols-3 gap-2 divide-x divide-gray-200/60">
                {[
                  { icon: <Users size={14} />, label: 'Members', val: team.members },
                  { icon: <Clock size={14} />, label: 'Pending', val: team.pending },
                  { icon: <CheckCircle size={14} />, label: 'Done', val: team.done },
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
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold ${team.leadColor}`}>{team.leadInitials}</div>
                <div>
                  <p className="text-[13px] font-bold text-gray-900 leading-none">{team.leadName}</p>
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
        ))}
      </div>

      {filteredTeams.length === 0 && (
        <div className="text-center py-20">
          <p className="text-[15px] text-gray-500">No teams found matching "{searchQuery}"</p>
        </div>
      )}

      {/* ── MODAL ── */}
      {isCreateModalOpen && <CreateTeamModal onClose={() => setIsCreateModalOpen(false)} />}
    </div>
  );
};

export default Teams;
