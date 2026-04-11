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

const DashboardPage = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [summary, setSummary] = useState(null)
  const [analytics, setAnalytics] = useState(null)

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true)
      setError('')

      try {
        const [summaryResponse, analyticsResponse] = await Promise.all([
          api.get('/certificates/summary/dashboard'),
          api.get('/analytics'),
        ])

        setSummary(summaryResponse.data.summary)
        setAnalytics(analyticsResponse.data.analytics)
      } catch (requestError) {
        setError(requestError.response?.data?.message || 'Unable to load dashboard data.')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboard()
  }, [])

  const cards = useMemo(() => {
    if (!summary) {
      return []
    }

    return [
      { label: 'Total Certificates', value: summary.totalCertificates },
      { label: 'Active Certificates', value: summary.activeCertificates },
      { label: 'Revoked Certificates', value: summary.revokedCertificates },
      { label: 'Expired Certificates', value: summary.expiredCertificates },
      { label: 'Total Scans', value: summary.totalScans },
    ]
  }, [summary])

  if (loading) {
    return <LoadingSpinner label="Loading dashboard..." />
  }

  if (error) {
    return <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</p>
  }

  const lastIssuedCertificate = summary?.lastIssuedCertificate || null

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.22em] text-brand-700">Dashboard</p>
        <h1 className="text-3xl font-bold text-slate-900">Issuer Overview</h1>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map((card) => (
          <article key={card.label} className="glass-panel rounded-2xl p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{card.label}</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{card.value}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.4fr_0.6fr]">
        <article className="glass-panel rounded-2xl p-4 md:p-5">
          <h2 className="text-xl font-semibold text-slate-900">Scans Per Day</h2>
          <p className="mt-1 text-sm text-slate-600">Verification traffic trend over time.</p>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics?.scansPerDay || []} margin={{ top: 8, right: 18, left: -14, bottom: 0 }}>
                <defs>
                  <linearGradient id="scanGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0f766e" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke="#dbeafe" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area type="monotone" dataKey="scans" stroke="#0f766e" fill="url(#scanGradient)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="glass-panel rounded-2xl p-4 md:p-5">
          <h2 className="text-xl font-semibold text-slate-900">Last Issued</h2>
          {lastIssuedCertificate ? (
            <div className="mt-3 space-y-3 rounded-xl bg-white/90 p-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Candidate</p>
                <p className="font-semibold text-slate-900">{lastIssuedCertificate.candidateName}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Title</p>
                <p className="font-semibold text-slate-900">{lastIssuedCertificate.certificateTitle}</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-wide text-slate-500">Status</p>
                <StatusBadge status={lastIssuedCertificate.status} />
              </div>
              <p className="text-xs text-slate-500">Issued {formatDate(lastIssuedCertificate.createdAt)}</p>
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-600">No certificates issued yet.</p>
          )}
        </article>
      </section>

      <section className="glass-panel rounded-2xl p-4 md:p-5">
        <h2 className="text-xl font-semibold text-slate-900">Recent Activity</h2>
        {summary?.recentActivity?.length ? (
          <div className="mt-4 space-y-3">
            {summary.recentActivity.map((item, index) => (
              <article key={`${item.type}-${item.certificateId}-${index}`} className="rounded-xl border border-slate-200 bg-white p-3">
                <p className="text-sm font-semibold text-slate-800">{item.message}</p>
                <p className="mt-1 text-xs text-slate-500">{formatDateTime(item.timestamp)}</p>
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-600">No activity available yet.</p>
        )}
      </section>
    </div>
  )
}

export default DashboardPage
