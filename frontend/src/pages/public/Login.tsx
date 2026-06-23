import {
  Building2,
  Eye,
  EyeOff,
  FileCheck2,
  Lock,
  Mail,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router';

// ─── Types ────────────────────────────────────────────────────────────────────

interface LoginFormValues {
  email: string;
  password: string;
}

// ─── Feature bullet points (left panel) ──────────────────────────────────────

const FEATURES = [
  {
    icon: <ShieldCheck size={18} className="text-indigo-400 mt-0.5 shrink-0" />,
    title: 'AI-Powered Compliance',
    desc: 'Real-time regulatory analysis across 40+ jurisdictions.',
  },
  {
    icon: <Zap size={18} className="text-indigo-400 mt-0.5 shrink-0" />,
    title: 'Instant Regulation Alerts',
    desc: 'Be notified the moment rules change — before it affects you.',
  },
  {
    icon: <FileCheck2 size={18} className="text-indigo-400 mt-0.5 shrink-0" />,
    title: 'Automated Action Points',
    desc: 'Turn regulatory obligations into trackable team tasks.',
  },
  {
    icon: <Building2 size={18} className="text-indigo-400 mt-0.5 shrink-0" />,
    title: 'Branch-Level Oversight',
    desc: 'Role-based access from branch officer to system admin.',
  },
];

// ─── Login Page ───────────────────────────────────────────────────────────────

const Login = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ mode: 'onTouched' });

  const onSubmit = async (_data: LoginFormValues) => {
    // Simulate async auth — replace with real API call
    await new Promise((r) => setTimeout(r, 800));
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex font-sans">

      {/* ── Left panel ── */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: '#030213' }}
        aria-hidden="true"
      >
        {/* Subtle radial glow */}
        <div
          className="pointer-events-none absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #4f46e5 0%, transparent 70%)' }}
        />
        <div
          className="pointer-events-none absolute -bottom-32 -right-32 w-[400px] h-[400px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #818cf8 0%, transparent 70%)' }}
        />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-extrabold text-base"
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
            <p className="text-indigo-400 text-sm font-semibold tracking-widest uppercase">
              Regulatory Intelligence Platform
            </p>
            <h1 className="text-white text-4xl font-extrabold leading-[1.18] tracking-tight max-w-sm">
              Banking Compliance.{' '}
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: 'linear-gradient(90deg, #818cf8, #c4b5fd)' }}
              >
                Made Intelligent.
              </span>
            </h1>
          </div>

          {/* Feature bullets */}
          <ul className="space-y-5">
            {FEATURES.map(({ icon, title, desc }) => (
              <li key={title} className="flex items-start gap-3">
                {icon}
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
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center bg-white px-6 py-12 sm:px-12">
        {/* Mobile logo */}
        <div className="flex items-center gap-2.5 mb-10 lg:hidden">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-extrabold text-sm"
            style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' }}
          >
            R
          </div>
          <span className="font-semibold text-gray-900 text-[15px]">RegIntel</span>
        </div>

        <div className="w-full max-w-[400px] space-y-8">

          {/* Heading */}
          <div className="space-y-1.5">
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
              Welcome back
            </h2>
            <p className="text-[14px] text-gray-500">
              Sign in to your RegIntel workspace.
            </p>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className="space-y-5"
          >
            {/* Work email */}
            <div className="space-y-1.5">
              <label
                htmlFor="login-email"
                className="block text-[13px] font-semibold text-gray-700"
              >
                Work Email
              </label>
              <div className="relative">
                <Mail
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@bank.com"
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? 'login-email-err' : undefined}
                  className={`
                    w-full h-11 pl-10 pr-4 rounded-lg border text-[14px] text-gray-900
                    bg-gray-50 placeholder:text-gray-400 outline-none
                    transition-[border-color,box-shadow] duration-150
                    focus:bg-white focus:border-indigo-500 focus:ring-3 focus:ring-indigo-500/20
                    ${errors.email
                      ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20'
                      : 'border-gray-200'
                    }
                  `}
                  {...register('email', {
                    required: 'Work email is required.',
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: 'Enter a valid email address.',
                    },
                  })}
                />
              </div>
              {errors.email && (
                <p id="login-email-err" role="alert" className="text-[12px] text-red-500 font-medium">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="login-password"
                  className="block text-[13px] font-semibold text-gray-700"
                >
                  Password
                </label>
                <button
                  type="button"
                  className="text-[12px] font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? 'login-pw-err' : undefined}
                  className={`
                    w-full h-11 pl-10 pr-11 rounded-lg border text-[14px] text-gray-900
                    bg-gray-50 placeholder:text-gray-400 outline-none
                    transition-[border-color,box-shadow] duration-150
                    focus:bg-white focus:border-indigo-500 focus:ring-3 focus:ring-indigo-500/20
                    ${errors.password
                      ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20'
                      : 'border-gray-200'
                    }
                  `}
                  {...register('password', {
                    required: 'Password is required.',
                    minLength: { value: 6, message: 'Password must be at least 6 characters.' },
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword
                    ? <EyeOff size={16} aria-hidden="true" />
                    : <Eye size={16} aria-hidden="true" />
                  }
                </button>
              </div>
              {errors.password && (
                <p id="login-pw-err" role="alert" className="text-[12px] text-red-500 font-medium">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="
                w-full h-11 rounded-lg text-[14px] font-semibold text-white
                flex items-center justify-center gap-2
                transition-[opacity,transform] duration-150
                disabled:opacity-60 disabled:cursor-not-allowed
                hover:opacity-90 active:scale-[0.985]
              "
              style={{ background: '#030213' }}
            >
              {isSubmitting ? (
                <>
                  <span
                    className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
                    aria-hidden="true"
                  />
                  Signing in…
                </>
              ) : (
                'Sign in to RegIntel'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-[12px] text-gray-400 font-medium">New to RegIntel?</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          {/* Request access */}
          <p className="text-center text-[13px] text-gray-500">
            Don't have an account?{' '}
            <Link
              to="/request-access"
              className="font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              Request access →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
