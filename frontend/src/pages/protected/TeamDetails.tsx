import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  ExternalLink,
  Mail,
  Users,
  X,
  AlertTriangle,
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';

// ─── Mock Data ────────────────────────────────────────────────────────────────

const TEAM_MEMBERS = [
  { id: 'm1', name: 'Rohit Pal', initials: 'RP', color: 'bg-indigo-600', role: 'IT Security Analyst', isLead: true, online: true },
  { id: 'm2', name: 'Aisha Mehta', initials: 'AM', color: 'bg-[#030213]', role: 'Compliance Officer', isLead: false, online: true },
  { id: 'm3', name: 'Karan Singh', initials: 'KS', color: 'bg-violet-600', role: 'Auditor', isLead: false, online: false },
  { id: 'm4', name: 'Priya Sharma', initials: 'PS', color: 'bg-rose-500', role: 'Compliance Associate', isLead: false, online: true },
  { id: 'm5', name: 'Rahul Desai', initials: 'RD', color: 'bg-sky-600', role: 'Risk Ops Lead', isLead: false, online: false },
  { id: 'm6', name: 'Vikram Nair', initials: 'VN', color: 'bg-emerald-600', role: 'Relationship Manager', isLead: false, online: true },
];

const TASKS = [
  { id: 'tk1', title: 'Conduct re-KYC for dormant accounts', status: 'IN PROGRESS', priority: 'High', due: '28 Jun 2026', assignee: 'Priya Sharma' },
  { id: 'tk2', title: 'Review RBI Circular 2026/04 Compliance', status: 'DONE', priority: 'Medium', due: '20 Jun 2026', assignee: 'Rohit Pal' },
  { id: 'tk3', title: 'Update AML Policy documentation', status: 'DONE', priority: 'High', due: '18 Jun 2026', assignee: 'Aisha Mehta' },
  { id: 'tk4', title: 'Firewall policy review — Q2 Audit', status: 'IN PROGRESS', priority: 'Medium', due: '02 Jul 2026', assignee: 'Karan Singh' },
  { id: 'tk5', title: 'Submit branch quarterly compliance report', status: 'IN PROGRESS', priority: 'High', due: '30 Jun 2026', assignee: 'Rahul Desai' },
];

const NEW_LEADERS = [
  { id: 'nl1', name: 'Aisha Mehta', initials: 'AM', color: 'bg-[#030213]', role: 'Compliance Officer' },
  { id: 'nl2', name: 'Vikram Nair', initials: 'VN', color: 'bg-emerald-600', role: 'Relationship Manager' },
  { id: 'nl3', name: 'Karan Singh', initials: 'KS', color: 'bg-violet-600', role: 'Auditor' },
];

// ─── Transfer Modal ────────────────────────────────────────────────────────────

