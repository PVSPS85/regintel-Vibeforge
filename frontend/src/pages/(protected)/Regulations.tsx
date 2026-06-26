import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  Upload,
  FileText,
  Zap,
  Users,
  Send,
  Shield,
  Check,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../contexts/AuthContext';

// ─── Types ────────────────────────────────────────────────────────────────────
type ViewState = 'upload' | 'analyzing' | 'analyzed';

const STEPS = [
  { id: 1, label: 'Upload PDF', sub: 'RBI / SEBI / FIU circular', icon: Upload },
  { id: 2, label: 'AI Extracts', sub: 'Text & key clauses', icon: FileText },
  { id: 3, label: 'AI Analyzes', sub: 'Action points generated', icon: Zap },
  { id: 4, label: 'Maps Teams', sub: 'Identifies affected teams', icon: Users },
  { id: 5, label: 'Distributes Tasks', sub: 'Assigns to workspaces', icon: Send },
  { id: 6, label: 'Track Completion', sub: 'Monitor team progress', icon: Shield },
];

const RECENT_UPLOADS = [
  { id: 1, name: 'SEBI_LODR_Amendment_2024.pdf', date: 'Jun 12', status: 'DISTRIBUTED' },
  { id: 2, name: 'FIU_AML_Guidelines_v3.pdf', date: 'Jun 08', status: 'UNDER REVIEW' },
];

const AFFECTED_TEAMS = [
  {
    id: 'it',
    name: 'IT Security',
    abbr: 'IT',
    desc: 'System Updates Required',
    color: 'bg-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-100',
    tasks: 2,
    severity: 'HIGH'
  },
  {
    id: 'co',
    name: 'Compliance',
    abbr: 'Co',
    desc: 'Process Overhaul',
    color: 'bg-emerald-500',
    bg: 'bg-emerald-50',
    border: 'border-emerald-100',
    tasks: 2,
    severity: 'HIGH'
  },
  {
    id: 'le',
    name: 'Legal',
    abbr: 'Le',
    desc: 'Documentation Update',
    color: 'bg-amber-500',
    bg: 'bg-amber-50',
    border: 'border-amber-100',
    tasks: 1,
    severity: 'MEDIUM'
  },
  {
    id: 'hr',
    name: 'HR',
    abbr: 'HR',
    desc: 'Staff Training Required',
    color: 'bg-purple-500',
    bg: 'bg-purple-50',
    border: 'border-purple-100',
    tasks: 1,
    severity: 'MEDIUM'
  }
];

const ACTION_POINTS = [
  { id: 1, text: 'Update Video-CIP system to comply with new RBI technical specifications', team: 'IT Security', due: 'Jun 20' },
  { id: 2, text: 'Conduct re-KYC for all dormant accounts inactive for more than 2 years', team: 'Compliance', due: 'Jun 28' },
  { id: 3, text: 'Revise Customer Onboarding SOP with new beneficial ownership requirements', team: 'Legal', due: 'Jun 25' },
  { id: 4, text: 'Train all branch staff on updated KYC procedures (mandatory e-learning)', team: 'HR', due: 'Jul 05' },
  { id: 5, text: 'Update IT systems to automatically flag high-risk customers', team: 'IT Security', due: 'Jun 22' },
  { id: 6, text: 'Submit compliance certification to Head Office within 15 days', team: 'Compliance', due: 'Jun 25' },
];

