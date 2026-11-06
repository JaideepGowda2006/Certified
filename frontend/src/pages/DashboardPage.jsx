import { useEffect, useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import api from '../api/client'
import LoadingSpinner from '../components/LoadingSpinner'
import StatusBadge from '../components/StatusBadge'
import { formatDate, formatDateTime } from '../utils/date'
import { useSocket } from '../context/SocketContext'
import { useTheme } from '../context/ThemeContext'

const DashboardPage = () => {
  const { socket } = useSocket()
  const { isDark } = useTheme()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [summary, setSummary] = useState(null)
  const [analytics, setAnalytics] = useState(null)

  const fetchDashboard = async (silent = false) => {
    if (!silent) {
      setLoading(true)
      setError('')
    }

    try {
      const [summaryResponse, analyticsResponse] = await Promise.all([
        api.get('/certificates/summary/dashboard'),
        api.get('/analytics'),
      ])

      setSummary(summaryResponse.data.summary)
      setAnalytics(analyticsResponse.data.analytics)
    } catch (requestError) {
      if (!silent) {
        setError(requestError.response?.data?.message || 'Unable to load dashboard data.')
      }
    } finally {
      if (!silent) {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    fetchDashboard()
  }, [])

  useEffect(() => {
    if (!socket) return

    const handleActivity = () => {
      fetchDashboard(true)
    }

    socket.on('certificate:activity', handleActivity)
    socket.on('certificate:created', handleActivity)
    socket.on('certificate:revoked', handleActivity)
    socket.on('certificate:updated', handleActivity)
    socket.on('certificate:deleted', handleActivity)

    return () => {
      socket.off('certificate:activity', handleActivity)
      socket.off('certificate:created', handleActivity)
      socket.off('certificate:revoked', handleActivity)
      socket.off('certificate:updated', handleActivity)
      socket.off('certificate:deleted', handleActivity)
    }
  }, [socket])

  const cards = useMemo(() => {
    if (!summary) {
      return []
    }

    return [
      { label: 'Total Issued', value: summary.totalCertificates, index: '01' },
      { label: 'Active Credentials', value: summary.activeCertificates, index: '02' },
      { label: 'Revoked Records', value: summary.revokedCertificates, index: '03' },
      { label: 'Expired Records', value: summary.expiredCertificates, index: '04' },
      { label: 'Total Telemetry Scans', value: summary.totalScans, index: '05' },
    ]
  }, [summary])

  if (loading) {
    return <LoadingSpinner label="Loading telemetry metrics..." />
  }

  if (error) {
    return (
      <div className="rounded-xl border border-rose-300/80 bg-rose-50/80 dark:bg-rose-950/50 p-4 text-xs font-medium text-rose-700 dark:text-rose-300">
        {error}
      </div>
    )
  }

  const lastIssuedCertificate = summary?.lastIssuedCertificate || null

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-2">
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400 dark:text-neutral-500">Telemetry & Command</p>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-950 dark:text-white md:text-3xl">Console Overview</h1>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/70 px-3 py-1 font-mono text-[11px] text-neutral-600 dark:text-neutral-300 shadow-xs">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>REAL-TIME STREAM ACTIVE</span>
        </div>
      </div>

      {/* Nothing / Sony Minimalist Metrics Cards */}
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map((card) => (
          <article
            key={card.label}
            className="flex flex-col justify-between rounded-xl border border-neutral-200/90 dark:border-neutral-850 bg-white/80 dark:bg-neutral-925/80 p-4 shadow-apple dark:shadow-apple-dark transition hover:border-neutral-300 dark:hover:border-neutral-700"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-[9px] uppercase tracking-wider text-neutral-400 dark:text-neutral-500">{card.label}</span>
              <span className="font-mono text-[10px] font-bold text-neutral-300 dark:text-neutral-700">{card.index}</span>
            </div>
            <p className="mt-3 font-mono text-2xl font-semibold tracking-tight text-neutral-950 dark:text-white">{card.value}</p>
          </article>
        ))}
      </section>

      {/* Chart & Last Issued Certificate */}
      <section className="grid gap-5 lg:grid-cols-[1.4fr_0.6fr]">
        <article className="rounded-2xl border border-neutral-200/90 dark:border-neutral-850 bg-white/80 dark:bg-neutral-925/80 p-5 md:p-6 shadow-apple dark:shadow-apple-dark">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-850">
            <div>
              <h2 className="text-sm font-semibold tracking-tight text-neutral-950 dark:text-white">Validation Telemetry</h2>
              <p className="font-mono text-xs text-neutral-400 dark:text-neutral-500">Public scan activity over time</p>
            </div>
          </div>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics?.scansPerDay || []} margin={{ top: 8, right: 18, left: -14, bottom: 0 }}>
                <defs>
                  <linearGradient id="scanGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.5} />
                    <stop offset="50%" stopColor="#06b6d4" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(203, 213, 225, 0.4)'}
                  vertical={false}
                />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: isDark ? '#94a3b8' : '#64748b' }} stroke={isDark ? '#334155' : '#cbd5e1'} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: isDark ? '#94a3b8' : '#64748b' }} stroke={isDark ? '#334155' : '#cbd5e1'} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(16px)',
                    borderRadius: '1rem',
                    border: isDark ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid rgba(255, 255, 255, 0.8)',
                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: isDark ? '#f8fafc' : '#0f172a',
                  }}
                />
                <Area type="monotone" dataKey="scans" stroke="#6366f1" strokeWidth={2.5} fill="url(#scanGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="liquid-glass rounded-3xl p-5 md:p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="pb-3 border-b border-slate-200/50 dark:border-white/10">
              <h2 className="text-base font-bold tracking-tight text-slate-900 dark:text-white">Latest Credential</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Most recently registered artifact</p>
            </div>

            {lastIssuedCertificate ? (
              <div className="liquid-glass-subtle mt-4 space-y-3 rounded-2xl p-4 border border-white/80 dark:border-white/10">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Candidate</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{lastIssuedCertificate.candidateName}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Award Title</p>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{lastIssuedCertificate.certificateTitle}</p>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Status</p>
                  <StatusBadge status={lastIssuedCertificate.status} />
                </div>
              </div>
            ) : (
              <p className="mt-4 text-xs text-slate-500">No certificates issued yet.</p>
            )}
          </div>

          {lastIssuedCertificate && (
            <p className="mt-4 text-[11px] text-slate-400 font-medium">
              Timestamp: {formatDate(lastIssuedCertificate.createdAt)}
            </p>
          )}
        </article>
      </section>

      {/* Recent Activity Log */}
      <section className="liquid-glass rounded-3xl p-5 md:p-6 shadow-sm">
        <div className="pb-3 border-b border-slate-200/50 dark:border-white/10">
          <h2 className="text-base font-bold tracking-tight text-slate-900 dark:text-white">Recent Audit Stream</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Live feed of issuing, verification and revocation events</p>
        </div>

        {summary?.recentActivity?.length ? (
          <div className="mt-4 space-y-2.5">
            {summary.recentActivity.map((item, index) => (
              <article
                key={`${item.type}-${item.certificateId}-${index}`}
                className="liquid-glass-subtle flex items-center justify-between rounded-2xl p-3.5 border border-white/70 dark:border-white/10 transition hover:bg-white/85 dark:hover:bg-slate-800/80"
              >
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{item.message}</p>
                  <p className="text-[10px] text-slate-400 font-medium">{formatDateTime(item.timestamp)}</p>
                </div>
                <span className="rounded-full bg-slate-100/90 dark:bg-slate-800 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  {item.type || 'Audit'}
                </span>
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-xs text-slate-500">No recent activity stream found.</p>
        )}
      </section>
    </div>
  )
}

export default DashboardPage
