import { useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { FaUserShield, FaUserGraduate, FaBolt, FaShieldAlt } from 'react-icons/fa'
import ThemeToggle from '../components/ThemeToggle'

const DEMO_ACCOUNTS = {
  admin: {
    email: 'demologin.admin@certified.test',
    password: 'DemoPassword123!',
    role: 'admin',
    name: 'Demo Administrator',
    badge: 'Admin Console',
    desc: 'Full issuing, template editing & revocation privileges',
  },
  student: {
    email: 'demologin.student@certified.test',
    password: 'DemoPassword123!',
    role: 'student',
    name: 'Demo Student',
    badge: 'Student Vault',
    desc: 'View personal awarded credentials & PDF certificates',
  },
}

const LoginPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, register } = useAuth()

  const [mode, setMode] = useState('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    organization: '',
    email: '',
    password: '',
    role: 'student',
  })

  const redirectTo = useMemo(() => location.state?.from || '/dashboard', [location.state])

  const onChange = (event) => {
    setFormData((previous) => ({
      ...previous,
      [event.target.name]: event.target.value,
    }))
  }

  const handleQuickDemoLogin = async (type) => {
    const account = DEMO_ACCOUNTS[type]
    if (!account) return
    setLoading(true)
    setError('')
    setMode('login')
    setFormData((previous) => ({
      ...previous,
      email: account.email,
      password: account.password,
    }))

    try {
      await login({ email: account.email, password: account.password })
      navigate(redirectTo, { replace: true })
    } catch (requestError) {
      const message = requestError.response?.data?.message || 'Demo authentication failed. Please try again.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (mode === 'register') {
        await register(formData)
      } else {
        await login({ email: formData.email, password: formData.password })
      }

      navigate(redirectTo, { replace: true })
    } catch (requestError) {
      const message = requestError.response?.data?.message || 'Authentication failed. Please try again.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  let submitLabel = 'Create Account'
  if (loading) {
    submitLabel = 'Please wait...'
  } else if (mode === 'login') {
    submitLabel = 'Sign In to Certified'
  }

  return (
    <div className="min-h-screen bg-[#fbfbfd] text-[#1d1d1f] dark:bg-[#000000] dark:text-[#f5f5f7] flex items-center justify-center px-4 py-12 transition-colors duration-300">
      <div className="w-full max-w-md rounded-2xl border border-neutral-200/90 dark:border-neutral-850 bg-white/80 dark:bg-neutral-925/80 backdrop-blur-2xl p-7 md:p-8 shadow-apple dark:shadow-apple-dark">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-mono text-xs font-bold">
                C
              </div>
              <span className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-neutral-900 dark:text-white">Certified</span>
            </div>
            <h1 className="mt-4 text-2xl font-semibold tracking-tight text-neutral-950 dark:text-white">
              {mode === 'login' ? 'Authentication' : 'Register Account'}
            </h1>
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
              {mode === 'login'
                ? 'Sign in to access your institutional credential console.'
                : 'Initialize an administrator or candidate account.'}
            </p>
          </div>

          <ThemeToggle compact />
        </div>

        {/* 1-CLICK DEMO MODE SELECTOR CARDS (Apple Passkey / Nothing Style) */}
        <div className="mb-6 rounded-xl border border-neutral-200/80 dark:border-neutral-850 bg-neutral-50/70 dark:bg-neutral-900/60 p-3.5">
          <div className="mb-2.5 flex items-center justify-between">
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-500 dark:text-neutral-400">
              Quick Demo Access
            </span>
            <span className="font-mono text-[9px] text-emerald-600 dark:text-emerald-400">
              READY
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={() => handleQuickDemoLogin('admin')}
              className="flex flex-col items-start rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-925 p-2.5 text-left transition hover:border-neutral-400 dark:hover:border-neutral-600 active:scale-[0.98] disabled:opacity-50"
            >
              <div className="flex w-full items-center justify-between">
                <span className="font-mono text-xs font-bold text-neutral-900 dark:text-white">
                  Admin
                </span>
                <span className="font-mono text-[9px] text-neutral-400">demo</span>
              </div>
              <p className="mt-1 font-mono text-[10px] text-neutral-500 dark:text-neutral-400 leading-tight">
                Issuing & telemetry
              </p>
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={() => handleQuickDemoLogin('student')}
              className="flex flex-col items-start rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-925 p-2.5 text-left transition hover:border-neutral-400 dark:hover:border-neutral-600 active:scale-[0.98] disabled:opacity-50"
            >
              <div className="flex w-full items-center justify-between">
                <span className="font-mono text-xs font-bold text-neutral-900 dark:text-white">
                  Student
                </span>
                <span className="font-mono text-[9px] text-neutral-400">demo</span>
              </div>
              <p className="mt-1 font-mono text-[10px] text-neutral-500 dark:text-neutral-400 leading-tight">
                Vault & downloads
              </p>
            </button>
          </div>
        </div>

        {/* Minimal Segmented Tab Switcher */}
        <div className="mb-5 flex rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-100/70 dark:bg-neutral-900/70 p-1">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`flex-1 rounded-lg py-1.5 text-xs font-medium transition-all ${
              mode === 'login'
                ? 'bg-white dark:bg-neutral-850 text-neutral-950 dark:text-white shadow-xs'
                : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setMode('register')}
            className={`flex-1 rounded-lg py-1.5 text-xs font-medium transition-all ${
              mode === 'register'
                ? 'bg-white dark:bg-neutral-850 text-neutral-950 dark:text-white shadow-xs'
                : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            Create Account
          </button>
        </div>

        <form className="space-y-3.5" onSubmit={onSubmit}>
          {mode === 'register' && (
            <>
              <div>
                <label htmlFor="role" className="mb-1 block text-xs font-medium text-neutral-700 dark:text-neutral-300">
                  Account Role
                </label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={onChange}
                  className="w-full rounded-xl border border-neutral-300 dark:border-neutral-800 bg-transparent px-3.5 py-2 text-xs text-neutral-900 dark:text-white outline-none focus:border-neutral-900 dark:focus:border-white"
                >
                  <option value="student" className="dark:bg-neutral-900">Student / User</option>
                  <option value="admin" className="dark:bg-neutral-900">Admin</option>
                </select>
              </div>
              <div>
                <label htmlFor="name" className="mb-1 block text-xs font-medium text-neutral-700 dark:text-neutral-300">
                  Full Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={onChange}
                  required
                  className="w-full rounded-xl border border-neutral-300 dark:border-neutral-800 bg-transparent px-3.5 py-2 text-xs text-neutral-900 dark:text-white placeholder:text-neutral-400 outline-none focus:border-neutral-900 dark:focus:border-white"
                  placeholder="Alex Morgan"
                />
              </div>
              <div>
                <label htmlFor="organization" className="mb-1 block text-xs font-medium text-neutral-700 dark:text-neutral-300">
                  Organization / University
                </label>
                <input
                  id="organization"
                  name="organization"
                  type="text"
                  value={formData.organization}
                  onChange={onChange}
                  className="w-full rounded-xl border border-neutral-300 dark:border-neutral-800 bg-transparent px-3.5 py-2 text-xs text-neutral-900 dark:text-white placeholder:text-neutral-400 outline-none focus:border-neutral-900 dark:focus:border-white"
                  placeholder="Northbridge University"
                />
              </div>
            </>
          )}

          <div>
            <label htmlFor="email" className="mb-1 block text-xs font-medium text-neutral-700 dark:text-neutral-300">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={onChange}
              required
              className="w-full rounded-xl border border-neutral-300 dark:border-neutral-800 bg-transparent px-3.5 py-2 text-xs text-neutral-900 dark:text-white placeholder:text-neutral-400 outline-none focus:border-neutral-900 dark:focus:border-white"
              placeholder="name@institution.edu"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-xs font-medium text-neutral-700 dark:text-neutral-300">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={onChange}
              required
              minLength={8}
              className="w-full rounded-xl border border-neutral-300 dark:border-neutral-800 bg-transparent px-3.5 py-2 text-xs text-neutral-900 dark:text-white placeholder:text-neutral-400 outline-none focus:border-neutral-900 dark:focus:border-white"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="rounded-xl border border-rose-300/80 bg-rose-50/80 dark:bg-rose-950/50 dark:border-rose-800 px-3.5 py-2 text-xs font-medium text-rose-700 dark:text-rose-300">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 py-2.5 text-xs font-semibold transition hover:opacity-90 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitLabel}
          </button>
        </form>

        <div className="mt-6 flex items-center justify-between border-t border-neutral-200/80 dark:border-neutral-850 pt-4 text-xs text-neutral-500">
          <span>Need public verification?</span>
          <Link to="/verify/TCRHAMY558G4C" className="font-mono text-neutral-900 dark:text-neutral-300 underline decoration-neutral-300 dark:decoration-neutral-700 underline-offset-4 hover:text-black dark:hover:text-white">
            Inspect Sample Record →
          </Link>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
