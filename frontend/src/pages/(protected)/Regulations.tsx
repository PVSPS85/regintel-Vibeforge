import {
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Clock,
  Download,
  FileText,
  Send,
  Shield,
  Sparkles,
  Upload,
  Users,
  Zap,
} from 'lucide-react';
import { useCallback, useRef, useState } from 'react';

// ─── Types ─────────────────────────────────────────────────────────────────────

type AppState = 'idle' | 'loading' | 'analyzed' | 'distributed';

interface ActionPoint {
  id: string;
  team: string;
  teamInitials: string;
  teamColor: string;
  priority: 'High' | 'Medium' | 'Low';
  action: string;
  deadline: string;
  distributed: boolean;
}

interface RegulationLog {
  id: string;
  title: string;
  date: string;
  teams: number;
  source: 'AI' | 'Upload';
  status: 'Distributed' | 'Pending' | 'Review';
}

// ─── Mock Data ─────────────────────────────────────────────────────────────────

const ACTION_POINTS: ActionPoint[] = [
  {
    id: 'ap1',
    team: 'IT Security',
    teamInitials: 'IS',
    teamColor: 'bg-[#030213]',
    priority: 'High',
    action: 'Implement multi-factor authentication for all internal portals by Q3 2026',
    deadline: '30 Jun 2026',
    distributed: false,
  },
  {
    id: 'ap2',
    team: 'Compliance',
    teamInitials: 'CO',
    teamColor: 'bg-emerald-600',
    priority: 'High',
    action: 'Update KYC documentation procedures to align with RBI Circular 2026/04 standards',
    deadline: '28 Jun 2026',
    distributed: false,
  },
  {
    id: 'ap3',
    team: 'Risk Management',
    teamInitials: 'RM',
    teamColor: 'bg-rose-500',
    priority: 'Medium',
    action: 'Conduct quarterly risk assessment review for all high-value accounts',
    deadline: '15 Jul 2026',
    distributed: false,
  },
  {
    id: 'ap4',
    team: 'Legal',
    teamInitials: 'LE',
    teamColor: 'bg-violet-600',
    priority: 'Medium',
    action: 'Review and update internal credit policy documentation per circular guidelines',
    deadline: '20 Jul 2026',
    distributed: false,
  },
  {
    id: 'ap5',
    team: 'Retail Banking',
    teamInitials: 'RB',
    teamColor: 'bg-amber-500',
    priority: 'Low',
    action: 'Train front-office staff on updated customer onboarding regulatory requirements',
    deadline: '01 Aug 2026',
    distributed: false,
  },
];

const REGULATION_LOGS: RegulationLog[] = [
  { id: 'rl1', title: 'RBI Circular 2026/04 — Cyber Security Framework', date: 'Today, 09:14 AM', teams: 5, source: 'Upload', status: 'Distributed' },
  { id: 'rl2', title: 'KYC Compliance Policy Update — FY26', date: 'Yesterday, 14:30 PM', teams: 3, source: 'AI', status: 'Distributed' },
  { id: 'rl3', title: 'Anti-Money Laundering (AML) Policy Revision', date: 'Jun 22, 11:05 AM', teams: 4, source: 'Upload', status: 'Review' },
  { id: 'rl4', title: 'SEBI Circular — Insider Trading Regulations FY26', date: 'Jun 20, 09:00 AM', teams: 2, source: 'AI', status: 'Pending' },
];

// ─── Loading Steps ─────────────────────────────────────────────────────────────

const LOADING_STEPS = [
  { label: 'Extracting text from PDF...', icon: FileText },
  { label: 'Running AI analysis engine...', icon: Sparkles },
  { label: 'Identifying affected teams...', icon: Users },
  { label: 'Generating action points...', icon: Zap },
  { label: 'Preparing distribution package...', icon: Send },
];

// ─── Priority Badge ─────────────────────────────────────────────────────────────

const PriorityBadge = ({ priority }: { priority: ActionPoint['priority'] }) => {
  const colors = {
    High: 'bg-red-50 text-red-700 border-red-100',
    Medium: 'bg-amber-50 text-amber-700 border-amber-100',
    Low: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${colors[priority]}`}>
      {priority}
    </span>
  );
};

// ─── Status Badge ───────────────────────────────────────────────────────────────

const StatusBadge = ({ status }: { status: RegulationLog['status'] }) => {
  const cfg = {
    Distributed: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    Pending: 'bg-amber-50 text-amber-700 border-amber-100',
    Review: 'bg-blue-50 text-blue-700 border-blue-100',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold border uppercase tracking-wider ${cfg[status]}`}>
      {status}
    </span>
  );
};

