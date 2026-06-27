import { CheckCircle2, Clock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import api from '../../lib/api';

interface BranchOption {
  id: string;
  name: string;
  code: string;
}

const FALLBACK_BRANCHES: BranchOption[] = [
  { id: '1', name: 'Mumbai Corporate Head Office', code: 'BR-MUM-001' },
  { id: '2', name: 'Bengaluru Tech & Innovation Hub', code: 'BR-BLR-002' },
  { id: '3', name: 'New Delhi Regional Centre', code: 'BR-DEL-003' },
  { id: '4', name: 'Chennai Operations Base', code: 'BR-CHN-004' },
  { id: '5', name: 'Kolkata Retail Clearing Division', code: 'BR-KOL-005' },
  { id: '6', name: 'Hyderabad Risk Management Unit', code: 'BR-HYD-006' },
  { id: '7', name: 'Ahmedabad Treasury & Markets', code: 'BR-AMD-007' },
  { id: '8', name: 'Pune Rural Outreach Branch', code: 'BR-PUN-008' },
  { id: '9', name: 'Jaipur Currency Chest', code: 'BR-JAI-009' },
  { id: '10', name: 'Kochi NRI Banking Division', code: 'BR-KOC-010' },
];

// ─── Feature bullet points (left panel) ──────────────────────────────────────

const FEATURES = [
  {
    title: 'AI-Powered Compliance',
    desc: 'Real-time regulatory analysis across 40+ jurisdictions.',
  },
  {
    title: 'Instant Regulation Alerts',
    desc: 'Be notified the moment rules change — before it affects you.',
  },
  {
    title: 'Automated Action Points',
    desc: 'Turn regulatory obligations into trackable team tasks.',
  },
  {
    title: 'Branch-Level Oversight',
    desc: 'Role-based access from branch officer to system admin.',
  },
];

// ─── Request Access Page ──────────────────────────────────────────────────────

const RequestAccess = () => {
  const navigate = useNavigate();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [branches, setBranches] = useState<BranchOption[]>(FALLBACK_BRANCHES);

  useEffect(() => {
    api.get<BranchOption[]>('/branches/')
      .then((res) => {
        if (res.data && res.data.length > 0) {
          setBranches(res.data);
        }
      })
      .catch(() => {
        // Ignore errors and keep fallback branches
      });
  }, []);
  
  // Form fields
  const [fullName, setFullName] = useState('');
  const [empId, setEmpId] = useState('');
  const [email, setEmail] = useState('');
  const [branchCode, setBranchCode] = useState('');
  const [department, setDepartment] = useState('');
  const [selectedRole, setSelectedRole] = useState('Employee');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // UI states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      await api.post('/auth/request-access', {
        name: fullName,
        email: email,
        password: password,
        branch_code: branchCode.trim(),
      });
      setIsSubmitted(true);
    } catch (err: any) {
      const detail = err.response?.data?.detail ?? 'Failed to submit access request. Verify your branch code.';
      setErrorMsg(detail);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex font-sans">
      {/* ── Left panel ── */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden bg-blue-600"
        aria-hidden="true"
      >
        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-md flex items-center justify-center text-white font-extrabold text-base"
            style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' }}
          >
            R
          </div>
          <span className="text-white font-semibold text-[15px] tracking-tight">
            RegIntel
          </span>
        </div>

        {/* Hero copy */}
        <div className="relative z-10 space-y-10">
          <div className="space-y-4">
            <p className="text-blue-100 text-sm font-semibold tracking-widest uppercase">
              Regulatory Intelligence Platform
            </p>
            <h1 className="text-white text-4xl font-extrabold leading-[1.18] tracking-tight max-w-sm">
              Banking Compliance. Made Intelligent.
            </h1>
          </div>

          {/* Feature bullets */}
          <ul className="space-y-5">
            {FEATURES.map(({ title, desc }) => (
              <li key={title} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full border border-white flex items-center justify-center shrink-0 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">{title}</p>
                  <p className="text-white/50 text-[13px] leading-snug mt-0.5">{desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom footnote */}
        <p className="relative z-10 text-white/25 text-xs">
          © 2026 RegIntel. All rights reserved.
        </p>
      </div>

      {/* ── Right panel ── */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center bg-white px-6 py-12 sm:px-12 relative overflow-y-auto">
        
        {/* Top switcher */}
        {!isSubmitted && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 flex bg-gray-100 p-1 rounded-full text-xs font-semibold">
            <Link
              to="/login"
              className="px-4 py-1.5 rounded-full text-gray-500 hover:text-gray-900 transition-all"
            >
              Sign In
            </Link>
            <Link
              to="/request-access"
              className="px-4 py-1.5 rounded-full bg-white text-gray-900 shadow-sm transition-all"
            >
              Request Access
            </Link>
          </div>
        )}

        {/* Mobile logo */}
        <div className="flex items-center gap-2.5 mb-10 lg:hidden">
          <div
            className="w-8 h-8 rounded-md flex items-center justify-center text-white font-extrabold text-sm"
            style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' }}
          >
            R
          </div>
          <span className="font-semibold text-gray-900 text-[15px]">RegIntel</span>
        </div>

        <div className="w-full max-w-[480px] space-y-8 lg:mt-10">
          {!isSubmitted ? (
            <>
              {/* Heading */}
              <div className="space-y-1.5">
                <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                  Request platform access
                </h2>
                <p className="text-[14px] text-gray-500">
                  Submit your details — your branch admin will review and approve
                </p>
              </div>

              {errorMsg && (
                <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2.5 text-red-700 text-sm font-medium">
                  <AlertCircle size={18} className="shrink-0 text-red-600" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Row 1 */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[13px] font-semibold text-gray-700">
                      Full Name
                    </label>
                    <input
                      required
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Arjun Mehta"
                      className="w-full h-11 px-4 rounded-md border border-gray-300 text-[14px] text-gray-900 bg-white placeholder-gray-400 outline-none transition-colors focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[13px] font-semibold text-gray-700">
                      Employee ID
                    </label>
                    <input
                      required
                      type="text"
                      value={empId}
                      onChange={(e) => setEmpId(e.target.value)}
                      placeholder="EMP-102"
                      className="w-full h-11 px-4 rounded-md border border-gray-300 text-[14px] text-gray-900 bg-white placeholder-gray-400 outline-none transition-colors focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                    />
                  </div>
                </div>

                {/* Row 2 */}
                <div className="space-y-1.5">
                  <label className="block text-[13px] font-semibold text-gray-700">
                    Work Email
                  </label>
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="arjun@bank.com"
                    className="w-full h-11 px-4 rounded-md border border-gray-300 text-[14px] text-gray-900 bg-white placeholder-gray-400 outline-none transition-colors focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                  />
                </div>

                {/* Row 3 */}
                <div className="space-y-1.5">
                  <label className="block text-[13px] font-semibold text-gray-700">
                    Branch Selection
                  </label>
                  <div className="relative">
                    <select
                      required
                      value={branchCode}
                      onChange={(e) => setBranchCode(e.target.value)}
                      className="w-full h-11 px-4 pr-10 rounded-md border border-gray-300 text-[14px] text-gray-900 bg-white outline-none transition-colors focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 appearance-none cursor-pointer"
                    >
                      <option value="" disabled>Select your branch...</option>
                      {branches.map((b) => (
                        <option key={b.code} value={b.code}>
                          {b.name} ({b.code})
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                      <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                      </svg>
                    </div>
                  </div>
                  {branchCode && (
                    <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-md text-sm font-medium">
                      <CheckCircle2 size={16} />
                      Selected Branch Code: {branchCode}
                    </div>
                  )}
                </div>

                {/* Row 4 */}
                <div className="space-y-1.5">
                  <label className="block text-[13px] font-semibold text-gray-700">
                    Department
                  </label>
                  <div className="relative">
                    <select
                      required
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full h-11 px-4 pr-10 rounded-md border border-gray-300 text-[14px] text-gray-900 bg-white outline-none transition-colors focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 appearance-none cursor-pointer"
                    >
                      <option value="" disabled>Select department...</option>
                      <option value="compliance">Compliance</option>
                      <option value="risk">Risk Management</option>
                      <option value="audit">Internal Audit</option>
                      <option value="legal">Legal</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                      <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Row 5 */}
                <div className="space-y-2 pt-1">
                  <label className="block text-[13px] font-semibold text-gray-700">
                    Role
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div
                      onClick={() => setSelectedRole('Employee')}
                      className={`cursor-pointer p-4 rounded-xl border transition-all ${
                        selectedRole === 'Employee'
                          ? 'border-blue-600 bg-blue-50/50 shadow-sm ring-1 ring-blue-600'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <h4 className={`font-semibold text-sm ${selectedRole === 'Employee' ? 'text-blue-700' : 'text-gray-900'}`}>
                        Employee
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">Standard branch access</p>
                    </div>
                    <div
                      onClick={() => setSelectedRole('Team Leader')}
                      className={`cursor-pointer p-4 rounded-xl border transition-all ${
                        selectedRole === 'Team Leader'
                          ? 'border-blue-600 bg-blue-50/50 shadow-sm ring-1 ring-blue-600'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <h4 className={`font-semibold text-sm ${selectedRole === 'Team Leader' ? 'text-blue-700' : 'text-gray-900'}`}>
                        Team Leader
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">Manage team tasks</p>
                    </div>
                    <div
                      onClick={() => setSelectedRole('Branch Manager')}
                      className={`cursor-pointer p-4 rounded-xl border transition-all ${
                        selectedRole === 'Branch Manager'
                          ? 'border-blue-600 bg-blue-50/50 shadow-sm ring-1 ring-blue-600'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <h4 className={`font-semibold text-sm ${selectedRole === 'Branch Manager' ? 'text-blue-700' : 'text-gray-900'}`}>
                        Branch Manager
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">Full branch oversight</p>
                    </div>
                    <div
                      onClick={() => setSelectedRole('Auditor')}
                      className={`cursor-pointer p-4 rounded-xl border transition-all ${
                        selectedRole === 'Auditor'
                          ? 'border-blue-600 bg-blue-50/50 shadow-sm ring-1 ring-blue-600'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <h4 className={`font-semibold text-sm ${selectedRole === 'Auditor' ? 'text-blue-700' : 'text-gray-900'}`}>
                        Auditor
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">Read-only global access</p>
                    </div>
                  </div>
                </div>

                {/* Row 6 */}
                <div className="grid grid-cols-2 gap-4 pt-1">
                  <div className="space-y-1.5">
                    <label className="block text-[13px] font-semibold text-gray-700">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        required
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full h-11 px-4 pr-11 rounded-md border border-gray-300 text-[14px] text-gray-900 bg-white placeholder-gray-400 outline-none transition-colors focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[13px] font-semibold text-gray-700">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <input
                        required
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full h-11 px-4 pr-11 rounded-md border border-gray-300 text-[14px] text-gray-900 bg-white placeholder-gray-400 outline-none transition-colors focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                      >
                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 rounded-md text-[14px] font-semibold text-white bg-blue-600 hover:bg-blue-700 flex items-center justify-center transition-all mt-6 active:scale-[0.985] disabled:opacity-60 cursor-pointer"
                >
                  {isLoading ? 'Submitting Request...' : 'Request Branch Access'}
                </button>
              </form>

              {/* Sign In link */}
              <p className="text-center text-[13px] text-gray-500 pt-2">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Sign In →
                </Link>
              </p>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center text-center space-y-6 w-full animate-in fade-in zoom-in duration-300">
              <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center shadow-sm border border-amber-100">
                <Clock className="text-amber-500" size={30} strokeWidth={2.5} />
              </div>
              <div className="space-y-2">
                <h2 className="text-[22px] font-bold text-gray-900 tracking-tight">
                  Awaiting Branch Manager Approval
                </h2>
                <p className="text-[14px] text-gray-500 max-w-[340px] mx-auto leading-relaxed">
                  Your access request has been securely logged in PostgreSQL. You will receive access once your branch manager approves your role.
                </p>
              </div>

              <div className="w-full border border-gray-200 rounded-xl overflow-hidden bg-white text-left shadow-sm mt-2">
                <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50/80 flex justify-between items-center">
                  <span className="text-[13px] font-semibold text-gray-900">Request Summary</span>
                  <span className="text-[12px] font-semibold text-amber-700 bg-amber-100/80 px-2.5 py-0.5 rounded-full border border-amber-200/60">
                    Pending approval
                  </span>
                </div>
                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[12px] text-gray-500 font-medium mb-1 uppercase tracking-wider">Employee ID</p>
                      <p className="text-[14px] text-gray-900 font-semibold">{empId || 'EMP-102'}</p>
                    </div>
                    <div>
                      <p className="text-[12px] text-gray-500 font-medium mb-1 uppercase tracking-wider">Department</p>
                      <p className="text-[14px] text-gray-900 font-semibold capitalize">{department || 'Compliance'}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[12px] text-gray-500 font-medium mb-1 uppercase tracking-wider">Branch Code</p>
                      <p className="text-[14px] text-gray-900 font-semibold">{branchCode || 'BR-MUM-001'}</p>
                    </div>
                    <div>
                      <p className="text-[12px] text-gray-500 font-medium mb-1 uppercase tracking-wider">Requested Role</p>
                      <p className="text-[14px] text-gray-900 font-semibold">{selectedRole}</p>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => navigate('/login')}
                className="w-full h-11 rounded-md text-[14px] font-semibold text-white bg-blue-600 hover:bg-blue-700 flex items-center justify-center transition-all mt-4 active:scale-[0.985] cursor-pointer"
              >
                Return to Login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RequestAccess;
