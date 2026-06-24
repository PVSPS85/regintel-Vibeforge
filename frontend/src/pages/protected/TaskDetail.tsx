import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Download,
  FileSpreadsheet,
  FileText,
  MessageSquare,
  Send,
  Upload,
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';

// ─── Mock Data ────────────────────────────────────────────────────────────────

const ATTACHMENTS = [
  { id: 'a1', name: 'KYC_Dormant_Accounts_List_Q2.pdf', size: '1.8 MB', type: 'PDF', uploadedBy: 'Priya Sharma', uploadedAt: '22 Jun 2026' },
  { id: 'a2', name: 'Re-KYC_Process_Guidelines_RBI.pdf', size: '3.2 MB', type: 'PDF', uploadedBy: 'Rohit Pal', uploadedAt: '20 Jun 2026' },
  { id: 'a3', name: 'Account_Activity_Tracker.xlsx', size: '540 KB', type: 'XLSX', uploadedBy: 'Aisha Mehta', uploadedAt: '19 Jun 2026' },
];

const COMMENTS = [
  { id: 'c1', name: 'Rohit Pal', initials: 'RP', color: 'bg-indigo-600', text: 'The dormant accounts list has been cross-referenced with our CIF database. 214 accounts need immediate re-KYC documentation.', time: '22 Jun, 9:42 AM' },
  { id: 'c2', name: 'Priya Sharma', initials: 'PS', color: 'bg-rose-500', text: 'Uploaded the updated list. Please review the flagged entries in column G — those need branch manager sign-off before proceeding.', time: '22 Jun, 11:15 AM' },
  { id: 'c3', name: 'Aisha Mehta', initials: 'AM', color: 'bg-[#030213]', text: 'I\'ve reviewed the RBI guidelines. We need to complete re-KYC within 30 days or flag accounts for freezing. This is Priority 1.', time: 'Today, 9:00 AM' },
];

const HISTORY = [
  { id: 'h1', event: 'Task created', actor: 'Rohit Pal', time: '18 Jun 2026 · 10:00 AM', icon: <CheckCircle2 size={13} className="text-blue-500" /> },
  { id: 'h2', event: 'Assigned to Priya Sharma', actor: 'Rohit Pal', time: '18 Jun 2026 · 10:05 AM', icon: <CheckCircle2 size={13} className="text-purple-500" /> },
  { id: 'h3', event: 'Status changed to In Progress', actor: 'Priya Sharma', time: '20 Jun 2026 · 9:30 AM', icon: <Clock size={13} className="text-amber-500" /> },
  { id: 'h4', event: 'Attachment added: KYC_Dormant_Accounts_List_Q2.pdf', actor: 'Priya Sharma', time: '22 Jun 2026 · 11:15 AM', icon: <FileText size={13} className="text-emerald-500" /> },
];

// ─── Main Component ────────────────────────────────────────────────────────────