// ─── Main Component ─────────────────────────────────────────────────────────────

export default function Regulations() {
  const [appState, setAppState] = useState<AppState>('idle');
  const [loadingStep, setLoadingStep] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: string } | null>(null);
  const [actionPoints, setActionPoints] = useState<ActionPoint[]>(ACTION_POINTS);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [distributing, setDistributing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Upload handlers ───────────────────────────────────────────────────────────

  const triggerUpload = useCallback(() => fileInputRef.current?.click(), []);

  const handleFile = useCallback((file: File) => {
    if (!file.name.endsWith('.pdf')) return;
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    setUploadedFile({ name: file.name, size: `${sizeMB} MB` });
    startAnalysis();
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  // ── Analysis simulation ────────────────────────────────────────────────────────

  const startAnalysis = () => {
    setAppState('loading');
    setLoadingStep(0);
    setLoadingProgress(0);

    let step = 0;
    let progress = 0;
    const totalSteps = LOADING_STEPS.length;

    const stepInterval = setInterval(() => {
      step += 1;
      setLoadingStep(step);
      if (step >= totalSteps) {
        clearInterval(stepInterval);
        setTimeout(() => {
          setAppState('analyzed');
        }, 600);
      }
    }, 900);

    const progressInterval = setInterval(() => {
      progress += 2;
      setLoadingProgress(Math.min(progress, 98));
      if (progress >= 98) clearInterval(progressInterval);
    }, 90);
  };

  // ── Distribute ────────────────────────────────────────────────────────────────

  const handleDistribute = () => {
    setDistributing(true);
    setTimeout(() => {
      setActionPoints((prev) => prev.map((ap) => ({ ...ap, distributed: true })));
      setDistributing(false);
      setAppState('distributed');
    }, 1800);
  };

  const handleReset = () => {
    setAppState('idle');
    setUploadedFile(null);
    setLoadingStep(0);
    setLoadingProgress(0);
    setActionPoints(ACTION_POINTS);
  };

  // ─── Render: Loading Screen ──────────────────────────────────────────────────

  if (appState === 'loading') {
    return (
      <div className="flex flex-col h-full w-full bg-white items-center justify-center p-12">
        <div className="max-w-md w-full text-center">
          {/* Animated Shield */}
          <div className="w-20 h-20 rounded-2xl bg-blue-600 flex items-center justify-center mx-auto mb-8 shadow-lg shadow-blue-200 animate-pulse">
            <Shield size={36} className="text-white" />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">Analyzing Regulation</h2>
          <p className="text-gray-500 text-sm mb-2">
            {uploadedFile?.name || 'RBI_Circular_2026.pdf'}
          </p>

          {/* Progress Bar */}
          <div className="w-full bg-gray-100 rounded-full h-2 mb-8 overflow-hidden">
            <div
              className="h-2 bg-blue-600 rounded-full transition-all duration-300"
              style={{ width: `${loadingProgress}%` }}
            />
          </div>

          {/* Steps */}
          <div className="space-y-3 text-left">
            {LOADING_STEPS.map((step, index) => {
              const Icon = step.icon;
              const done = index < loadingStep;
              const active = index === loadingStep;
              return (
                <div
                  key={index}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                    done ? 'bg-emerald-50' : active ? 'bg-blue-50 border border-blue-200' : 'opacity-30'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                    done ? 'bg-emerald-500 text-white' : active ? 'bg-blue-600 text-white animate-pulse' : 'bg-gray-200 text-gray-400'
                  }`}>
                    {done ? <CheckCircle size={14} /> : <Icon size={14} />}
                  </div>
                  <span className={`text-sm font-medium ${done ? 'text-emerald-700' : active ? 'text-blue-700' : 'text-gray-400'}`}>
                    {step.label}
                  </span>
                  {done && <CheckCircle size={14} className="ml-auto text-emerald-500" />}
                  {active && <div className="ml-auto w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ─── Render: Analysis Results ────────────────────────────────────────────────

  if (appState === 'analyzed' || appState === 'distributed') {
    const isDistributed = appState === 'distributed';
    const teamsAffected = [...new Set(actionPoints.map((ap) => ap.team))];

    return (
      <div className="flex flex-col h-full w-full bg-white font-sans">
        {/* Header */}
        <div className="px-8 pt-8 pb-6 border-b border-gray-100">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm shrink-0">
                <FileText size={22} className="text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-xl font-bold text-gray-900">
                    {uploadedFile?.name || 'RBI_Cyber_Security_Circular_2026.pdf'}
                  </h1>
                  {isDistributed && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle size={11} />
                      Distributed
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>{uploadedFile?.size || '2.4 MB'}</span>
                  <span className="w-1 h-1 rounded-full bg-gray-300" />
                  <span>Uploaded just now</span>
                  <span className="w-1 h-1 rounded-full bg-gray-300" />
                  <span className="text-blue-600 font-medium flex items-center gap-1">
                    <Sparkles size={12} />
                    AI Analyzed
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <Download size={15} />
                Download
              </button>
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Upload size={15} />
                Upload New
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
              <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">Extracted Text</p>
              <p className="text-3xl font-bold text-blue-900">4,821</p>
              <p className="text-xs text-blue-600 mt-1">Words processed by AI</p>
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-5">
              <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-2">Teams Affected</p>
              <p className="text-3xl font-bold text-amber-900">{teamsAffected.length}</p>
              <p className="text-xs text-amber-600 mt-1">Departments notified</p>
            </div>
            <div className="bg-purple-50 border border-purple-100 rounded-xl p-5">
              <p className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-2">Action Points</p>
              <p className="text-3xl font-bold text-purple-900">{actionPoints.length}</p>
              <p className="text-xs text-purple-600 mt-1">Tasks auto-generated</p>
            </div>
          </div>

          {/* Summary Text */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={16} className="text-blue-600" />
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">AI Summary</h3>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">
              This RBI circular mandates strengthened cyber security frameworks for all scheduled commercial banks. It introduces mandatory multi-factor authentication requirements for internal portals, revised KYC documentation protocols aligned with digital verification standards, and enhanced monitoring obligations for suspicious transaction reporting. All branches must comply by Q3 FY26. Non-compliance will result in regulatory penalties under Section 47A of the Banking Regulation Act, 1949.
            </p>
          </div>

          {/* Affected Teams */}
          <div>
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Users size={14} />
              Affected Teams
            </h3>
            <div className="flex flex-wrap gap-2">
              {teamsAffected.map((team) => {
                const ap = actionPoints.find((a) => a.team === team)!;
                return (
                  <div key={team} className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
                    isDistributed ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-gray-200'
                  }`}>
                    <div className={`w-6 h-6 rounded-md ${ap.teamColor} flex items-center justify-center text-white text-[9px] font-bold`}>
                      {ap.teamInitials}
                    </div>
                    <span className="text-sm font-medium text-gray-700">{team}</span>
                    {isDistributed && <CheckCircle size={13} className="text-emerald-500" />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Points */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <Zap size={14} />
                Generated Action Points
              </h3>
              {isDistributed && (
                <span className="text-xs font-medium text-emerald-600 flex items-center gap-1">
                  <CheckCircle size={12} />
                  All distributed to teams
                </span>
              )}
            </div>

            <div className="space-y-3">
              {actionPoints.map((ap) => (
                <div
                  key={ap.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isDistributed
                      ? 'bg-emerald-50/30 border-emerald-100'
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg ${ap.teamColor} flex items-center justify-center text-white text-[10px] font-bold shrink-0 mt-0.5`}>
                      {ap.teamInitials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="text-[11px] font-bold text-gray-500 uppercase">{ap.team}</span>
                        <PriorityBadge priority={ap.priority} />
                        {isDistributed && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase tracking-wider">
                            <CheckCircle size={9} />
                            Sent
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-800 font-medium leading-relaxed">{ap.action}</p>
                      <div className="flex items-center gap-1.5 mt-2">
                        <Clock size={12} className="text-gray-400" />
                        <span className="text-[11px] text-gray-500">Deadline: {ap.deadline}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Distribute Button or Success State */}
          {!isDistributed ? (
            <div className="border border-dashed border-blue-200 rounded-xl p-6 bg-blue-50/30 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-gray-900 mb-1">Ready to Distribute</h4>
                <p className="text-sm text-gray-500">
                  Action points will be sent to all {teamsAffected.length} team workspaces automatically.
                </p>
              </div>
              <button
                onClick={handleDistribute}
                disabled={distributing}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-100 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {distributing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Distributing...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Distribute to Teams
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="border border-emerald-200 rounded-xl p-6 bg-emerald-50 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                <CheckCircle size={24} className="text-emerald-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-emerald-900 mb-0.5">Successfully Distributed!</h4>
                <p className="text-sm text-emerald-700">
                  All {actionPoints.length} action points have been distributed to {teamsAffected.length} team workspaces. Team leaders have been notified.
                </p>
              </div>
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-4 py-2 bg-white text-emerald-700 font-bold text-sm rounded-lg border border-emerald-200 hover:bg-emerald-100 transition-colors"
              >
                Upload Another
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── Render: Idle (Upload Screen) ────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full w-full bg-white font-sans">
      {/* Header */}
      <div className="px-8 pt-8 pb-0">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Regulations</h1>
        <p className="text-gray-500 text-sm mt-1">
          Upload RBI/SEBI/FIU circulars — AI will extract text, identify teams, and generate action points automatically.
        </p>
      </div>

      <div className="flex gap-8 p-8 flex-1 min-h-0">
        {/* Left: Upload Area */}
        <div className="flex-1 flex flex-col gap-6">
          {/* Drop Zone */}
          <div
            className={`flex-1 min-h-[280px] border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-4 cursor-pointer transition-all ${
              dragOver
                ? 'border-blue-400 bg-blue-50'
                : 'border-gray-200 bg-gray-50/50 hover:border-blue-300 hover:bg-blue-50/30'
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={triggerUpload}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={handleFileInput}
            />

            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${
              dragOver ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-blue-600'
            }`}>
              <Upload size={28} />
            </div>

            <div className="text-center">
              <p className="text-base font-bold text-gray-800 mb-1">
                {dragOver ? 'Drop PDF here to analyze' : 'Upload Regulation PDF'}
              </p>
              <p className="text-sm text-gray-500">
                Drag & drop or <span className="text-blue-600 font-semibold">click to browse</span>
              </p>
              <p className="text-xs text-gray-400 mt-1">PDF files only · Max 50MB</p>
            </div>

            <div className="flex items-center gap-4 mt-2">
              {['RBI Circulars', 'SEBI Notices', 'FIU Guidelines', 'Internal Policy'].map((tag) => (
                <span key={tag} className="px-3 py-1 bg-white border border-gray-200 rounded-full text-xs text-gray-500 font-medium">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Demo button */}
          <button
            onClick={() => {
              setUploadedFile({ name: 'RBI_Cyber_Security_Circular_2026.pdf', size: '2.4 MB' });
              startAnalysis();
            }}
            className="flex items-center justify-center gap-2 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-100 transition-all"
          >
            <Sparkles size={17} />
            Demo: Analyze Sample Regulation
            <ArrowRight size={16} />
          </button>
        </div>

        {/* Right: Recent Logs */}
        <div className="w-80 shrink-0 flex flex-col gap-4">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Recent Regulation Logs</h3>

          <div className="space-y-3">
            {REGULATION_LOGS.map((log) => (
              <div
                key={log.id}
                className="bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md hover:border-gray-200 transition-all cursor-pointer"
                onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
              >
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      log.source === 'AI' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'
                    }`}>
                      {log.source === 'AI' ? <Sparkles size={16} /> : <FileText size={16} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 leading-tight truncate">{log.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{log.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Users size={11} />
                      <span>{log.teams} teams</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={log.status} />
                      <ChevronDown
                        size={14}
                        className={`text-gray-400 transition-transform ${expandedLog === log.id ? 'rotate-180' : ''}`}
                      />
                    </div>
                  </div>
                </div>

                {expandedLog === log.id && (
                  <div className="px-4 pb-4 border-t border-gray-50 pt-3">
                    <div className="flex gap-2">
                      <button className="flex items-center gap-1 text-xs font-medium text-blue-600 bg-blue-50 px-2.5 py-1.5 rounded-lg hover:bg-blue-100 transition-colors">
                        <ChevronRight size={12} />
                        View Details
                      </button>
                      <button className="flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-50 px-2.5 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                        <Download size={12} />
                        Download
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Info Card */}
          <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl mt-2">
            <div className="flex items-start gap-2">
              <AlertTriangle size={14} className="text-amber-600 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-700 leading-relaxed">
                <span className="font-bold">Only Branch Managers</span> and System Admins can upload regulations. Distributed action points are automatically assigned to team leaders.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
