import {
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  ChevronRight,
  Clock,
  MapPin,
  Send,
  User,
  X,
} from 'lucide-react';
import { useState } from 'react';

// ─── Types ─────────────────────────────────────────────────────────────────────

type Step = 'form' | 'submitted' | 'success';

interface BranchInfo {
  code: string;
  name: string;
  city: string;
  manager: string;
  managerInitials: string;
  managerColor: string;
  employees: number;
  teams: number;
  compliance: number;
}

// ─── Branch Database ────────────────────────────────────────────────────────────

const BRANCH_DB: Record<string, BranchInfo> = {
  blr001: {
    code: 'blr001',
    name: 'MG Road Branch',
    city: 'Bengaluru',
    manager: 'Priya Sharma',
    managerInitials: 'PS',
    managerColor: 'bg-rose-500',
    employees: 42,
    teams: 6,
    compliance: 91,
  },
  del002: {
    code: 'del002',
    name: 'Connaught Place Branch',
    city: 'Delhi',
    manager: 'Vikram Nair',
    managerInitials: 'VN',
    managerColor: 'bg-emerald-600',
    employees: 38,
    teams: 5,
    compliance: 88,
  },
  mum003: {
    code: 'mum003',
    name: 'Andheri Branch',
    city: 'Mumbai',
    manager: 'Rohit Pal',
    managerInitials: 'RP',
    managerColor: 'bg-indigo-600',
    employees: 55,
    teams: 8,
    compliance: 94,
  },
  che004: {
    code: 'che004',
    name: 'T. Nagar Branch',
    city: 'Chennai',
    manager: 'Aisha Mehta',
    managerInitials: 'AM',
    managerColor: 'bg-[#030213]',
    employees: 29,
    teams: 4,
    compliance: 85,
  },
  474747: {
    code: '474747',
    name: 'Fort Branch',
    city: 'Mumbai',
    manager: 'Harshith Kumar',
    managerInitials: 'HK',
    managerColor: 'bg-violet-600',
    employees: 61,
    teams: 9,
    compliance: 96,
  },
};

// ─── Transfer Reasons ───────────────────────────────────────────────────────────

const REASONS = [
  { id: 'r1', label: 'Personal Relocation', desc: 'Moving to a new city for personal reasons' },
  { id: 'r2', label: 'Career Growth', desc: 'Better career opportunities at the target branch' },
  { id: 'r3', label: 'Family Emergency', desc: 'Need to be closer to family for urgent reasons' },
  { id: 'r4', label: 'Medical Reasons', desc: 'Health-related requirement for transfer' },
  { id: 'r5', label: 'Team Requirements', desc: 'Skill requirement at target branch location' },
  { id: 'r6', label: 'Other', desc: 'Other reason — provide details below' },
];

// ─── Component ─────────────────────────────────────────────────────────────────