const TaskDetail = () => {
  const navigate = useNavigate();
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState(COMMENTS);

  const handleSendComment = () => {
    const trimmed = comment.trim();
    if (!trimmed) return;
    setComments((prev) => [
      ...prev,
      {
        id: `c${Date.now()}`,
        name: 'You',
        initials: 'AM',
        color: 'bg-gray-700',
        text: trimmed,
        time: 'Just now',
      },
    ]);
    setComment('');
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#f9fafb] font-sans text-gray-900">

      {/* ── HEADER ── */}
      <div>
        <button
          onClick={() => navigate('/team-workspace')}
          className="flex items-center gap-1.5 text-[13px] text-gray-500 hover:text-gray-800 font-semibold mb-4 transition-colors cursor-pointer"
        >
          <ArrowLeft size={15} />
          Back to Workspace
        </button>

        <div className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] shadow-sm p-6">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="px-2.5 py-1 rounded-md border text-[11px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border-rose-100">High Priority</span>
            <span className="px-2.5 py-1 rounded-md border text-[11px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border-blue-100">In Progress</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 leading-snug max-w-2xl">
            Conduct re-KYC for all dormant accounts flagged in Q2 2026 audit report
          </h1>
          <p className="text-[13px] text-gray-500 mt-2">IT Security Team · Bengaluru — MG Road Branch · Due 28 Jun 2026</p>

          <div className="mt-5">
            <div className="flex justify-between mb-1.5">
              <span className="text-[12px] font-semibold text-gray-500">Completion Progress</span>
              <span className="text-[12px] font-bold text-gray-900">60%</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-gray-100 overflow-hidden">
              <div className="h-full rounded-full bg-blue-600" style={{ width: '60%' }} />
            </div>
          </div>
        </div>
      </div>

      {/* ── 2-COLUMN CONTENT GRID ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── LEFT COL (main) ── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Attachments */}
          <div className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-[15px] font-bold text-gray-900">Attachments ({ATTACHMENTS.length})</h2>
              <button className="h-8 px-3 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer">
                <Upload size={13} />
                Upload
              </button>
            </div>
            <div className="p-4 space-y-3">
              {ATTACHMENTS.map((file) => (
                <div key={file.id} className="flex items-center gap-3.5 p-3.5 bg-[#f9fafb] rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${file.type === 'PDF' ? 'bg-red-50' : 'bg-emerald-50'}`}>
                    {file.type === 'PDF'
                      ? <FileText size={20} className="text-red-500" />
                      : <FileSpreadsheet size={20} className="text-emerald-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-gray-900 truncate">{file.name}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{file.size} · {file.type} · Uploaded by {file.uploadedBy} · {file.uploadedAt}</p>
                  </div>
                  <button className="flex items-center gap-1.5 text-[12px] font-bold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer shrink-0">
                    <Download size={13} />
                    Download
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Comments */}
          <div className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <MessageSquare size={16} className="text-gray-400" />
              <h2 className="text-[15px] font-bold text-gray-900">Comments ({comments.length})</h2>
            </div>
            <div className="p-4 space-y-4">
              {comments.map((c) => (
                <div key={c.id} className="flex gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0 ${c.color}`}>{c.initials}</div>
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-[13px] font-bold text-gray-900">{c.name}</span>
                      <span className="text-[11px] text-gray-400">{c.time}</span>
                    </div>
                    <p className="text-[13px] text-gray-700 leading-relaxed">{c.text}</p>
                  </div>
                </div>
              ))}
            </div>
            {/* Comment Input */}
            <div className="px-4 pb-4 pt-2 border-t border-gray-50">
              <div className="flex items-center gap-2 bg-[#f3f3f5] rounded-full px-4 py-2 border border-gray-200 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-white text-[9px] font-bold shrink-0">AM</div>
                <input
                  type="text"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSendComment(); }}
                  placeholder="Write a comment..."
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

        {/* ── RIGHT COL (sidebar) ── */}
        <div className="space-y-5">

          {/* Task Details */}
          <div className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] shadow-sm p-5">
            <h3 className="text-[14px] font-bold text-gray-900 mb-4">Task Details</h3>
            <div className="space-y-3.5">
              {[
                { label: 'Regulation Ref', value: 'RBI/2026/KYC-04', highlight: false },
                { label: 'Deadline', value: '28 Jun 2026 · 4 days left', highlight: true },
                { label: 'Branch', value: 'Bengaluru — MG Road', highlight: false },
                { label: 'Assigned Team', value: 'IT Security', highlight: false },
              ].map((detail) => (
                <div key={detail.label}>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">{detail.label}</p>
                  <p className={`text-[13px] font-semibold ${detail.highlight ? 'text-amber-600' : 'text-gray-800'}`}>{detail.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Assigned To */}
          <div className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] shadow-sm p-5">
            <h3 className="text-[14px] font-bold text-gray-900 mb-3">Assigned To</h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-500 flex items-center justify-center text-white text-[12px] font-bold shrink-0">PS</div>
              <div>
                <p className="text-[14px] font-bold text-gray-900">Priya Sharma</p>
                <p className="text-[11px] text-gray-400">Compliance Associate · IT Security</p>
              </div>
            </div>
          </div>

          {/* Completion Request */}
          <div className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] shadow-sm p-5">
            <h3 className="text-[14px] font-bold text-gray-900 mb-3">Completion Request</h3>
            <p className="text-[12px] text-gray-500 mb-3">Submit a completion request once all re-KYC documents are collected and verified.</p>
            <button className="w-full h-10 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[13px] font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm">
              <CheckCircle2 size={15} />
              Request Completion
            </button>
          </div>

          {/* Task History */}
          <div className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] shadow-sm p-5">
            <h3 className="text-[14px] font-bold text-gray-900 mb-4">Task History</h3>
            <div className="relative">
              <div className="absolute left-[11px] top-2 bottom-2 w-px bg-gray-100" />
              <div className="space-y-4">
                {HISTORY.map((h) => (
                  <div key={h.id} className="flex items-start gap-3 relative">
                    <div className="w-6 h-6 rounded-full bg-white border-2 border-gray-100 flex items-center justify-center shrink-0 z-10">{h.icon}</div>
                    <div>
                      <p className="text-[12px] font-semibold text-gray-800 leading-snug">{h.event}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">by {h.actor}</p>
                      <p className="text-[11px] text-gray-400">{h.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDetail;
