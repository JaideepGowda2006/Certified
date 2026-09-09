import { NavLink, useNavigate } from 'react-router-dom'
import { FaChartLine, FaFileSignature, FaHome, FaListUl, FaQrcode, FaSignOutAlt } from 'react-icons/fa'
import PropTypes from 'prop-types'
import { useAuth } from '../context/AuthContext'

const navItems = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    icon: FaHome,
  },
  {
    to: '/create-certificate',
    label: 'Create Certificate',
    icon: FaFileSignature,
  },
  {
    to: '/certificates',
    label: 'Issued Certificates',
    icon: FaListUl,
  },
  {
    to: '/analytics',
    label: 'Analytics',
    icon: FaChartLine,
  },
  {
    to: '/verify',
    label: 'Verify Certificate',
    icon: FaQrcode,
  },
]

const baseNavClass =
  'group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200'

const AppShell = ({ children }) => {
  const navigate = useNavigate()
  const { logout, user } = useAuth()

  const onLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <header className="glass-panel sticky top-0 z-30 border-b border-slate-200/60 bg-gradient-to-r from-brand-50/70 to-white px-4 py-4 md:hidden">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-500">Certified</p>
            <h1 className="text-xl font-bold text-slate-900">Issuer Console</h1>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-7xl gap-6 px-4 py-6 md:px-6">
        <aside className="glass-panel sticky top-6 hidden h-[calc(100vh-3rem)] w-72 rounded-3xl p-5 md:flex md:flex-col">
          <div className="mb-7">
            <p className="text-xs uppercase tracking-wider text-brand-700">Certified</p>
            <h2 className="text-2xl font-bold text-slate-900">Issuer Console</h2>
            <p className="mt-2 text-sm text-slate-600">{user?.organization || 'Organization'}</p>
            <div className="mt-3 inline-flex rounded-lg bg-brand-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-brand-700">
              {user?.role || 'issuer'} mode
            </div>
          </div>

          <nav className="flex flex-1 flex-col gap-2">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `${baseNavClass} ${
                      isActive
                        ? 'bg-brand-600 text-white shadow-soft'
                        : 'bg-white/70 text-slate-700 hover:bg-slate-100'
                    }`
                  }
                >
                  <Icon className="text-base" />
                  <span>{item.label}</span>
                </NavLink>
              )
            })}
          </nav>

          <button
            type="button"
            onClick={onLogout}
            className="mt-6 flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            <FaSignOutAlt />
            Logout
          </button>
        </aside>

        <main className="w-full">
          <div className="mb-5 flex items-center justify-between rounded-2xl bg-white/70 px-4 py-3 shadow-soft md:hidden">
            <div>
              <p className="text-xs text-slate-500">Signed in as</p>
              <p className="text-sm font-semibold text-slate-900">{user?.name || 'Issuer'}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">Role</p>
              <p className="text-sm font-semibold text-brand-700">{user?.role || 'issuer'}</p>
            </div>
          </div>
          <div className="page-fade-in">{children}</div>
        </main>
      </div>

      <nav className="glass-panel fixed bottom-3 left-1/2 z-30 flex w-[calc(100%-1.5rem)] -translate-x-1/2 items-center justify-around rounded-2xl border border-slate-200/80 px-2 py-2 md:hidden">
        {navItems.map((item) => {
          const Icon = item.icon

          return (
            <NavLink
              key={`mobile-${item.to}`}
              to={item.to}
              className={({ isActive }) =>
                `flex min-w-0 flex-col items-center gap-1 rounded-xl px-2 py-2 text-[11px] font-semibold transition ${
                  isActive ? 'bg-brand-600 text-white' : 'text-slate-600'
                }`
              }
            >
              <Icon className="text-base" />
              <span className="truncate">{item.label.split(' ')[0]}</span>
            </NavLink>
          )
        })}
      </nav>
    </div>
  )
}

AppShell.propTypes = {
  children: PropTypes.node.isRequired,
}

export default AppShell
