import {
  Check,
  CheckCircle,
  FileText,
  Lock,
  RefreshCw,
  ShieldAlert,
  TrendingUp,
  User,
  Users,
  X,
} from 'lucide-react';
import { useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ApprovalItem {
  id: string;
  title: string;
  employeeName: string;
  employeeId: string;
  branch: string;
  role: string;
  requestDate: string;
  type: 'AccessRequest' | 'TaskVerification' | 'PolicyReview';
  details: string;
  actionStatus: 'Pending' | 'Approved' | 'Rejected';
}

interface AlertItem {
  id: string;
  title: string;
  description: string;
  time: string;
  type: 'Regulation' | 'Rating' | 'Security' | 'Team';
  unread: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const INITIAL_APPROVALS: ApprovalItem[] = [
  {
    id: 'APR-842',
    title: 'Employee Access Request',
    employeeName: 'Priya Sharma',
    employeeId: 'EMP-9402',
    branch: 'Mumbai - Fort',
    role: 'Compliance Associate',
    requestDate: '2 hours ago',
    type: 'AccessRequest',
    details: 'New account approval required to access KYC repository and Action Points workflows.',
    actionStatus: 'Pending',
  },
  {
    id: 'APR-843',
    title: 'Task Completion Verification',
    employeeName: 'Vikram Nair',
    employeeId: 'EMP-1042',
    branch: 'Mumbai - Fort',
    role: 'Relationship Manager',
    requestDate: '4 hours ago',
    type: 'TaskVerification',
    details: 'Completed Task AP-1042: "Review KYC Documentation for High-Value Accounts". Manager sign-off requested.',
    actionStatus: 'Pending',
  },
  {
    id: 'APR-844',
    title: 'Internal Policy Review Publish Request',
    employeeName: 'Harshith',
    employeeId: 'EMP-2201',
    branch: 'Bengaluru - Whitefield',
    role: 'Branch Manager',
    requestDate: '1 day ago',
    type: 'PolicyReview',
    details: 'Proposed draft for "Internal Credit Risk & Underwriting Policy - FY26" requires regional compliance desk approval.',
    actionStatus: 'Pending',
  },
];

const INITIAL_ALERTS: AlertItem[] = [
  {
    id: 'ALT-701',
    title: 'New RBI Cyber Security Circular Published',
    description: 'Guidelines on Cyber Security Framework in Banks (RBI/2016-17/204) has been added to the documents library.',
    time: '3 hours ago',
    type: 'Regulation',
    unread: true,
  },
  {
    id: 'ALT-702',
    title: 'Branch Compliance Score Increased',
    description: 'Mumbai - Fort branch overall rating rose to 91% following completion of KYC review tasks.',
    time: '1 day ago',
    type: 'Rating',
    unread: true,
  },
  {
    id: 'ALT-703',
    title: 'Mandatory Firewall Configuration Update',
    description: 'IT Security requires all scheduling routers to perform configurations before the Q3 audits begin.',
    time: '2 days ago',
    type: 'Security',
    unread: false,
  },
  {
    id: 'ALT-704',
    title: 'Joint Audit Preparation Chat Formed',
    description: 'You were added to the "Internal Audit Prep FY26" workspace chat with Compliance team.',
    time: '3 days ago',
    type: 'Team',
    unread: false,
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getApprovalIcon = (type: ApprovalItem['type']) => {
  switch (type) {
    case 'AccessRequest':
      return (
        <div className="w-8 h-8 rounded-md bg-[#f3f3f5] text-[#030213] flex items-center justify-center border border-[rgba(0,0,0,0.1)]">
          <User size={16} />
        </div>
      );
    case 'TaskVerification':
      return (
        <div className="w-8 h-8 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
          <CheckCircle size={16} />
        </div>
      );
    case 'PolicyReview':
      return (
        <div className="w-8 h-8 rounded-md bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
          <FileText size={16} />
        </div>
      );
  }
};

const getAlertIcon = (type: AlertItem['type']) => {
  switch (type) {
    case 'Regulation':
      return (
        <div className="w-8 h-8 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0 border border-red-100/50">
          <ShieldAlert size={14} />
        </div>
      );
    case 'Rating':
      return (
        <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100/50">
          <TrendingUp size={14} />
        </div>
      );
    case 'Security':
      return (
        <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100/50">
          <Lock size={14} />
        </div>
      );
    case 'Team':
      return (
        <div className="w-8 h-8 rounded-full bg-[#f3f3f5] text-[#030213] flex items-center justify-center shrink-0 border border-[rgba(0,0,0,0.1)]/50">
          <Users size={14} />
        </div>
      );
  }
};

// ─── Main Component ───────────────────────────────────────────────────────────

const Notifications = () => {
  const [approvals, setApprovals] = useState<ApprovalItem[]>(INITIAL_APPROVALS);
  const [alerts, setAlerts] = useState<AlertItem[]>(INITIAL_ALERTS);
  const [activeTab, setActiveTab] = useState<'All' | 'Pending Approvals' | 'Updates & Alerts'>('All');

  // Count Unresolved Approvals
  const pendingApprovalsCount = approvals.filter((a) => a.actionStatus === 'Pending').length;
  // Count Unread Alerts
  const unreadAlertsCount = alerts.filter((a) => a.unread).length;

  // Handle Approvals Action
  const handleApprovalAction = (id: string, action: 'Approved' | 'Rejected') => {
    setApprovals((prev) =>
      prev.map((app) => (app.id === id ? { ...app, actionStatus: action } : app))
    );
  };

  // Reset Actions
  const handleResetApproval = (id: string) => {
    setApprovals((prev) =>
      prev.map((app) => (app.id === id ? { ...app, actionStatus: 'Pending' } : app))
    );
  };

  // Mark single alert as read
  const handleMarkAlertRead = (id: string) => {
    setAlerts((prev) =>
      prev.map((al) => (al.id === id ? { ...al, unread: false } : al))
    );
  };

  // Dismiss single alert
  const handleDismissAlert = (id: string) => {
    setAlerts((prev) => prev.filter((al) => al.id !== id));
  };

  // Mark all alerts as read
  const handleMarkAllRead = () => {
    setAlerts((prev) => prev.map((al) => ({ ...al, unread: false })));
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 font-sans min-h-screen">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Notifications</h1>
          <p className="text-[14px] text-gray-500 mt-1">
            Centralized center for branch approvals, employee requests, and regulation updates.
          </p>
        </div>
        {unreadAlertsCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[rgba(0,0,0,0.1)] hover:bg-[#f3f3f5] text-[12px] font-semibold text-gray-600 hover:text-gray-900 transition-colors shadow-sm self-start sm:self-center cursor-pointer"
          >
            Mark All Read
          </button>
        )}
      </div>

      {/* ── Tabs pill bar ── */}
      <div className="flex border-b border-[rgba(0,0,0,0.1)] gap-6">
        <button
          onClick={() => setActiveTab('All')}
          className={`pb-4 px-1 text-[14px] font-semibold transition-all relative cursor-pointer flex items-center gap-2 ${activeTab === 'All' ? 'text-gray-900 font-bold' : 'text-gray-500 hover:text-gray-900'
            }`}
        >
          All
          {(pendingApprovalsCount > 0 || unreadAlertsCount > 0) && (
            <span className="h-5 min-w-5 px-1.5 flex items-center justify-center text-[10px] font-bold rounded-full bg-gray-900 text-white shadow-xs">
              {pendingApprovalsCount + unreadAlertsCount}
            </span>
          )}
          {activeTab === 'All' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#030213]" />}
        </button>

        <button
          onClick={() => setActiveTab('Pending Approvals')}
          className={`pb-4 px-1 text-[14px] font-semibold transition-all relative cursor-pointer flex items-center gap-2 ${activeTab === 'Pending Approvals'
            ? 'text-gray-900 font-bold'
            : 'text-gray-500 hover:text-gray-900'
            }`}
        >
          Pending Approvals
          {pendingApprovalsCount > 0 && (
            <span className="h-5 min-w-5 px-1.5 flex items-center justify-center text-[10px] font-bold rounded-full bg-[#030213] text-white shadow-xs">
              {pendingApprovalsCount}
            </span>
          )}
          {activeTab === 'Pending Approvals' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#030213]" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('Updates & Alerts')}
          className={`pb-4 px-1 text-[14px] font-semibold transition-all relative cursor-pointer flex items-center gap-2 ${activeTab === 'Updates & Alerts'
            ? 'text-gray-900 font-bold'
            : 'text-gray-500 hover:text-gray-900'
            }`}
        >
          Updates & Alerts
          {unreadAlertsCount > 0 && (
            <span className="h-5 min-w-5 px-1.5 flex items-center justify-center text-[10px] font-bold rounded-full bg-amber-600 text-white shadow-xs">
              {unreadAlertsCount}
            </span>
          )}
          {activeTab === 'Updates & Alerts' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#030213]" />
          )}
        </button>
      </div>

      {/* ── Content Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Column 1: Pending Approvals */}
        {(activeTab === 'All' || activeTab === 'Pending Approvals') && (
          <div className={`${activeTab === 'All' ? 'lg:col-span-7' : 'lg:col-span-12'} space-y-4`}>
            <div className="flex items-center justify-between">
              <h2 className="text-[13px] font-bold uppercase text-gray-400 tracking-wider">
                Pending Approvals ({pendingApprovalsCount})
              </h2>
            </div>

            <div className="space-y-4">
              {approvals.length > 0 ? (
                approvals.map((app) => (
                  <div
                    key={app.id}
                    className={`bg-white rounded-md border border-[rgba(0,0,0,0.1)] shadow-sm p-5 space-y-4 transition-all relative overflow-hidden ${app.actionStatus !== 'Pending' ? 'opacity-85 border-gray-250 bg-[#f3f3f5]/20' : 'hover:border-gray-300'
                      }`}
                  >
                    {/* Header: Badge & Date */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getApprovalIcon(app.type)}
                        <span className="text-[12px] font-bold text-gray-500 uppercase tracking-wider">
                          {app.title}
                        </span>
                      </div>
                      <span className="text-[11px] font-medium text-gray-400">{app.requestDate}</span>
                    </div>

                    {/* Metadata Card Details */}
                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-2 bg-[#f3f3f5]/80 p-3 rounded-md border border-gray-150 text-[12px] font-medium">
                        <div>
                          <span className="text-gray-400 block text-[10px] font-bold uppercase tracking-wider mb-0.5">
                            Employee ID
                          </span>
                          <span className="text-gray-900 font-bold">{app.employeeName}</span>
                          <span className="text-gray-400 font-mono text-[10px] block mt-0.5">{app.employeeId}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 block text-[10px] font-bold uppercase tracking-wider mb-0.5">
                            Branch Code
                          </span>
                          <span className="text-gray-700 font-semibold">{app.branch}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 block text-[10px] font-bold uppercase tracking-wider mb-0.5">
                            Role Target
                          </span>
                          <span className="text-gray-700 font-semibold">{app.role}</span>
                        </div>
                      </div>

                      <p className="text-[13px] text-gray-500 leading-normal">
                        {app.details}
                      </p>
                    </div>

                    {/* Actions Panel */}
                    <div className="flex items-center justify-end gap-3 pt-2 border-t border-[rgba(0,0,0,0.1)]">
                      {app.actionStatus === 'Pending' ? (
                        <>
                          <button
                            onClick={() => handleApprovalAction(app.id, 'Rejected')}
                            className="inline-flex items-center gap-1.5 px-3 py-2 border border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 active:scale-98 text-[12px] font-bold rounded-md transition-all cursor-pointer"
                          >
                            Reject/Return
                          </button>
                          <button
                            onClick={() => handleApprovalAction(app.id, 'Approved')}
                            className="inline-flex items-center gap-1.5 px-4.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white active:scale-98 text-[12px] font-bold rounded-md transition-all cursor-pointer shadow-sm"
                          >
                            <Check size={14} />
                            Approve Access
                          </button>
                        </>
                      ) : (
                        <div className="flex items-center justify-between w-full">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold ${app.actionStatus === 'Approved'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-red-50 text-red-700 border border-red-200'
                              }`}
                          >
                            <CheckCircle size={14} />
                            {app.actionStatus === 'Approved' ? 'Approved & Access Granted' : 'Request Returned/Rejected'}
                          </span>
                          <button
                            onClick={() => handleResetApproval(app.id)}
                            className="text-[11px] text-gray-400 hover:text-gray-600 font-semibold underline flex items-center gap-1 cursor-pointer"
                          >
                            <RefreshCw size={10} />
                            Undo Decision
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-white rounded-md border border-[rgba(0,0,0,0.1)] p-8 text-center text-gray-400 text-[13px]">
                  No pending employee approval requests found.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Column 2: Updates & Alerts */}
        {(activeTab === 'All' || activeTab === 'Updates & Alerts') && (
          <div className={`${activeTab === 'All' ? 'lg:col-span-5' : 'lg:col-span-12'} space-y-4`}>
            <h2 className="text-[13px] font-bold uppercase text-gray-400 tracking-wider">
              Updates & Alerts ({unreadAlertsCount} Unread)
            </h2>

            <div className="space-y-3">
              {alerts.length > 0 ? (
                alerts.map((alert) => (
                  <div
                    key={alert.id}
                    onClick={() => handleMarkAlertRead(alert.id)}
                    className={`flex items-start gap-3 bg-white p-4 rounded-md border transition-all shadow-xs relative group cursor-pointer ${alert.unread ? 'border-amber-200/80 bg-amber-50/5/20' : 'border-[rgba(0,0,0,0.1)]'
                      }`}
                  >
                    {/* Left Icon */}
                    {getAlertIcon(alert.type)}

                    {/* Alert Text */}
                    <div className="space-y-0.5 flex-1 pr-6">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold text-gray-900 text-[13px] leading-tight">
                          {alert.title}
                        </h3>
                        {alert.unread && (
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                        )}
                      </div>
                      <p className="text-[12px] text-gray-500 leading-normal pr-2">
                        {alert.description}
                      </p>
                      <span className="text-[11px] text-gray-400 font-medium block mt-1">
                        {alert.time}
                      </span>
                    </div>

                    {/* Dismiss Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDismissAlert(alert.id);
                      }}
                      className="text-gray-300 hover:text-gray-500 hover:bg-gray-100 hover:border-gray-250 border border-transparent rounded-md p-1 transition-all opacity-0 group-hover:opacity-100 cursor-pointer absolute top-3 right-3"
                      aria-label="Dismiss alert"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))
              ) : (
                <div className="bg-white rounded-md border border-[rgba(0,0,0,0.1)] p-8 text-center text-gray-400 text-[13px]">
                  No active system alerts or notifications.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
