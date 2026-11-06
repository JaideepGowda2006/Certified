import { useEffect, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import api from '../api/client'
import LoadingSpinner from '../components/LoadingSpinner'
import { formatDateTime } from '../utils/date'
import { useTheme } from '../context/ThemeContext'

const AnalyticsPage = () => {
  const { isDark } = useTheme()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [analytics, setAnalytics] = useState(null)

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true)
      setError('')

      try {
        const response = await api.get('/analytics')
        setAnalytics(response.data.analytics)
      } catch (requestError) {
        setError(requestError.response?.data?.message || 'Failed to load analytics.')
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [])

  if (loading) {
    return <LoadingSpinner label="Loading telemetry analytics..." />
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-300/80 bg-rose-50/80 dark:bg-rose-950/50 p-4 text-xs font-semibold text-rose-700 dark:text-rose-300 backdrop-blur-md">
        {error}
      </div>
    )
  }

  const hasRecentScans = (analytics?.recentScans?.length || 0) > 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-indigo-600 dark:text-cyan-400">Verification Intelligence</p>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white md:text-3xl">Scan Telemetry Analytics</h1>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-white/60 dark:bg-slate-800/60 px-3 py-1 text-[11px] font-bold text-indigo-700 dark:text-cyan-300 backdrop-blur-md shadow-xs">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          Active Telemetry Feeds
        </div>
      </div>

      {/* Metric Cards Grid */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Verification Scans', value: analytics?.totalScans || 0, accent: 'from-indigo-500/25 to-blue-500/15' },
          { label: 'Tracked Active Days', value: analytics?.scansPerDay?.length || 0, accent: 'from-cyan-500/25 to-teal-500/15' },
          { label: 'Top Performing Credentials', value: analytics?.topCertificates?.length || 0, accent: 'from-violet-500/25 to-fuchsia-500/15' },
          { label: 'Recent Audit Logs', value: analytics?.recentScans?.length || 0, accent: 'from-amber-500/25 to-orange-500/15' },
        ].map((item) => (
          <article
            key={item.label}
            className="liquid-glass-card relative overflow-hidden rounded-2xl p-5"
          >
            <div className={`pointer-events-none absolute -right-6 -bottom-6 h-20 w-20 rounded-full bg-gradient-to-br ${item.accent} blur-xl`} />
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{item.label}</p>
            <p className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">{item.value}</p>
          </article>
        ))}
      </section>

      {/* Charts Grid */}
      <section className="grid gap-5 lg:grid-cols-2">
        <article className="liquid-glass rounded-3xl p-5 md:p-6 shadow-sm">
          <div className="pb-3 border-b border-slate-200/50 dark:border-white/10">
            <h2 className="text-base font-bold tracking-tight text-slate-900 dark:text-white">Scans Per Day</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Historical public verification volume</p>
          </div>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics?.scansPerDay || []}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(203, 213, 225, 0.4)'} vertical={false} />
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
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                <Line type="monotone" dataKey="scans" stroke="#6366f1" strokeWidth={2.5} name="Total Scans" dot={{ r: 3, fill: '#6366f1' }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="liquid-glass rounded-3xl p-5 md:p-6 shadow-sm">
          <div className="pb-3 border-b border-slate-200/50 dark:border-white/10">
            <h2 className="text-base font-bold tracking-tight text-slate-900 dark:text-white">Top Verified Credentials</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Credentials receiving highest scanner engagement</p>
          </div>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics?.topCertificates || []}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(203, 213, 225, 0.4)'} vertical={false} />
                <XAxis dataKey="certificateId" tick={{ fontSize: 10, fill: isDark ? '#94a3b8' : '#64748b' }} stroke={isDark ? '#334155' : '#cbd5e1'} />
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
                <Bar dataKey="scans" fill="url(#barGradient)" radius={[6, 6, 0, 0]} />
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" />
                    <stop offset="100%" stopColor="#6366f1" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
      </section>

      {/* Recent Scans Activity Log */}
      <section className="liquid-glass rounded-3xl p-5 md:p-6 shadow-sm">
        <div className="pb-3 border-b border-slate-200/50 dark:border-white/10">
          <h2 className="text-base font-bold tracking-tight text-slate-900 dark:text-white">Recent Scanner Access Logs</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Telemetry captures device, browser and geographic origin of verification scans</p>
        </div>

        {hasRecentScans ? (
          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-2 text-xs">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-wider text-slate-400">
                  <th className="px-4 py-2 font-bold">Certificate ID</th>
                  <th className="px-4 py-2 font-bold">Geographic Location</th>
                  <th className="px-4 py-2 font-bold">Device Profile</th>
                  <th className="px-4 py-2 font-bold">Browser Client</th>
                  <th className="px-4 py-2 font-bold text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {analytics.recentScans.map((scan) => (
                  <tr key={`${scan.certificateId}-${scan.scannedAt}`} className="liquid-glass-subtle transition hover:bg-white/85 dark:hover:bg-slate-800/80">
                    <td className="rounded-l-2xl px-4 py-3 font-mono font-bold text-indigo-600 dark:text-cyan-400 border-y border-l border-white/80 dark:border-white/10">
                      {scan.certificateId}
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300 border-y border-white/80 dark:border-white/10">
                      {scan.city}, {scan.country}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300 border-y border-white/80 dark:border-white/10">{scan.device}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300 border-y border-white/80 dark:border-white/10">{scan.browser}</td>
                    <td className="rounded-r-2xl px-4 py-3 text-slate-500 dark:text-slate-400 border-y border-r border-white/80 dark:border-white/10 text-right font-medium">
                      {formatDateTime(scan.scannedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">No verification scans captured yet.</p>
        )}
      </section>
    </div>
  )
}

export default AnalyticsPage