const TransferModal = ({ onClose }: { onClose: () => void }) => {
  const [selectedNewLead, setSelectedNewLead] = useState<string | null>(null);
  const [reason, setReason] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h2 className="text-[17px] font-bold text-gray-900">Transfer Leadership</h2>
            <p className="text-[12px] text-gray-500 mt-0.5">IT Security Team</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-colors cursor-pointer">
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Current Leader Warning */}
          <div className="flex items-center gap-3 p-3.5 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white text-[11px] font-bold shrink-0">RP</div>
            <div>
              <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wider mb-0.5">Current Team Leader</p>
              <p className="text-[13px] font-bold text-gray-900">Rohit Pal</p>
              <p className="text-[12px] text-gray-500">IT Security Analyst</p>
            </div>
            <AlertTriangle size={16} className="ml-auto text-amber-500 shrink-0" />
          </div>

          {/* Select New Leader */}
          <div>
            <label className="block text-[12px] font-bold text-gray-600 mb-2 uppercase tracking-wide">Select New Team Leader</label>
            <div className="space-y-2">
              {NEW_LEADERS.map((lead) => (
                <button
                  key={lead.id}
                  onClick={() => setSelectedNewLead(lead.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all cursor-pointer ${
                    selectedNewLead === lead.id ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0 ${lead.color}`}>{lead.initials}</div>
                  <div className="flex-1">
                    <p className="text-[13px] font-bold text-gray-900">{lead.name}</p>
                    <p className="text-[11px] text-gray-400">{lead.role}</p>
                  </div>
                  {selectedNewLead === lead.id && <CheckCircle2 size={16} className="text-blue-600" />}
                </button>
              ))}
            </div>
          </div>

          {/* Reason Textarea */}
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

          {/* Warning */}
          <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-100 rounded-lg">
            <AlertTriangle size={14} className="text-rose-500 mt-0.5 shrink-0" />
            <p className="text-[12px] text-rose-700 font-medium leading-relaxed">
              This action will notify your Branch Manager and the new Team Lead immediately. It cannot be reversed without admin approval.
            </p>
          </div>
        </div>

        <div className="px-6 pb-6 flex justify-end gap-3">
          <button onClick={onClose} className="h-10 px-4 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-[13px] font-bold transition-colors cursor-pointer">
            Cancel
          </button>
          <button onClick={() => alert('Route connected: Action')} 
            disabled={!selectedNewLead || !reason.trim()}
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
  const wsId = teamId ?? 'it-security';
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

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
            <div className="w-14 h-14 rounded-xl bg-[#030213] flex items-center justify-center text-white font-bold text-xl shadow">IS</div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900">IT Security Team</h1>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 uppercase tracking-wider">Active</span>
              </div>
              <p className="text-[13px] text-gray-500 mt-0.5">Bengaluru — MG Road Branch · 6 members</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsTransferModalOpen(true)}
              className="h-10 px-4 rounded-md border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-700 text-[13px] font-bold flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Users size={15} />
              Transfer Leadership
            </button>
            <button
              onClick={() => navigate(`/teams/${wsId}/workspace`)}
              className="h-10 px-4 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-bold flex items-center gap-2 transition-colors cursor-pointer shadow-sm"
            >
              <ExternalLink size={15} />
              Open Workspace
            </button>
          </div>
        </div>
      </div>

      {/* ── METRICS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Members', value: '6', color: 'text-blue-600', bg: 'bg-blue-50', icon: <Users size={18} className="text-blue-400" /> },
          { label: 'Compliance', value: '94%', color: 'text-emerald-600', bg: 'bg-emerald-50', icon: <CheckCircle2 size={18} className="text-emerald-400" /> },
          { label: 'Pending Tasks', value: '4', color: 'text-amber-600', bg: 'bg-amber-50', icon: <Clock size={18} className="text-amber-400" /> },
          { label: 'Completed', value: '86', color: 'text-violet-600', bg: 'bg-violet-50', icon: <CheckCircle2 size={18} className="text-violet-400" /> },
        ].map((m) => (
          <div key={m.label} className={`rounded-xl border border-[rgba(0,0,0,0.05)] shadow-sm p-5 bg-white`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide">{m.label}</span>
              <div className={`w-8 h-8 rounded-lg ${m.bg} flex items-center justify-center`}>{m.icon}</div>
            </div>
            <span className={`text-3xl font-extrabold ${m.color}`}>{m.value}</span>
          </div>
        ))}
      </div>

      {/* Full-width Compliance Progress */}
      <div className="bg-white rounded-xl border border-[rgba(0,0,0,0.05)] shadow-sm p-5">
        <div className="flex justify-between mb-2">
          <span className="text-[13px] font-bold text-gray-700">Overall Compliance Score</span>
          <span className="text-[13px] font-bold text-gray-900">94%</span>
        </div>
        <div className="w-full h-3 rounded-full bg-gray-100 overflow-hidden">
          <div className="h-full rounded-full bg-blue-600" style={{ width: '94%' }} />
        </div>
        <p className="text-[12px] text-gray-400 mt-2">Based on 90 completed regulatory tasks across Q2 2026.</p>
      </div>

      {/* ── 2-COLUMN LAYOUT ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Left: Team Members */}
        <div className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-[15px] font-bold text-gray-900">Team Members ({TEAM_MEMBERS.length})</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {TEAM_MEMBERS.map((member) => (
              <div key={member.id} className="px-6 py-4 flex items-center gap-3">
                <div className="relative shrink-0">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-[12px] font-bold ${member.color}`}>
                    {member.initials}
                  </div>
                  <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${member.online ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[14px] font-bold text-gray-900">{member.name}</p>
                    {member.isLead && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-700 border border-amber-200 uppercase tracking-wider">Lead</span>
                    )}
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${member.online ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                      {member.online ? 'Active' : 'Offline'}
                    </span>
                  </div>
                  <p className="text-[12px] text-gray-400 mt-0.5">{member.role}</p>
                </div>
                <button onClick={() => alert('Route connected: Action')}  className="w-8 h-8 rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center justify-center text-gray-400 transition-colors cursor-pointer">
                  <Mail size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Task Tracker */}
        <div className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-[15px] font-bold text-gray-900">Task Tracker</h2>
            <span className="text-[12px] font-semibold text-gray-400">{TASKS.length} tasks</span>
          </div>
          <div className="divide-y divide-gray-50">
            {TASKS.map((task) => (
              <div
                key={task.id}
                onClick={() => navigate('/task-detail')}
                className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors group"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[13px] font-semibold text-gray-900 leading-snug group-hover:text-blue-600 transition-colors">{task.title}</p>
                  <span className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                    task.status === 'DONE'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                      : 'bg-blue-50 text-blue-700 border-blue-100'
                  }`}>
                    {task.status}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="text-[11px] text-gray-400">Due: {task.due}</span>
                  <span className="text-[11px] text-gray-400">·</span>
                  <span className="text-[11px] text-gray-400">{task.assignee}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {isTransferModalOpen && <TransferModal onClose={() => setIsTransferModalOpen(false)} />}
    </div>
  );
};

export default TeamDetails;
