import {
  Calendar,
  CheckCircle,
  Clock,
  MessageSquare,
  Users,
  ShieldCheck,
  TrendingUp,
  ChevronDown,
} from 'lucide-react';
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TeamMember {
  name: string;
  role: string;
  avatar: string;
  avatarColor: string;
  online: boolean;
}

interface TeamTask {
  id: string;
  title: string;
  priority: 'High' | 'Medium' | 'Low';
  dueDate: string;
  status: 'Pending' | 'In Progress' | 'Completed';
}

interface TeamDetails {
  id: string;
  name: string;
  complianceRating: number;
  members: TeamMember[];
  tasks: TeamTask[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TEAMS_DATA: Record<string, TeamDetails> = {
  'it-security': {
    id: 'it-security',
    name: 'IT Security Team',
    complianceRating: 94,
    members: [
      { name: 'Arjun Mehta', role: 'IT Security Analyst', avatar: 'AM', avatarColor: 'bg-indigo-600', online: true },
      { name: 'Priya Sharma', role: 'Compliance Associate', avatar: 'PS', avatarColor: 'bg-rose-500', online: true },
      { name: 'Aisha Mehta', role: 'Compliance Officer', avatar: 'AM', avatarColor: 'bg-amber-600', online: true },
    ],
    tasks: [
      { id: 'TSK-101', title: 'Implement 2FA on Internal Portals', priority: 'High', dueDate: 'Tomorrow', status: 'Pending' },
      { id: 'TSK-102', title: 'Verify Firewall Configuration Logs', priority: 'High', dueDate: '28 Jun 2026', status: 'In Progress' },
      { id: 'TSK-103', title: 'Complete Cyber Security Audit Report', priority: 'Medium', dueDate: '02 Jul 2026', status: 'Pending' },
    ],
  },
  'compliance-core': {
    id: 'compliance-core',
    name: 'Compliance Core',
    complianceRating: 89,
    members: [
      { name: 'Priya Sharma', role: 'Compliance Associate', avatar: 'PS', avatarColor: 'bg-rose-500', online: true },
      { name: 'Aisha Mehta', role: 'Compliance Officer', avatar: 'AM', avatarColor: 'bg-amber-600', online: true },
      { name: 'Vikram Nair', role: 'Relationship Manager', avatar: 'VN', avatarColor: 'bg-emerald-600', online: true },
    ],
    tasks: [
      { id: 'TSK-201', title: 'Update Branch AML Procedures', priority: 'Medium', dueDate: '24 Jun 2026', status: 'Pending' },
      { id: 'TSK-202', title: 'Review KYC Documentation', priority: 'High', dueDate: 'Today', status: 'In Progress' },
      { id: 'TSK-203', title: 'Verify Suspicious Activity Reports (SAR)', priority: 'High', dueDate: '30 Jun 2026', status: 'Pending' },
    ],
  },
  'fort-general': {
    id: 'fort-general',
    name: 'Fort Branch General',
    complianceRating: 75,
    members: [
      { name: 'Vikram Nair', role: 'Relationship Manager', avatar: 'VN', avatarColor: 'bg-emerald-600', online: true },
      { name: 'Harshith', role: 'Branch Manager', avatar: 'HK', avatarColor: 'bg-violet-600', online: false },
      { name: 'Rahul Desai', role: 'Risk Operations Lead', avatar: 'RD', avatarColor: 'bg-sky-600', online: false },
    ],
    tasks: [
      { id: 'TSK-301', title: 'Employee Training: Phishing Awareness', priority: 'Low', dueDate: '15 Jul 2026', status: 'Pending' },
      { id: 'TSK-302', title: 'Clean Desk Policy Audit', priority: 'Medium', dueDate: '30 Jun 2026', status: 'Pending' },
      { id: 'TSK-303', title: 'Quarterly Safety Drills Certification', priority: 'Low', dueDate: '20 Jul 2026', status: 'Completed' },
    ],
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getPriorityColor = (priority: TeamTask['priority']) => {
  switch (priority) {
    case 'High':
      return 'bg-red-50 text-red-700 ring-red-650/15';
    case 'Medium':
      return 'bg-amber-50 text-amber-700 ring-amber-650/15';
    case 'Low':
      return 'bg-emerald-50 text-emerald-700 ring-emerald-650/15';
  }
};

const getStatusColor = (status: TeamTask['status']) => {
  switch (status) {
    case 'Pending':
      return 'text-gray-500 bg-gray-50 border-gray-200';
    case 'In Progress':
      return 'text-indigo-700 bg-indigo-50 border-indigo-200';
    case 'Completed':
      return 'text-emerald-700 bg-emerald-50 border-emerald-200';
  }
};

// ─── Main Component ───────────────────────────────────────────────────────────

const TeamWorkspace = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Fallback to 'it-security' if route teamId is invalid or not specified
  const activeTeamId = teamId && TEAMS_DATA[teamId] ? teamId : 'it-security';
  const team = TEAMS_DATA[activeTeamId];

  const [tasks, setTasks] = useState<Record<string, TeamTask[]>>({
    'it-security': TEAMS_DATA['it-security'].tasks,
    'compliance-core': TEAMS_DATA['compliance-core'].tasks,
    'fort-general': TEAMS_DATA['fort-general'].tasks,
  });

  const toggleTaskState = (taskId: string) => {
    setTasks((prev) => {
      const currentTasks = prev[activeTeamId];
      const updated = currentTasks.map((t) => {
        if (t.id === taskId) {
          return {
            ...t,
            status: t.status === 'Completed' ? 'Pending' : 'Completed',
          } as TeamTask;
        }
        return t;
      });
      return {
        ...prev,
        [activeTeamId]: updated,
      };
    });
  };

  const handleTeamChange = (newTeamId: string) => {
    navigate(`/teams/${newTeamId}`);
    setDropdownOpen(false);
  };

  const currentTeamTasks = tasks[activeTeamId];
  const complianceScore = team.complianceRating;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 font-sans min-h-screen">
      {/* ── Top Header Panel ── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Team Dropdown Selector */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen((v) => !v)}
              className="inline-flex items-center gap-2 text-2xl font-bold text-gray-900 tracking-tight hover:text-indigo-600 transition-colors cursor-pointer outline-none"
            >
              {team.name}
              <ChevronDown size={20} className="text-gray-400 mt-1" />
            </button>
            <p className="text-[14px] text-gray-500 mt-1">Branch specific team workspace dashboard.</p>

            {dropdownOpen && (
              <div className="absolute left-0 mt-2 w-64 bg-white rounded-lg border border-gray-200 shadow-lg z-10 py-1">
                {Object.values(TEAMS_DATA).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleTeamChange(item.id)}
                    className={`w-full px-4 py-2.5 text-left text-[14px] font-semibold transition-colors cursor-pointer block hover:bg-gray-50 ${
                      activeTeamId === item.id ? 'text-indigo-600 bg-indigo-50/40' : 'text-gray-700'
                    }`}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Member count & Quick Badge */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-[12px] font-bold text-gray-600">
              <Users size={14} className="text-gray-400" />
              {team.members.length} Members
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-100 text-[12px] font-bold text-indigo-600">
              <ShieldCheck size={14} />
              Active Workspace
            </div>
          </div>
        </div>

        {/* Compliance Progress Bar Section */}
        <div className="space-y-2 border-t border-gray-100 pt-6">
          <div className="flex justify-between items-center text-[13px] font-bold">
            <span className="text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp size={14} className="text-gray-400" />
              Overall Team Compliance rating
            </span>
            <span className="text-gray-900 text-[15px]">{complianceScore}%</span>
          </div>
          <div className="w-full bg-gray-150 h-3 rounded-full overflow-hidden shadow-inner relative">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${
                complianceScore >= 90
                  ? 'bg-emerald-500'
                  : complianceScore >= 80
                  ? 'bg-indigo-500'
                  : 'bg-amber-500'
              }`}
              style={{ width: `${complianceScore}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── Two Column Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Column 1: Team Members */}
        <div className="lg:col-span-5 space-y-4">
          <h2 className="text-[13px] font-bold uppercase text-gray-400 tracking-wider">
            Team Members ({team.members.length})
          </h2>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 divide-y divide-gray-100">
            {team.members.map((member) => (
              <div key={member.name} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3">
                  {/* Initials and status dot */}
                  <div className="relative shrink-0">
                    <div className={`w-10 h-10 rounded-full ${member.avatarColor} text-white flex items-center justify-center font-bold text-sm shadow-inner`}>
                      {member.avatar}
                    </div>
                    <span
                      className={`absolute bottom-0.5 right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${
                        member.online ? 'bg-emerald-500' : 'bg-gray-300'
                      }`}
                    />
                  </div>

                  <div>
                    <h4 className="text-[14px] font-bold text-gray-900">{member.name}</h4>
                    <p className="text-[12px] text-gray-500 font-medium">{member.role}</p>
                  </div>
                </div>

                <button className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500 hover:text-gray-900 transition-colors cursor-pointer">
                  <MessageSquare size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Column 2: Task Tracker Sidebar */}
        <div className="lg:col-span-7 space-y-4">
          <h2 className="text-[13px] font-bold uppercase text-gray-400 tracking-wider">
            Task Tracker Action Points
          </h2>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between pb-3.5 border-b border-gray-100">
              <span className="text-[13px] text-gray-500 font-semibold">Active checklist</span>
              <span className="text-[12px] text-indigo-600 bg-indigo-50/70 border border-indigo-100/50 px-2 py-0.5 rounded font-bold font-mono">
                {currentTeamTasks.filter((t) => t.status === 'Completed').length} / {currentTeamTasks.length} Done
              </span>
            </div>

            <div className="space-y-3">
              {currentTeamTasks.length > 0 ? (
                currentTeamTasks.map((t) => {
                  const isCompleted = t.status === 'Completed';
                  return (
                    <div
                      key={t.id}
                      className={`p-4 rounded-xl border transition-all flex items-start justify-between gap-4 ${
                        isCompleted ? 'bg-gray-50/40 border-gray-200 opacity-80' : 'bg-white border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Checkbox */}
                        <button
                          onClick={() => toggleTaskState(t.id)}
                          className={`mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                            isCompleted
                              ? 'bg-emerald-500 border-emerald-500 text-white'
                              : 'border-gray-350 bg-white hover:border-emerald-500'
                          }`}
                        >
                          {isCompleted && <CheckCircle size={14} className="stroke-[3]" />}
                        </button>

                        <div className="space-y-1">
                          <h4 className={`text-[13.5px] font-bold leading-snug ${
                            isCompleted ? 'text-gray-500 line-through' : 'text-gray-900'
                          }`}>
                            {t.title}
                          </h4>
                          <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-gray-400 font-mono">
                            <span>ID: {t.id}</span>
                            <span className="text-gray-300">•</span>
                            <span className={`inline-flex items-center px-1.5 py-0.2 rounded text-[10px] ${getPriorityColor(t.priority)}`}>
                              {t.priority} Priority
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Due Date or status */}
                      <div className="shrink-0 flex flex-col items-end gap-1.5 text-right">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] border ${getStatusColor(t.status)}`}>
                          {t.status === 'In Progress' && <Clock size={10} />}
                          {t.status}
                        </span>
                        <span className="text-[11px] text-gray-400 font-medium flex items-center gap-1">
                          <Calendar size={10} />
                          {t.dueDate}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center text-gray-400 py-8 text-[13px]">
                  No tasks assigned to this workspace yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamWorkspace;
