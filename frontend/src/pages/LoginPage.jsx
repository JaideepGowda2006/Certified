import { useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { FaUserShield, FaUserGraduate, FaBolt } from 'react-icons/fa'

const DEMO_ACCOUNTS = {
  admin: {
    email: 'admin@certified.test',
    password: 'Password123!',
    role: 'admin',
    name: 'Certified Administrator',
    badge: 'Admin Console',
    desc: 'Full issuing, template editing & revocation privileges',
  },
  student: {
    email: 'student@certified.test',
    password: 'Password123!',
    role: 'student',
    name: 'Certified Student',
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
    submitLabel = 'Sign In'
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="glass-panel w-full max-w-lg rounded-3xl p-6 md:p-8">
        <div className="mb-6">
          <p className="text-xs uppercase tracking-[0.26em] text-brand-700">Certified</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">{mode === 'login' ? 'Account Login' : 'Create Account'}</h1>
          <p className="mt-2 text-sm text-slate-600">
            {mode === 'login'
              ? 'Access your portal to verify, manage, or issue certificates.'
              : 'Register as an Admin or Student to get started.'}
          </p>
        </div>

        {/* DEMO MODE SELECTOR CARDS */}
        <div className="mb-6 rounded-2xl border border-brand-200/80 bg-gradient-to-br from-brand-50/70 via-white to-slate-50/50 p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-800">
              <FaBolt className="text-amber-500 animate-pulse" /> 1-Click Demo Login
            </span>
            <span className="text-[11px] text-slate-500 font-medium">Instant Live Role Switch</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              disabled={loading}
              onClick={() => handleQuickDemoLogin('admin')}
              className="group flex flex-col items-start rounded-xl border border-slate-200/90 bg-white p-3 text-left transition hover:border-brand-500 hover:shadow-md hover:ring-2 hover:ring-brand-500/20 active:scale-[0.98] disabled:opacity-50"
            >
              <div className="flex w-full items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-900">
                  <FaUserShield className="text-brand-600" /> Demo Admin
                </span>
                <span className="rounded bg-brand-100 px-1.5 py-0.5 text-[10px] font-semibold text-brand-800">
                  Issuer
                </span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500 leading-tight">
                Full issue, template studio & revoke controls
              </p>
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={() => handleQuickDemoLogin('student')}
              className="group flex flex-col items-start rounded-xl border border-slate-200/90 bg-white p-3 text-left transition hover:border-emerald-500 hover:shadow-md hover:ring-2 hover:ring-emerald-500/20 active:scale-[0.98] disabled:opacity-50"
            >
              <div className="flex w-full items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-900">
                  <FaUserGraduate className="text-emerald-600" /> Demo Student
                </span>
                <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-800">
                  Student
                </span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500 leading-tight">
                View personal awarded credentials & PDF downloads
              </p>
            </button>
          </div>
        </div>

        <div className="mb-5 flex rounded-xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition ${
              mode === 'login' ? 'bg-white text-slate-900 shadow' : 'text-slate-500'
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => setMode('register')}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition ${
              mode === 'register' ? 'bg-white text-slate-900 shadow' : 'text-slate-500'
            }`}
          >
            Register
          </button>
        </div>

        <form className="space-y-4" onSubmit={onSubmit}>
          {mode === 'register' && (
            <>
              <div>
                <label htmlFor="role" className="mb-1 block text-sm font-semibold text-slate-700">
                  Account Role
                </label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={onChange}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-brand-600"
                >
                  <option value="student">Student / User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label htmlFor="name" className="mb-1 block text-sm font-semibold text-slate-700">
                  Full Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={onChange}
                  required
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-brand-600"
                  placeholder="Alex Morgan"
                />
              </div>
              <div>
                <label htmlFor="organization" className="mb-1 block text-sm font-semibold text-slate-700">
                  Organization / University
                </label>
                <input
                  id="organization"
                  name="organization"
                  type="text"
                  value={formData.organization}
                  onChange={onChange}
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-brand-600"
                  placeholder="Northbridge University"
                />
              </div>
            </>
          )}

          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-semibold text-slate-700">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={onChange}
              required
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-brand-600"
              placeholder="issuer@organization.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-semibold text-slate-700">
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
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-brand-600"
              placeholder="Minimum 8 characters"
            />
          </div>

          {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {submitLabel}
          </button>
        </form>

        <p className="mt-5 text-sm text-slate-600">
          Need public verification only?{' '}
          <Link to="/verify/TCX82LM92PQ" className="font-semibold text-brand-700 hover:underline">
            Open Verify Page
          </Link>
        </p>
      </div>
    </div>
  )
}

export default LoginPage
