import { useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

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
  })

  const redirectTo = useMemo(() => location.state?.from || '/dashboard', [location.state])

  const onChange = (event) => {
    setFormData((previous) => ({
      ...previous,
      [event.target.name]: event.target.value,
    }))
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
          <p className="text-xs uppercase tracking-[0.26em] text-brand-700">TrueCert</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">{mode === 'login' ? 'Admin Login' : 'Create Issuer Account'}</h1>
          <p className="mt-2 text-sm text-slate-600">
            {mode === 'login'
              ? 'Access your issuer dashboard to issue and manage certificates.'
              : 'Register your organization and start issuing secure credentials.'}
          </p>
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
                  placeholder="Alex Issuer"
                />
              </div>
              <div>
                <label htmlFor="organization" className="mb-1 block text-sm font-semibold text-slate-700">
                  Organization
                </label>
                <input
                  id="organization"
                  name="organization"
                  type="text"
                  value={formData.organization}
                  onChange={onChange}
                  required
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-brand-600"
                  placeholder="Northbridge Institute"
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
