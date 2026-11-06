import { NavLink, useNavigate } from 'react-router-dom'
import { FaChartLine, FaFileSignature, FaHome, FaListUl, FaQrcode, FaSignOutAlt, FaShieldAlt } from 'react-icons/fa'
import PropTypes from 'prop-types'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import RealtimeToastContainer from './RealtimeToastContainer'
import ThemeToggle from './ThemeToggle'

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
  'group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-medium transition-all duration-150'

const AppShell = ({ children }) => {
  const navigate = useNavigate()
  const { logout, user, isAdmin } = useAuth()
  const { isConnected } = useSocket()

  const onLogout = () => {
    logout()
    navigate('/login')
  }

  const roleLabel = isAdmin ? 'Admin' : (user?.role === 'student' || user?.role === 'user' ? 'Student' : user?.role || 'User')
  const visibleNavItems = navItems.filter((item) => {
    if (item.to === '/create-certificate') {
      return isAdmin
    }
    return true
  })

  return (
    <div className="min-h-screen bg-[#fbfbfd] text-[#1d1d1f] dark:bg-[#000000] dark:text-[#f5f5f7] pb-20 md:pb-0 transition-colors duration-300">
      {/* Mobile Top Header */}
      <header className="sticky top-0 z-30 border-b border-black/[0.06] dark:border-white/[0.08] bg-[#fbfbfd]/80 dark:bg-[#000000]/80 backdrop-blur-xl px-4 py-3 md:hidden">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-mono text-xs font-bold">
              C
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-neutral-900 dark:text-white">Certified</p>
                <span className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.2 text-[9px] font-mono ${isConnected ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500'}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                  {isConnected ? 'LIVE' : 'SYNC'}
                </span>
              </div>
              <h1 className="text-sm font-semibold text-neutral-900 dark:text-white">{isAdmin ? 'Admin Console' : 'Student Portal'}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle compact />
            <button
              type="button"
              onClick={onLogout}
              className="rounded-full border border-neutral-200 dark:border-neutral-800 px-3 py-1 text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Desktop Main Layout */}
      <div className="mx-auto flex w-full max-w-7xl gap-6 px-4 py-6 md:px-6">
        {/* Apple/Nothing Minimalist Sidebar */}
        <aside className="sticky top-6 hidden h-[calc(100vh-3rem)] w-64 rounded-2xl border border-neutral-200/80 dark:border-neutral-850 bg-white/70 dark:bg-neutral-925/70 backdrop-blur-xl p-5 md:flex md:flex-col shadow-apple dark:shadow-apple-dark">
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-mono text-xs font-bold">
                  C
                </div>
                <span className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-neutral-900 dark:text-white">Certified</span>
              </div>
              <span
                id="realtime-status-indicator"
                className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-[9px] font-medium ${
                  isConnected
                    ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                    : 'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400'
                }`}
                title={isConnected ? 'Connected to real-time WebSocket server' : 'Connecting to WebSocket server...'}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                {isConnected ? 'LIVE' : 'SYNC'}
              </span>
            </div>

            <h2 className="mt-5 text-lg font-semibold tracking-tight text-neutral-900 dark:text-white">
              {isAdmin ? 'Admin Console' : 'Student Portal'}
            </h2>
            <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400 truncate">{user?.organization || 'Certified Platform'}</p>

            <div className="mt-3 flex items-center justify-between pt-2 border-t border-neutral-100 dark:border-neutral-850">
              <div className="inline-flex items-center gap-1.5 font-mono text-[10px] text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                <span className="h-1.5 w-1.5 rounded-full bg-neutral-400 dark:bg-neutral-500" />
                {roleLabel}
              </div>
              <ThemeToggle compact />
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="flex flex-1 flex-col gap-1">
            {visibleNavItems.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `${baseNavClass} ${
                      isActive
                        ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-semibold shadow-xs'
                        : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100/80 dark:hover:bg-neutral-850/80'
                    }`
                  }
                >
                  <Icon className="text-xs shrink-0" />
                  <span className="truncate">{item.label}</span>
                </NavLink>
              )
            })}
          </nav>

          {/* User Card & Logout */}
          <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-850">
            <div className="mb-3 px-1">
              <p className="font-mono text-[9px] uppercase tracking-wider text-neutral-400">Identity</p>
              <p className="text-xs font-medium text-neutral-900 dark:text-white truncate">{user?.name || user?.email || 'User'}</p>
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 dark:border-neutral-800 py-2 text-xs font-medium text-neutral-600 dark:text-neutral-400 transition hover:bg-neutral-100 dark:hover:bg-neutral-850 hover:text-neutral-900 dark:hover:text-white"
            >
              <FaSignOutAlt className="text-xs" />
              Sign Out
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="w-full min-w-0">
          <div className="mb-5 flex items-center justify-between rounded-xl border border-neutral-200 dark:border-neutral-850 bg-white/70 dark:bg-neutral-925/70 p-3 md:hidden">
            <div>
              <p className="font-mono text-[9px] uppercase tracking-wider text-neutral-400">Identity</p>
              <p className="text-xs font-medium text-neutral-900 dark:text-white truncate">{user?.name || 'User'}</p>
            </div>
            <div className="text-right">
              <p className="font-mono text-[9px] uppercase tracking-wider text-neutral-400">Role</p>
              <p className="text-xs font-medium text-neutral-900 dark:text-white">{roleLabel}</p>
            </div>
          </div>

          <RealtimeToastContainer />
          <div className="page-fade-in">{children}</div>
        </main>
      </div>

      {/* Mobile Bottom Tab Bar */}
      <nav className="fixed bottom-3 left-1/2 z-30 flex w-[calc(100%-1.5rem)] -translate-x-1/2 items-center justify-around rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/90 dark:bg-neutral-925/90 backdrop-blur-xl px-2 py-2 md:hidden shadow-lg">
        {visibleNavItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={`mobile-${item.to}`}
              to={item.to}
              className={({ isActive }) =>
                `flex min-w-0 flex-col items-center gap-1 rounded-xl px-2.5 py-1.5 text-[10px] font-medium transition-all ${
                  isActive
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-semibold'
                    : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`
              }
            >
              <Icon className="text-xs" />
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