const Regulations = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  
  const [view, setView] = useState<ViewState>('upload');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Animation states for Analyzing view
  const [progress, setProgress] = useState(0);

  const triggerUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      startAnalysis();
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      startAnalysis();
    }
  };

  const startAnalysis = () => {
    setView('analyzing');
    setProgress(0);
  };

  useEffect(() => {
    if (view === 'analyzing') {
      const interval = setInterval(() => {
        setProgress(p => {
          if (p >= 100) {
            clearInterval(interval);
            setView('analyzed');
            return 100;
          }
          return p + 5; // Takes about 2 seconds
        });
      }, 100);
      return () => clearInterval(interval);
    }
  }, [view]);

  // Determine active step based on view
  const getStepStatus = (stepId: number) => {
    if (view === 'upload') {
      return stepId === 1 ? 'active' : 'pending';
    }
    if (view === 'analyzing') {
      if (stepId <= 2) return 'completed';
      if (stepId === 3) return 'active';
      return 'pending';
    }
    if (view === 'analyzed') {
      if (stepId <= 4) return 'completed';
      if (stepId === 5) return 'active';
      return 'pending';
    }
    return 'pending';
  };

  if (!isAdmin) {
    return (
      <div className="flex-1 overflow-y-auto p-8 bg-[#f9fafb] font-sans flex flex-col items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 text-center max-w-md w-full">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield size={32} />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Access Restricted</h2>
          <p className="text-sm text-gray-500 mb-6">
            Only Branch Managers and System Admins have permission to upload and process new regulatory circulars.
          </p>
          <button 
            onClick={() => navigate('/teams')}
            className="w-full py-2.5 bg-gray-900 hover:bg-black text-white font-bold rounded-lg transition-colors"
          >
            Return to Teams
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#f9fafb] font-sans text-gray-900 min-h-screen pb-32">
      
      {/* ── HEADER ── */}
      <div className="px-8 pt-8">
        <button
          onClick={() => navigate('/teams')}
          className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors mb-4 cursor-pointer"
        >
          <ArrowLeft size={16} /> Back to Teams
        </button>
        
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Regulation Upload & AI Analysis</h1>
        <p className="text-[14px] text-gray-500 mt-1">Upload RBI/SEBI/FIU circulars · AI extracts action points and distributes to teams</p>
      </div>

      <div className="px-8 mt-6">
        
        {/* ── STEPPER ── */}
        <div className="bg-white/80 backdrop-blur-lg border border-white/50 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 mb-6">
          <h3 className="text-[13px] font-bold text-gray-700 mb-6">RegIntel Compliance Workflow</h3>
          <div className="relative flex justify-between">
            {/* Connecting Line */}
            <div className="absolute top-[18px] left-[5%] right-[5%] h-0.5 bg-gray-200 -z-10" />
            <div 
              className="absolute top-[18px] left-[5%] h-0.5 bg-blue-600 -z-10 transition-all duration-500" 
              style={{ width: view === 'upload' ? '0%' : view === 'analyzing' ? '40%' : '75%' }}
            />

            {STEPS.map((step) => {
              const status = getStepStatus(step.id);
              const Icon = step.icon;
              return (
                <div key={step.id} className="flex flex-col items-center w-[16%]">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors shadow-sm mb-3 ${
                    status === 'completed' ? 'bg-blue-600 text-white border-2 border-blue-600' :
                    status === 'active' ? 'bg-blue-600 text-white border-2 border-blue-600' :
                    'bg-white text-gray-400 border-2 border-gray-200'
                  }`}>
                    {status === 'completed' ? <Check size={18} /> : <Icon size={18} />}
                  </div>
                  <p className={`text-[12px] font-bold text-center ${
                    status === 'pending' ? 'text-gray-400' : 'text-gray-900'
                  }`}>
                    {step.label}
                  </p>
                  <p className="text-[10px] text-gray-400 text-center mt-0.5 max-w-[100px] leading-tight">
                    {step.sub}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── VIEW 1: IDLE / UPLOAD ── */}
        {view === 'upload' && (
          <div className="space-y-6">
            <div
              className={`bg-white rounded-xl border-2 border-dashed flex flex-col items-center justify-center py-16 cursor-pointer transition-colors ${
                dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={triggerUpload}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.txt"
                className="hidden"
                onChange={handleFileInput}
              />
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4">
                <Upload size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Drop PDF here or click to upload</h3>
              <p className="text-sm text-gray-500 mb-6">Supports RBI Circulars, SEBI Notifications, FIU Directives · Max 50MB</p>
              
              <div className="flex gap-3">
                {['.PDF', '.DOCX', '.TXT'].map(ext => (
                  <span key={ext} className="px-4 py-1.5 bg-blue-50 text-blue-600 text-xs font-bold rounded-full border border-blue-100">
                    {ext}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-lg border border-white/50 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden mt-6 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(79,70,229,0.1)] hover:border-indigo-500/20">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="text-[13px] font-bold text-gray-700">Recent Uploads</h3>
              </div>
              <div className="divide-y divide-gray-100">
                {RECENT_UPLOADS.map(upload => (
                  <div key={upload.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <FileText size={18} className="text-gray-400" />
                      <span className="text-sm font-medium text-gray-700">{upload.name}</span>
                    </div>
                    <div className="flex items-center gap-6">
                      <span className="text-xs text-gray-400">{upload.date}</span>
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                        upload.status === 'DISTRIBUTED' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-amber-50 text-amber-600 border-amber-200'
                      }`}>
                        {upload.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── VIEW 2: ANALYZING ── */}
        {view === 'analyzing' && (
          <div className="bg-white/80 backdrop-blur-lg border border-white/50 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-12 flex flex-col items-center justify-center min-h-[400px]">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-inner animate-pulse">
              <Zap size={32} />
            </div>
            
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              AI Analyzing: RBI_Master_Direction_KYC_Amendment_2024.pdf
            </h2>
            <p className="text-sm text-gray-500 mb-8 text-center max-w-lg">
              Extracting key directives, identifying affected teams, generating compliance action points...
            </p>
            
            <div className="w-full max-w-md mb-8">
              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600 rounded-full transition-all duration-300 ease-linear"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="text-center mt-2">
                <span className="text-sm font-bold text-blue-600">{progress}% complete</span>
              </div>
            </div>

            <div className="flex justify-center gap-8">
              {[
                { label: 'Extracting text', thres: 25 },
                { label: 'Identifying clauses', thres: 50 },
                { label: 'Generating actions', thres: 75 },
                { label: 'Mapping teams', thres: 100 }
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${progress >= item.thres ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                  <span className={`text-[11px] font-medium ${progress >= item.thres ? 'text-gray-700' : 'text-gray-400'}`}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── VIEW 3: ANALYZED RESULTS ── */}
        {view === 'analyzed' && (
          <div className="space-y-6">
            
            {/* Success Banner */}
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-5 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 leading-tight mb-0.5">
                    RBI_Master_Direction_KYC_Amendment_2024.pdf
                  </h3>
                  <p className="text-[13px] text-gray-500">
                    Uploaded 25 Jun 2026 · 4.2 MB · AI Analysis Complete
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-full text-sm font-bold border border-emerald-200">
                <Check size={16} /> Analyzed
              </div>
            </div>

            {/* Split Content: Preview & Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Extracted Text */}
              <div className="bg-white/80 backdrop-blur-lg border border-white/50 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 flex flex-col h-[320px] transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(79,70,229,0.1)] hover:border-indigo-500/20">
                <h4 className="text-[13px] font-bold text-gray-900 mb-4">Extracted Text Preview</h4>
                <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-4 overflow-y-auto">
                  <pre className="text-[12px] font-mono text-gray-600 leading-relaxed whitespace-pre-wrap">
                    {`RBI/2024-25/102
DBOD.No.BP.BC.102/21.04.048/2024-25
June 10, 2025

All Scheduled Commercial Banks 
(excluding Small Finance Banks and Payments Banks)

Master Direction - Reserve Bank of India (Know Your Customer (KYC))
Directions, 2016 - Amendment

In terms of the provisions of Section 35A of the Banking Regulation Act, 
1949, and the Prevention of Money-Laundering (Maintenance of Records) 
Rules, 2005, it has been decided to amend the Master Direction on KYC...`}
                  </pre>
                </div>
              </div>

              {/* AI Summary */}
              <div className="bg-white/80 backdrop-blur-lg border border-white/50 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 flex flex-col h-[320px] transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(79,70,229,0.1)] hover:border-indigo-500/20">
                <div className="flex items-center gap-2 mb-4">
                  <Zap size={18} className="text-blue-600" />
                  <h4 className="text-[13px] font-bold text-gray-900">AI Summary</h4>
                  <span className="text-[9px] font-bold uppercase tracking-wider bg-blue-50 text-blue-600 px-2 py-0.5 rounded border border-blue-100">
                    AI Generated
                  </span>
                </div>
                
                <p className="text-[14px] text-gray-700 leading-relaxed mb-6">
                  This RBI circular mandates enhanced KYC procedures including updated Video-CIP guidelines, stricter beneficial ownership identification, and mandatory re-KYC for dormant accounts. All affected branches must complete compliance within 30 days.<br/><br/>
                  Impacts: IT Security (system updates), Compliance (process review), Legal (documentation), HR (staff training).
                </p>

                <div className="mt-auto flex items-center gap-2 text-orange-600 font-medium text-[13px]">
                  <AlertTriangle size={16} />
                  Compliance deadline: 30 days from issuance
                </div>
              </div>
            </div>

            {/* Affected Teams */}
            <div className="bg-white/80 backdrop-blur-lg border border-white/50 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(79,70,229,0.1)] hover:border-indigo-500/20">
              <h4 className="text-[13px] font-bold text-gray-900 mb-4">Affected Teams ({AFFECTED_TEAMS.length})</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {AFFECTED_TEAMS.map(team => (
                  <div key={team.id} className={`p-5 rounded-xl border ${team.border} ${team.bg} relative overflow-hidden flex flex-col`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs mb-3 ${team.color}`}>
                      {team.abbr}
                    </div>
                    <h5 className="text-[15px] font-bold text-gray-900 mb-1">{team.name}</h5>
                    <p className="text-[12px] text-gray-600 mb-6">{team.desc}</p>
                    
                    <div className="mt-auto flex items-center justify-between">
                      <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded border ${
                        team.severity === 'HIGH' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-orange-50 text-orange-600 border-orange-200'
                      }`}>
                        {team.severity}
                      </span>
                      <span className="text-[12px] font-bold text-blue-600">{team.tasks} tasks</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Generated Action Points */}
            <div className="bg-white/80 backdrop-blur-lg border border-white/50 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(79,70,229,0.1)] hover:border-indigo-500/20">
              <div className="flex items-center gap-2 mb-6">
                <Zap size={18} className="text-blue-600" />
                <h4 className="text-[13px] font-bold text-gray-900">Generated Action Points ({ACTION_POINTS.length})</h4>
              </div>
              
              <div className="space-y-4">
                {ACTION_POINTS.map(action => (
                  <div key={action.id} className="flex items-start gap-4 p-4 border border-gray-100 hover:border-gray-200 rounded-xl bg-gray-50/50 transition-colors">
                    <div className="w-6 h-6 rounded-full border border-gray-200 bg-white flex items-center justify-center text-[11px] font-bold text-gray-500 shrink-0 mt-0.5">
                      {action.id}
                    </div>
                    <p className="text-[14px] text-gray-800 font-medium flex-1 pt-0.5">
                      {action.text}
                    </p>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span className="flex items-center gap-1 text-[12px] font-medium text-gray-500">
                        <ArrowRight size={12} /> {action.team}
                      </span>
                      <span className="text-[11px] font-medium text-gray-400">
                        Due: {action.due}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}
      </div>

      {/* ── STICKY BOTTOM BAR (View 3 Only) ── */}
      {view === 'analyzed' && (
        <div className="fixed bottom-0 left-[260px] right-0 p-6 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-40">
          <button
            onClick={() => {
              alert('Tasks distributed successfully!');
              setView('upload');
            }}
            className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-base font-bold shadow-md shadow-blue-200 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Send size={18} />
            Distribute Work to {AFFECTED_TEAMS.length} Teams <ArrowRight size={18} />
          </button>
        </div>
      )}

    </div>
  );
};

export default Regulations;