export default function BranchTransfer() {
  const [step, setStep] = useState<Step>('form');
  const [branchCode, setBranchCode] = useState('');
  const [targetBranch, setTargetBranch] = useState<BranchInfo | null>(null);
  const [branchError, setBranchError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // ── Verify Branch Code ─────────────────────────────────────────────────────────

  const verifyBranch = () => {
    if (!branchCode.trim()) return;
    setVerifying(true);
    setBranchError('');
    setTargetBranch(null);

    setTimeout(() => {
      const found = BRANCH_DB[branchCode.toLowerCase().trim()];
      if (found) {
        setTargetBranch(found);
        setBranchError('');
      } else {
        setBranchError(`Branch code "${branchCode}" not recognized. Try: blr001, del002, mum003, che004, or 474747`);
      }
      setVerifying(false);
    }, 800);
  };

  // ── Submit ─────────────────────────────────────────────────────────────────────

  const handleSubmit = () => {
    if (!targetBranch || !selectedReason) return;
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setStep('success');
    }, 1600);
  };

  const canSubmit = targetBranch && selectedReason;

  // ─── Success Screen ─────────────────────────────────────────────────────────────

  if (step === 'success') {
    const reason = REASONS.find((r) => r.id === selectedReason);
    return (
      <div className="flex flex-col h-full w-full bg-white items-center justify-center p-12">
        <div className="max-w-lg w-full text-center">
          {/* Success Icon */}
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} className="text-emerald-600" />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">Transfer Request Submitted</h2>
          <p className="text-gray-500 text-sm mb-8">
            Your request has been sent to the branch manager at{' '}
            <span className="font-semibold text-gray-700">{targetBranch?.city} — {targetBranch?.name}</span>.
          </p>

          {/* Summary Card */}
          <div className="bg-gray-50 rounded-2xl border border-gray-100 p-6 text-left mb-8 space-y-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Transfer Summary</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">From</p>
                <p className="text-sm font-bold text-gray-900">Mumbai — Fort Branch</p>
                <p className="text-xs text-gray-500">Current Assignment</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">To</p>
                <p className="text-sm font-bold text-gray-900">{targetBranch?.city} — {targetBranch?.name}</p>
                <p className="text-xs text-gray-500">Target Branch</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Reason</p>
                <p className="text-sm font-semibold text-gray-700">{reason?.label}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Status</p>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  <Clock size={10} />
                  Awaiting Approval
                </span>
              </div>
            </div>
          </div>

          {/* What happens next */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 text-left mb-8">
            <h3 className="text-sm font-bold text-gray-900 mb-4">What happens next?</h3>
            <div className="space-y-4">
              {[
                { label: 'Branch Manager Reviews Request', desc: `${targetBranch?.manager} will review your request`, done: false, active: true },
                { label: 'HR Verification', desc: 'HR team validates eligibility and documentation', done: false, active: false },
                { label: 'System Admin Approval', desc: 'Final approval from system administration', done: false, active: false },
                { label: 'Transfer Confirmed', desc: 'You receive a confirmation notification', done: false, active: false },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold mt-0.5 ${
                    item.active ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {i + 1}
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${item.active ? 'text-blue-700' : 'text-gray-600'}`}>{item.label}</p>
                    <p className="text-xs text-gray-400">{item.desc}</p>
                  </div>
                  {item.active && (
                    <span className="ml-auto text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100 shrink-0">
                      In Progress
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => {
              setStep('form');
              setBranchCode('');
              setTargetBranch(null);
              setSelectedReason(null);
              setAdditionalDetails('');
            }}
            className="text-sm text-gray-500 hover:text-gray-700 font-medium underline"
          >
            ← Submit another request
          </button>
        </div>
      </div>
    );
  }

  // ─── Form Screen ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full w-full bg-white font-sans">
      {/* Header */}
      <div className="px-8 pt-8 pb-6 border-b border-gray-100">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm">
            <ArrowRight size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Branch Transfer Request</h1>
            <p className="text-gray-500 text-sm mt-0.5">Submit an official request to transfer to a different branch location.</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 max-w-3xl w-full space-y-6">
        {/* Current Assignment */}
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-4">Your Current Assignment</p>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-lg font-bold shadow-sm">
              AM
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Arjun Mehta</h3>
              <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                <span className="flex items-center gap-1.5">
                  <User size={13} />
                  EMP-4821
                </span>
                <span className="w-1 h-1 rounded-full bg-gray-300" />
                <span className="flex items-center gap-1.5">
                  <MapPin size={13} />
                  Mumbai — Fort Branch
                </span>
                <span className="w-1 h-1 rounded-full bg-gray-300" />
                <span>Compliance Officer</span>
              </div>
            </div>
          </div>
        </div>

        {/* Step 1: Branch Code */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">1</div>
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Enter Target Branch Code</h2>
          </div>

          <div className="flex gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={branchCode}
                onChange={(e) => {
                  setBranchCode(e.target.value);
                  setTargetBranch(null);
                  setBranchError('');
                }}
                onKeyDown={(e) => e.key === 'Enter' && verifyBranch()}
                placeholder="e.g. blr001, del002, 474747..."
                className={`w-full px-4 py-3 border rounded-xl text-sm font-medium focus:outline-none focus:ring-2 transition-all ${
                  targetBranch
                    ? 'border-emerald-300 bg-emerald-50 focus:ring-emerald-200 text-emerald-800'
                    : branchError
                    ? 'border-red-300 bg-red-50 focus:ring-red-200 text-red-800'
                    : 'border-gray-200 focus:ring-blue-200 focus:border-blue-400 text-gray-800'
                }`}
              />
              {targetBranch && (
                <CheckCircle size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500" />
              )}
              {branchError && (
                <X size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500" />
              )}
            </div>
            <button
              onClick={verifyBranch}
              disabled={!branchCode.trim() || verifying}
              className="px-5 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl transition-all flex items-center gap-2"
            >
              {verifying ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                'Verify'
              )}
            </button>
          </div>

          {/* Error */}
          {branchError && (
            <div className="mt-3 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
              <AlertTriangle size={14} className="text-red-500 mt-0.5 shrink-0" />
              <p className="text-sm text-red-700">{branchError}</p>
            </div>
          )}

          {/* Verified Branch Info */}
          {targetBranch && (
            <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle size={15} className="text-emerald-600" />
                    <span className="text-xs font-bold text-emerald-700 uppercase tracking-wide">Branch Verified</span>
                  </div>
                  <h4 className="font-bold text-gray-900 text-base">{targetBranch.city} — {targetBranch.name}</h4>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-xs font-bold text-gray-400 uppercase">Branch Manager:</span>
                    <div className={`w-5 h-5 rounded-full ${targetBranch.managerColor} flex items-center justify-center text-white text-[9px] font-bold`}>
                      {targetBranch.managerInitials}
                    </div>
                    <span className="text-sm font-semibold text-gray-700">{targetBranch.manager}</span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-lg font-bold text-gray-900">{targetBranch.employees}</p>
                    <p className="text-[10px] text-gray-400 font-medium">Employees</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-gray-900">{targetBranch.teams}</p>
                    <p className="text-[10px] text-gray-400 font-medium">Teams</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-emerald-700">{targetBranch.compliance}%</p>
                    <p className="text-[10px] text-gray-400 font-medium">Compliance</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Step 2: Select Reason (only visible after branch verified) */}
        {targetBranch && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">2</div>
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Reason for Transfer</h2>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              {REASONS.map((reason) => (
                <button
                  key={reason.id}
                  onClick={() => setSelectedReason(reason.id)}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    selectedReason === reason.id
                      ? 'border-blue-400 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <div className={`w-4 h-4 rounded-full border-2 mt-0.5 shrink-0 flex items-center justify-center ${
                      selectedReason === reason.id ? 'border-blue-600 bg-blue-600' : 'border-gray-300'
                    }`}>
                      {selectedReason === reason.id && (
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                      )}
                    </div>
                    <div>
                      <p className={`text-sm font-bold ${selectedReason === reason.id ? 'text-blue-800' : 'text-gray-700'}`}>
                        {reason.label}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{reason.desc}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {selectedReason && (
              <textarea
                value={additionalDetails}
                onChange={(e) => setAdditionalDetails(e.target.value)}
                placeholder="Provide additional details to support your request (optional)..."
                rows={3}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 resize-none transition-all"
              />
            )}
          </div>
        )}

        {/* Caution Block */}
        {canSubmit && (
          <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <AlertTriangle size={16} className="text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-bold text-amber-800 mb-1">Before you submit</p>
              <p className="text-xs text-amber-700 leading-relaxed">
                This request will be sent to the Branch Manager at {targetBranch?.city}. Your current team tasks and responsibilities will need to be reassigned upon approval. Approval typically takes 3–7 business days.
              </p>
            </div>
          </div>
        )}

        {/* Submit Button */}
        {targetBranch && (
          <div className="flex justify-end pt-2 pb-8">
            <button
              onClick={handleSubmit}
              disabled={!canSubmit || submitting}
              className="flex items-center gap-2 px-8 py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-blue-100 transition-all"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send size={16} />
                  Submit Transfer Request
                  <ChevronRight size={16} />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
